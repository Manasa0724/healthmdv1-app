
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function rpcSimilarVisits({ vector, patientId = null, limit = 10, minSim = 0.75 }) {
  const { data, error } = await supabase.rpc("similar_visits", {
    q: vector,
    p_patient_id: patientId,
    p_limit: limit,
    min_sim: minSim,
  });
  if (error) throw error;
  return data || [];
}
