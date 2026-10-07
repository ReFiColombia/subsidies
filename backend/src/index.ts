import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { isAddress } from 'viem';
import { DuneClient } from '@duneanalytics/client-sdk';
import { allowedOrigins, isAdmin, requireAdmin } from './auth.js';
import { getMonthlyDistributed, getProgramStats } from './stats.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Dune Analytics
const dune = new DuneClient(process.env.DUNE_API_KEY ?? '');
const DUNE_QUERY_STATS = 6272760;
const DUNE_QUERY_MONTHLY = 6272762;
const DUNE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const duneCache: Record<string, CacheEntry<unknown>> = {};

app.use(cors({ origin: allowedOrigins() }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Tells the frontend whether a wallet may open the admin panel. It only
// answers yes or no for an address that is already public, and grants nothing:
// the records themselves still need a signature.
app.get('/api/admin/check/:address', async (req, res) => {
  const { address } = req.params;
  if (!isAddress(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address' });
  }
  res.json({ isAdmin: await isAdmin(address) });
});

// Beneficiary records hold personal data. Every route below this line needs
// an admin signature (see auth.ts).
app.use('/api/beneficiaries', requireAdmin);

// Get all beneficiaries
app.get('/api/beneficiaries', async (req, res) => {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(beneficiaries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch beneficiaries' });
  }
});

// Get beneficiary by address
app.get('/api/beneficiaries/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { address: address.toLowerCase() }
    });

    if (!beneficiary) {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }

    res.json(beneficiary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch beneficiary' });
  }
});

// Create new beneficiary
app.post('/api/beneficiaries', async (req, res) => {
  try {
    const { address, name, phoneNumber, responsable } = req.body;

    if (!address || !name) {
      return res.status(400).json({ error: 'Address and name are required' });
    }

    if (!isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const beneficiary = await prisma.beneficiary.create({
      data: {
        address: address.toLowerCase(),
        name,
        phoneNumber: phoneNumber || null,
        responsable: responsable || null
      }
    });

    res.status(201).json(beneficiary);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Beneficiary with this address already exists' });
    }
    res.status(500).json({ error: 'Failed to create beneficiary' });
  }
});

// Update beneficiary
app.put('/api/beneficiaries/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { name, phoneNumber, responsable } = req.body;

    if (!isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const beneficiary = await prisma.beneficiary.update({
      where: { address: address.toLowerCase() },
      data: {
        ...(name && { name }),
        phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
        responsable: responsable !== undefined ? responsable : undefined
      }
    });

    res.json(beneficiary);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }
    res.status(500).json({ error: 'Failed to update beneficiary' });
  }
});

// Delete beneficiary
app.delete('/api/beneficiaries/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    await prisma.beneficiary.delete({
      where: { address: address.toLowerCase() }
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }
    res.status(500).json({ error: 'Failed to delete beneficiary' });
  }
});

// Batch get beneficiaries by addresses
app.post('/api/beneficiaries/batch', async (req, res) => {
  try {
    const { addresses } = req.body;

    if (!Array.isArray(addresses)) {
      return res.status(400).json({ error: 'Addresses must be an array' });
    }

    const validAddresses = addresses.filter(addr => isAddress(addr)).map(addr => addr.toLowerCase());

    const beneficiaries = await prisma.beneficiary.findMany({
      where: {
        address: {
          in: validAddresses
        }
      }
    });

    res.json(beneficiaries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch beneficiaries' });
  }
});

// Program stats (funds added, distributed, recipients, balance).
// Source: the subsidies subgraph. Falls back to the saved Dune result if the
// subgraph cannot be reached. The path keeps its old name for the frontend.
app.get('/api/dune/stats', async (req, res) => {
  const cached = duneCache['stats'];
  if (cached && Date.now() - cached.timestamp < DUNE_CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const data = await getProgramStats();
    duneCache['stats'] = { data, timestamp: Date.now() };
    return res.json(data);
  } catch (error: any) {
    console.error('Subgraph stats error, trying Dune:', error.message);
  }

  try {
    const result = await dune.getLatestResult({ queryId: DUNE_QUERY_STATS });
    const row = result.result?.rows?.[0];

    if (!row) {
      return res.status(404).json({ error: 'No data available' });
    }

    res.json({
      fundsAdded: Number(row['Funds Added']),
      fundsDistributed: Number(row['Distributed']),
      recipients: Number(row['Recipients']),
      contractBalance: Number(row['Delta (Added - Distributed)']),
    });
  } catch (error: any) {
    console.error('Dune stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch program stats' });
  }
});

// Subsidies distributed per month. Same source and fallback as above.
app.get('/api/dune/monthly', async (req, res) => {
  const cached = duneCache['monthly'];
  if (cached && Date.now() - cached.timestamp < DUNE_CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const data = await getMonthlyDistributed();
    if (data.length > 0) {
      duneCache['monthly'] = { data, timestamp: Date.now() };
      return res.json(data);
    }
  } catch (error: any) {
    console.error('Subgraph monthly error, trying Dune:', error.message);
  }

  try {
    const result = await dune.getLatestResult({ queryId: DUNE_QUERY_MONTHLY });
    const rows = result.result?.rows;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No data available' });
    }

    res.json(
      rows.map((row: Record<string, unknown>) => ({
        month: row['Month'] as string,
        distributed: Number(row['Distributed']),
      }))
    );
  } catch (error: any) {
    console.error('Dune monthly error:', error.message);
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
});

// Bind unconditionally for long-running hosts (Railway, local dev).
// The default export is kept for potential test / serverless reuse.
export default app;

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Fallback: force exit after 10s if close hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
