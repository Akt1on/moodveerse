/**
 * Semantic near-duplicate check against literary_works.
 * Returns true when an existing row is essentially the same fragment.
 */
export async function isSemanticDuplicate(
  supabase: any,
  embedding: number[] | null,
  threshold = 0.97,
): Promise<boolean> {
  if (!embedding) return false;
  const { data, error } = await supabase.rpc("match_literary_works", {
    query_embedding: embedding as any,
    match_count: 1,
    filter_language: null,
    filter_emotions: null,
    similarity_threshold: threshold,
  });
  if (error) {
    console.error("semantic dedup failed", error);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}