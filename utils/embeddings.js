// utils/embeddings.js
import Constants from 'expo-constants';

const GEMINI_API_KEY =
  Constants.expoConfig?.extra?.GEMINI_API_KEY ||
  Constants.manifest?.extra?.GEMINI_API_KEY ||
  '';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';

export async function embedText(
  text,
  { model = 'gemini-embedding-001' } = {}
) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    throw new Error('Missing GEMINI_API_KEY - Please add your Gemini API key to the .env file');
  }
  if (!text || typeof text !== 'string') {
    throw new Error('embedText: `text` must be a non-empty string');
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const body = JSON.stringify({ 
    model: "models/gemini-embedding-001",
    content: {
      parts: [
        {
          text: text
        }
      ]
    }
  });

  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });

  const raw = await resp.text();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
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

  const vec = parsed?.embedding?.values;
  if (!Array.isArray(vec)) {
    console.warn('[embedText] Unexpected response structure:', parsed);
    throw new Error('Embedding failed: missing embedding values in response');
  }
  
  // Truncate to 1536 dimensions to match database constraint
  const truncatedVec = vec.slice(0, 1536);
  console.log(`[embedText] Generated ${vec.length}-dim embedding, truncated to ${truncatedVec.length} dimensions`);
  
  return truncatedVec;
}
