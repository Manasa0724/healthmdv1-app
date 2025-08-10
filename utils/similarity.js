// utils/similarity.js
import Constants from 'expo-constants';
import { embedText } from './embeddings';

const SUPABASE_URL =
  Constants.expoConfig?.extra?.SUPABASE_URL ||
  Constants.manifest?.extra?.SUPABASE_URL || '';

const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ||
  Constants.manifest?.extra?.SUPABASE_ANON_KEY || '';

/**
 * Given free text (e.g., current complaint or latest visit JSON),
 * return top-K similar past diagnosis sessions for THIS patient.
 */
export async function findSimilarSessionsForPatient({ patientId, text, topK = 3 }) {
  if (!patientId || !text) return [];

  // 1) embed the query text
  const qvec = await embedText(text, { model: 'openai/text-embedding-3-small' });

  // 2) call RPC
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/similar_sessions`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      p_patient: patientId,
      qvec,           // the vector we just created
      k: topK,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message || data?.hint || JSON.stringify(data);
    throw new Error(`similar_sessions RPC failed: ${msg}`);
  }
  return Array.isArray(data) ? data : [];
}
