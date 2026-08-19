/** Daily ceiling for AI Gateway spend triggered by background/admin jobs. */
export const DAILY_AI_BUDGET_USD = 5;

/** openai/text-embedding-3-small pricing, USD per 1M tokens. */
export const EMBED_USD_PER_MTOKEN = 0.02;

export function estimateTokens(input: string | string[]): number {
  const texts = Array.isArray(input) ? input : [input];
  // ~4 chars per token is a good enough estimate across ru/en/hy.
  return Math.ceil(texts.reduce((s, t) => s + t.length, 0) / 4);
}

export async function todaySpend(supabase: any): Promise<number> {
  const day = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("ai_spend_log")
    .select("cost_estimate")
    .eq("day", day);
  if (error) {
    console.error("budget-guard: spend lookup failed", error);
    return 0;
  }
  return (data ?? []).reduce((s: number, r: any) => s + Number(r.cost_estimate ?? 0), 0);
}

/** True when there is still room in today's budget. Never throws. */
export async function withinBudget(supabase: any, plannedCostUsd = 0): Promise<boolean> {
  const spent = await todaySpend(supabase);
  return spent + plannedCostUsd <= DAILY_AI_BUDGET_USD;
}

export async function logSpend(
  supabase: any,
  endpoint: string,
  tokens: number,
  cost: number,
): Promise<void> {
  const { error } = await supabase.from("ai_spend_log").insert({
    endpoint,
    tokens_estimate: tokens,
    cost_estimate: cost,
  });
  if (error) console.error("budget-guard: log failed", error);
}