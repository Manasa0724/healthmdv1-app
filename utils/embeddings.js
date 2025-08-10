// utils/embeddings.js
import Constants from 'expo-constants';

const OPENROUTER_API_KEY =
  Constants.expoConfig?.extra?.OPENROUTER_API_KEY ||
  Constants.manifest?.extra?.OPENROUTER_API_KEY ||
  '';

const OPENROUTER_API_URL = 'https://api.openrouter.ai/v1/embeddings'; // <-- IMPORTANT

export async function embedText(
  text,
  { model = 'openai/text-embedding-3-small' } = {}
) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Missing OPENROUTER_API_KEY');
  }
  if (!text || typeof text !== 'string') {
    throw new Error('embedText: `text` must be a non-empty string');
  }

  const headers = {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    // OpenRouter likes a referer & title; send both header spellings to be safe:
    Referer: 'https://healthmdv1.app',
    'HTTP-Referer': 'https://healthmdv1.app',
    'X-Title': 'HealthMDv1',
  };

  const body = JSON.stringify({ model, input: text });

  const resp = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers,
    body,
  });

  // Read as text first for useful error printing
  const raw = await resp.text();

  // If not JSON, show a helpful snippet
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // If you see <!DOCTYPE html>, you’re not hitting the JSON API.
    console.warn('[embedText] Non-JSON response', {
      status: resp.status,
      url: resp.url,
      head: raw.slice(0, 200),
    });
    throw new Error(
      `Embedding API returned non-JSON (HTTP ${resp.status}). Check API URL/headers.`
    );
  }

  if (!resp.ok) {
    const msg =
      parsed?.error?.message ||
      parsed?.message ||
      JSON.stringify(parsed).slice(0, 200);
    throw new Error(`Embedding failed: ${msg}`);
  }

  const vec = parsed?.data?.[0]?.embedding;
  if (!Array.isArray(vec)) {
    throw new Error('Embedding failed: missing `data[0].embedding`');
  }
  return vec;
}
