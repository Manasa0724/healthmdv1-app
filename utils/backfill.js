// utils/backfill.js
import Constants from 'expo-constants';
import { embedText } from './embeddings';

const SUPABASE_URL =
  Constants.expoConfig?.extra?.SUPABASE_URL ||
  Constants.manifest?.extra?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ||
  Constants.manifest?.extra?.SUPABASE_ANON_KEY || '';

export async function backfillSessionEmbeddings(patientId) {
  // 1) fetch sessions missing vectors
  const res = await fetch(`${SUPABASE_URL}/rest/v1/diagnosis_sessions?patient_id=eq.${patientId}&summary_vec=is.null&select=id,summary`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  const rows = await res.json();
  for (const row of rows) {
    if (!row.summary) continue;
    const vec = await embedText(row.summary, { model: 'openai/text-embedding-3-small' });
    await fetch(`${SUPABASE_URL}/rest/v1/diagnosis_sessions?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ summary_vec: vec }),
    });
  }
}
