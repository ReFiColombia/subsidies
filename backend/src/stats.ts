// Program stats read from the ReFi Colombia subsidies subgraph.
// The subgraph follows the chain block by block, so these numbers are always
// current. The saved Dune results are only used as a fallback.

const SUBGRAPH_URL =
  process.env.SUBGRAPH_URL ??
  'https://api.studio.thegraph.com/query/1757108/refi-colombia-subsidies/version/latest';

const WEI = 10n ** 18n;

export interface ProgramStats {
  fundsAdded: number;
  fundsDistributed: number;
  recipients: number;
  contractBalance: number;
}

export interface MonthlyRow {
  month: string; // MM-YYYY
  distributed: number;
}

const toTokens = (wei: string): number => Number(BigInt(wei) / WEI);

async function query<T>(q: string): Promise<T> {
  const res = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: q }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Subgraph responded ${res.status}`);
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length || !body.data) {
    throw new Error(body.errors?.[0]?.message ?? 'Empty subgraph response');
  }
  return body.data;
}

export async function getProgramStats(): Promise<ProgramStats> {
  const data = await query<{
    funds_collection: {
      totalSupplied: string;
      totalClaimed: string;
      contractBalance: string;
    }[];
    beneficiaries: { id: string }[];
  }>(`{
    funds_collection(first: 1) { totalSupplied totalClaimed contractBalance }
    beneficiaries(first: 1000, where: { totalClaimed_gt: "0" }) { id }
  }`);

  const funds = data.funds_collection[0];
  if (!funds) throw new Error('No funds entity in subgraph');

  return {
    fundsAdded: toTokens(funds.totalSupplied),
    fundsDistributed: toTokens(funds.totalClaimed),
    recipients: data.beneficiaries.length,
    contractBalance: toTokens(funds.contractBalance),
  };
}

export async function getMonthlyDistributed(): Promise<MonthlyRow[]> {
  const days: { date: string; totalAmount: string }[] = [];
  let lastDate = '0';
  // Page by date so the result is not capped at 1000 days.
  for (;;) {
    const page = await query<{ dailyClaims: { date: string; totalAmount: string }[] }>(`{
      dailyClaims(first: 1000, orderBy: date, orderDirection: asc, where: { date_gt: "${lastDate}" }) {
        date
        totalAmount
      }
    }`);
    days.push(...page.dailyClaims);
    if (page.dailyClaims.length < 1000) break;
    lastDate = page.dailyClaims[page.dailyClaims.length - 1].date;
  }

  const byMonth = new Map<string, bigint>();
  for (const day of days) {
    const d = new Date(Number(day.date) * 1000);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    byMonth.set(key, (byMonth.get(key) ?? 0n) + BigInt(day.totalAmount));
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, wei]) => {
      const [year, month] = key.split('-');
      return { month: `${month}-${year}`, distributed: Number(wei / WEI) };
    });
}
