const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';


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
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Could not create session');
  return data[0];
}

async function fetchSessionsForPatient(patient_id, limit = 5) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/diagnosis_sessions?patient_id=eq.${patient_id}&order=created_at.desc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data;
}

async function appendMessageToSession(session_id, newMessages) {
  // Fetch the current messages
  const res1 = await fetch(
    `${SUPABASE_URL}/rest/v1/diagnosis_sessions?id=eq.${session_id}&select=messages`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  const arr = await res1.json();
  const current = arr[0]?.messages || [];
  const updatedMessages = [...current, ...newMessages];

  // Patch update
  const res2 = await fetch(
    `${SUPABASE_URL}/rest/v1/diagnosis_sessions?id=eq.${session_id}`,
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
  if (!res2.ok) throw new Error(data.message || 'Could not update messages');
  return data[0];
}

async function updateSummary(session_id, summary) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/diagnosis_sessions?id=eq.${session_id}`,
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
  if (!res.ok) throw new Error(data.message || 'Could not update summary');
  return data[0];
}

export {
  createSession,
  fetchSessionsForPatient,
  appendMessageToSession,
  updateSummary,
};
