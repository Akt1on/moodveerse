import { EMBED_USD_PER_MTOKEN, estimateTokens, logSpend, withinBudget } from "./budget-guard.ts";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/embeddings";
const MODEL = "openai/text-embedding-3-small";

export class BudgetExceeded extends Error {
  constructor() {
    super("Дневной бюджет AI исчерпан — сбор остановлен");
    this.name = "BudgetExceeded";
  }
}

export class AiBlocked extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AiBlocked";
    this.status = status;
  }
}

async function callGateway(inputs: string[], apiKey: string): Promise<number[][]> {
  let delay = 800;
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, input: inputs.map((t) => t.slice(0, 8000)) }),
    });
    if (r.ok) {
      const j = await r.json();
      return (j.data ?? []).map((d: any) => d.embedding as number[]);
    }
    // Terminal: never retry.
    if (r.status === 402 || r.status === 403 || r.status === 401 || r.status === 400) {
      const body = await r.text();
      throw new AiBlocked(r.status, body.slice(0, 300));
    }
    // Retryable: 429 / 5xx
    const retryAfter = Number(r.headers.get("Retry-After"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delay;
    await new Promise((res) => setTimeout(res, wait + Math.random() * 250));
    delay = Math.min(delay * 2, 8000);
  }
  throw new AiBlocked(429, "Превышен лимит запросов к AI Gateway");
}

/** Embeds a batch, enforcing the daily budget and logging estimated spend. */
export async function embedBatchTracked(
  supabase: any,
  inputs: string[],
  apiKey: string,
  endpoint: string,
): Promise<number[][]> {
  if (!inputs.length) return [];
  const tokens = estimateTokens(inputs);
  const cost = (tokens / 1_000_000) * EMBED_USD_PER_MTOKEN;
  if (!(await withinBudget(supabase, cost))) throw new BudgetExceeded();
  const vectors = await callGateway(inputs, apiKey);
  await logSpend(supabase, endpoint, tokens, cost);
  return vectors;
}

export async function embedTracked(
  supabase: any,
  input: string,
  apiKey: string,
  endpoint: string,
): Promise<number[] | null> {
  const [v] = await embedBatchTracked(supabase, [input], apiKey, endpoint);
  return v ?? null;
}