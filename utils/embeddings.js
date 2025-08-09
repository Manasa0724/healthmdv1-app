import Constants from "expo-constants";
const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY;

export async function getEmbedding(text) {
  const input = (text || "").trim().slice(0, 8000);
  if (!input) return null;

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input,
      model: "text-embedding-3-small", // 1536 dims
    }),
  });

  if (!res.ok) {
    console.warn("Embedding error:", await res.text());
    return null; // still allow visit insert; we can backfill later
  }

  const data = await res.json();
  return data?.data?.[0]?.embedding || null;
}
