import type { NextFunction, Request, Response } from 'express';
import { createPublicClient, http, isAddress, verifyMessage } from 'viem';
import { celo } from 'viem/chains';

// Admin access to beneficiary records.
//
// The records hold names and phone numbers, so every /api/beneficiaries route
// requires proof that the caller is a program admin. The proof is a wallet
// signature over a short message with a timestamp. Admins are the owner of
// the SubsidyProgram contract plus any address listed in ADMIN_ADDRESSES.

const SUBSIDY_CONTRACT_ADDRESS = (process.env.SUBSIDY_CONTRACT_ADDRESS ||
  '0x947C6dB1569edc9fd37B017B791cA0F008AB4946') as `0x${string}`;

// How long a signed message stays valid. The admin signs once per session.
export const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;
// Tolerance for a client clock that runs ahead of the server.
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const OWNER_CACHE_MS = 5 * 60 * 1000;

const client = createPublicClient({
  chain: celo,
  transport: http(process.env.CELO_RPC_URL || 'https://forno.celo.org'),
});

const OWNER_ABI = [
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
] as const;

let ownerCache: { address: string; fetchedAt: number } | null = null;

async function getContractOwner(): Promise<string | null> {
  if (ownerCache && Date.now() - ownerCache.fetchedAt < OWNER_CACHE_MS) {
    return ownerCache.address;
  }
  try {
    const owner = await client.readContract({
      address: SUBSIDY_CONTRACT_ADDRESS,
      abi: OWNER_ABI,
      functionName: 'owner',
    });
    ownerCache = { address: owner.toLowerCase(), fetchedAt: Date.now() };
    return ownerCache.address;
  } catch {
    // If the RPC is down, keep using the last known owner rather than
    // locking the admin out. With no known owner, only ADMIN_ADDRESSES work.
    return ownerCache?.address ?? null;
  }
}

function extraAdmins(): string[] {
  return (process.env.ADMIN_ADDRESSES || '')
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter((a) => isAddress(a));
}

export async function isAdmin(address: string): Promise<boolean> {
  const candidate = address.toLowerCase();
  if (extraAdmins().includes(candidate)) return true;
  const owner = await getContractOwner();
  return owner !== null && owner === candidate;
}

// Must match buildAdminMessage in frontend/src/lib/adminAuth.ts exactly.
export function buildAdminMessage(address: string, timestamp: number): string {
  return [
    'ReFi Colombia Subsidies',
    'Sign to access beneficiary records as an admin.',
    `Address: ${address.toLowerCase()}`,
    `Issued at: ${timestamp}`,
  ].join('\n');
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const address = req.header('x-admin-address');
  const timestampHeader = req.header('x-admin-timestamp');
  const signature = req.header('x-admin-signature');

  if (!address || !timestampHeader || !signature) {
    return res.status(401).json({ error: 'Admin signature required' });
  }
  if (!isAddress(address) || !/^0x[0-9a-fA-F]+$/.test(signature)) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const timestamp = Number(timestampHeader);
  const age = Date.now() - timestamp;
  if (!Number.isFinite(timestamp) || age > ADMIN_SESSION_MS || age < -CLOCK_SKEW_MS) {
    return res.status(401).json({ error: 'Admin signature expired' });
  }

  let valid = false;
  try {
    valid = await verifyMessage({
      address: address as `0x${string}`,
      message: buildAdminMessage(address, timestamp),
      signature: signature as `0x${string}`,
    });
  } catch {
    valid = false;
  }
  if (!valid) {
    return res.status(401).json({ error: 'Invalid admin signature' });
  }

  if (!(await isAdmin(address))) {
    return res.status(403).json({ error: 'Not an admin of the program' });
  }

  next();
}

// Browsers may only call the API from these sites. Extra origins can be added
// with ALLOWED_ORIGINS (comma separated).
export function allowedOrigins(): string[] {
  const defaults = [
    'https://subsidios.reficolombia.org',
    'https://subsidies-frontend-production.up.railway.app',
    'https://subsidies-reficolombia.vercel.app',
    'http://localhost:5173',
  ];
  const extra = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return [...defaults, ...extra];
}
