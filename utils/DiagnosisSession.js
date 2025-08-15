// utils/DiagnosisSession.js
import Constants from 'expo-constants';
import { embedText } from './embeddings';

// Read from app.config.js -> extra
const SUPABASE_URL =
  Constants.expoConfig?.extra?.SUPABASE_URL ||
  Constants.manifest?.extra?.SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ||
  Constants.manifest?.extra?.SUPABASE_ANON_KEY ||
  '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[DiagnosisSession] Missing SUPABASE_URL or SUPABASE_ANON_KEY in app.config.js (extra)'
  );
}

/**
 * Create a diagnosis session row.
 * @returns the created row (object)
 */
async function createSession({ patient_id, visit_id, messages = [], summary = null }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/diagnosis_sessions`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      patient_id,
      visit_id,
      messages,
      summary,
      // summary_vec can be added later via updateSummaryWithEmbedding
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message || data?.hint || JSON.stringify(data);
    throw new Error(`Could not create session: ${msg}`);
  }
  return data[0];
}

/**
 * Fetch recent sessions for a patient.
 */
async function fetchSessionsForPatient(patient_id, limit = 5) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/diagnosis_sessions?patient_id=eq.${encodeURIComponent(
      patient_id
    )}&order=created_at.desc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message || data?.hint || JSON.stringify(data);
    throw new Error(`Fetch sessions failed: ${msg}`);
  }
  return Array.isArray(data) ? data : [];
}

/**
 * Append new messages to a session.messages array.
 * newMessages should be an array of { role, content } items.
 */
async function appendMessageToSession(session_id, newMessages = []) {
  if (!Array.isArray(newMessages) || newMessages.length === 0) return null;

  // 1) Get current messages
  const res1 = await fetch(
    `${SUPABASE_URL}/rest/v1/diagnosis_sessions?id=eq.${encodeURIComponent(
      session_id
    )}&select=messages`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  const arr = await res1.json();
  if (!res1.ok) {
    const msg = arr?.message || arr?.hint || JSON.stringify(arr);
    throw new Error(`Load current messages failed: ${msg}`);
  }

  const current = Array.isArray(arr) && arr[0]?.messages ? arr[0].messages : [];
  const updatedMessages = current.concat(newMessages);

  // 2) Patch with the appended messages
  const res2 = await fetch(
    `${SUPABASE_URL}/rest/v1/diagnosis_sessions?id=eq.${encodeURIComponent(session_id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ messages: updatedMessages }),
    }
  );

  const data = await res2.json();
  if (!res2.ok) {
    const msg = data?.message || data?.hint || JSON.stringify(data);
    throw new Error(`Could not update messages: ${msg}`);
  }
  return data[0];
}

/**
 * Update only the textual summary (no embedding).
 */
async function updateSummary(session_id, summary) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/diagnosis_sessions?id=eq.${encodeURIComponent(session_id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ summary }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message || data?.hint || JSON.stringify(data);
    throw new Error(`Could not update summary: ${msg}`);
  }
  return data[0];
}

/**
 * Update summary AND store its vector embedding (pgvector) in summary_vec.
 * This is what you’ll call after generating your LLM summary.
 */
async function updateSummaryWithEmbedding(session_id, summaryText, {
  embeddingModel = 'gemini-embedding-001',
} = {}) {
  // 1) Create embedding via Gemini
  const vec = await embedText(summaryText, { model: embeddingModel });
  if (!vec || !Array.isArray(vec)) throw new Error('Embedding returned no vector');

  // 2) Patch both fields in one call
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/diagnosis_sessions?id=eq.${encodeURIComponent(session_id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      // PostgREST will accept numeric arrays for vector columns.
      body: JSON.stringify({ summary: summaryText, summary_vec: vec }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message || data?.hint || JSON.stringify(data);
    throw new Error(`Could not update summary & embedding: ${msg}`);
  }
  return data[0];
}

export {
  createSession,
  fetchSessionsForPatient,
  appendMessageToSession,
  updateSummary,
  updateSummaryWithEmbedding,
};
