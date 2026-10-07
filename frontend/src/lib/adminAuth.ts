// Admin proof for the beneficiaries API.
//
// The backend only serves beneficiary records to a program admin. The admin
// proves who they are by signing a short message with their wallet. The
// signature is kept for the browser session, so the wallet asks once.

const SESSION_MS = 7 * 60 * 60 * 1000 // backend accepts 8h, renew a bit earlier
const STORAGE_KEY = 'subsidies-admin-proof'

type AdminProof = { address: string; timestamp: number; signature: string }

// Must match buildAdminMessage in backend/src/auth.ts exactly.
export function buildAdminMessage(address: string, timestamp: number): string {
  return [
    'ReFi Colombia Subsidies',
    'Sign to access beneficiary records as an admin.',
    `Address: ${address.toLowerCase()}`,
    `Issued at: ${timestamp}`,
  ].join('\n')
}

function readStoredProof(address: string): AdminProof | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const proof = JSON.parse(raw) as AdminProof
    const fresh = Date.now() - proof.timestamp < SESSION_MS
    const sameWallet = proof.address === address.toLowerCase()
    return fresh && sameWallet ? proof : null
  } catch {
    return null
  }
}

// One signing request at a time, even if several queries start together.
let pending: Promise<AdminProof> | null = null

export async function getAdminHeaders(
  address: string,
  signMessage: (args: { message: string }) => Promise<string>
): Promise<Record<string, string>> {
  let proof = readStoredProof(address)

  if (!proof) {
    if (!pending) {
      const timestamp = Date.now()
      pending = signMessage({ message: buildAdminMessage(address, timestamp) })
        .then((signature) => {
          const created = { address: address.toLowerCase(), timestamp, signature }
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(created))
          } catch {
            // Storage can be blocked. The proof still works for this request.
          }
          return created
        })
        .finally(() => {
          pending = null
        })
    }
    proof = await pending
  }

  return {
    'x-admin-address': proof.address,
    'x-admin-timestamp': String(proof.timestamp),
    'x-admin-signature': proof.signature,
  }
}

export function clearAdminProof() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // nothing to clear
  }
}
