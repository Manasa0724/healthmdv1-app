// screens/AskAIScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import Constants from 'expo-constants';
import {
  createSession,
  appendMessageToSession,
  updateSummary,
  updateSummaryWithEmbedding,
} from '../utils/DiagnosisSession';
import { embedText } from '../utils/embeddings';

const OPENROUTER_API_KEY =
  Constants.expoConfig?.extra?.OPENROUTER_API_KEY || '';

const SUPABASE_URL =
  Constants.expoConfig?.extra?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '';


const SYSTEM_PROMPT = `
You are the world's leading virtual diagnostic doctor. A patient presents their visit data in the structured JSON format below.

**Your responsibilities:**
1. Analyze the provided vitals and device readings for abnormalities, red flags, or inconsistencies.
2. Interpret the patient's symptoms in conjunction with the physiological data.
3. Engage the user with one medically-relevant question at a time, like a real doctor would during a consultation.
4. Based on each response, dynamically adapt your questioning, ruling out or exploring different possible diagnoses.

**After sufficient data has been gathered:**
- Identify likely or urgent conditions, explain them in clear, empathetic language, and recommend next steps.
- **If any values are critically abnormal or suggest immediate danger, advise to seek emergency care, but also provide clear, basic, temporary measures that can be done at home while waiting for medical help.**
- For common symptoms (headache, fever, stomach pain, high blood pressure, low sugar, cold, minor injuries, etc.), suggest appropriate, over-the-counter treatments or home remedies, including safe dosage guidance and warning signs for when to seek help.
- Be specific: Recommend basic medications (e.g., paracetamol for fever, oral rehydration for diarrhea, safe antihistamines for allergies, etc.) or home care measures, unless contraindicated by other symptoms or vital signs.
- Always mention: "This advice is not a substitute for medical care. If you feel worse or have severe symptoms, seek immediate medical attention."

**Diagnostic Consultation Flow:**
Step 1: Immediately analyze all incoming vitals, symptoms, and device readings. Spot and highlight:
- Critically abnormal values
- Measurement inconsistencies
- Potential data entry errors

Step 2: Start with Question 1 — the most urgent and medically relevant question based on the data.
❗ Ask only one question at a time. Wait for the user’s response before moving to the next.

Step 3: With each answer, reassess and adjust your clinical reasoning. Ask the next best diagnostic question.

**Examples of questions you may ask:**
- Consciousness level?
- Breathing difficulty?
- Duration and nature of symptoms?
- Medication history?
- Environmental exposure?

Step 4: Once enough information is gathered, summarize:
- The top possible conditions (ranked by urgency or likelihood)
- The reasoning behind each
- **Specific temporary/home treatment recommendations, including medication names/dosages if possible**
- What to do next (e.g., emergency care, tests, home monitoring, etc.)

When recommending any medication, always use the following output format:

- Medication Name: [Insert Name]
- Purpose: [Insert Purpose]
- Dosage and Forms: [Insert Dosage Info]
- Common Side Effects: [List]
- Precautions: [List]
- Contraindications: [List]
- Additional Notes: "Please consult your healthcare provider for any concerns."
</Output Format>

You may recommend basic, common over-the-counter medications, home remedies, and first aid when appropriate, but always advise critical care when necessary. Use a professional, clear, and empathetic tone at all times.


Use a professional, clear, and empathetic tone.

Below are the patient visits (JSON format):
`;

// ---- helpers ---------------------------------------------------

function getLastNVisits(visits, n = 3) {
  const sorted = visits.slice().sort(
    (a, b) => new Date(b.visit_date) - new Date(a.visit_date)
  );
  return sorted.slice(0, n).map(v => ({
    visitDate: v.visit_date,
    vitals: {
      weight: { value: v.weight, unit: v.weight_unit },
      height: { value: v.height, unit: v.height_unit },
      bp: { value: v.bp, unit: v.bp_unit },
      pulse: { value: v.pulse, unit: v.pulse_unit },
      sugar: { value: v.sugar, unit: v.sugar_unit },
      spO2: { value: v.spo2, unit: v.spo2_unit },
      thermalScan: { value: v.thermal_scan, unit: v.thermal_scan_unit },
    },
    deviceReadings: {
      pulseOximeter: { value: v.pulse_oximeter, unit: v.pulse_oximeter_unit },
      glucometer: { value: v.glucometer, unit: v.glucometer_unit },
      scale: { value: v.scale, unit: v.scale_unit },
    },
    swabVirusResult: v.swab_result,
    symptoms: v.symptoms,
    notes: v.notes,
  }));
}

// Build a compact “query text” to embed (best effort if we don’t
// have a user complaint yet; uses latest visit vitals/symptoms)
function buildQueryTextForEmbedding(patient, visits) {
  const latest = (visits || [])[0] || {};
  const parts = [
    `Patient: ${patient?.first_name || ''} ${patient?.last_name || ''}`.trim(),
    latest?.symptoms ? `Symptoms: ${latest.symptoms}` : '',
    latest?.bp ? `BP: ${latest.bp} ${latest.bp_unit || ''}` : '',
    latest?.spo2 ? `SpO2: ${latest.spo2} ${latest.spo2_unit || ''}` : '',
    latest?.sugar ? `Sugar: ${latest.sugar} ${latest.sugar_unit || ''}` : '',
    latest?.pulse ? `Pulse: ${latest.pulse} ${latest.pulse_unit || ''}` : '',
    latest?.notes ? `Notes: ${latest.notes}` : '',
  ].filter(Boolean);
  return parts.join(' | ');
}

// Render a tiny card for similar episodes
function SimilarCard({ item, onPress }) {
  const date = item?.created_at?.slice(0, 10) || '—';
  const summary = (item?.summary || '').replace(/\n+/g, ' ').slice(0, 160);
  return (
    <TouchableOpacity onPress={onPress} style={styles.simCard}>
      <Text style={styles.simDate}>{date}</Text>
      <Text numberOfLines={4} style={styles.simText}>{summary || 'No summary saved.'}</Text>
    </TouchableOpacity>
  );
}

// ----------------- component -----------------

export default function AskAIScreen({ route }) {
  const { patient, visits, patientId } = route.params;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  // similar episodes
  const [similarEpisodes, setSimilarEpisodes] = useState([]); // [{id, created_at, summary, distance}]
  const [similarPromptBlock, setSimilarPromptBlock] = useState(''); // text we tack onto system prompt

  const flatListRef = useRef(null);
  const lastSavedIndexRef = useRef(0); // track persisted messages (excluding system)

  // 1) mount => seed messages
  useEffect(() => {
    const patientName = `${patient.first_name} ${patient.last_name}`.trim();
    const lastVisits = getLastNVisits(visits, 3);
    const sys = SYSTEM_PROMPT + '\nPatient Name: ' + patientName + '\n' +
      JSON.stringify(lastVisits, null, 2);

    setMessages([
      { role: 'system', content: sys },
      {
        role: 'assistant',
        content:
          'Hi! I am your virtual diagnostic doctor. I see your latest visit data. Please describe your main concern or symptoms.',
      },
    ]);
  }, [patient, visits]);

  // 2) mount => fetch similar episodes (via embeddings + RPC)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Build a compact query string for embedding
        const queryText = buildQueryTextForEmbedding(patient, visits);
        if (!queryText) return;

        // Create embedding for the query
        const queryVec = await embedText(queryText, {
          model: 'gemini-embedding-001',
        });

        // Try RPC first
        const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/similar_sessions`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            p_patient_id: patientId,
            p_query_vec: queryVec,
            p_match_count: 5, // request top 5 and we’ll show up to 3
          }),
        });

        let rows = [];
        if (rpcRes.ok) {
          rows = await rpcRes.json();
        } else {
          // If RPC is missing, do a very light fallback: pull last 10 summaries
          // (no cosine ranking client-side, just recent)
          const fb = await fetch(
            `${SUPABASE_URL}/rest/v1/diagnosis_sessions?patient_id=eq.${encodeURIComponent(
              patientId
            )}&summary=is.not.null&order=created_at.desc&limit=10`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
            }
          );
          rows = fb.ok ? await fb.json() : [];
        }

        if (cancelled) return;

        // keep a compact 2–3 block for prompt, and set state for UI
        const top = (rows || []).slice(0, 3);
        setSimilarEpisodes(top);

        if (top.length) {
          const lines = top.map(r => {
            const date = r.created_at?.slice(0, 10) || '—';
            const s1 = (r.summary || '').split('\n')[0].slice(0, 140);
            return `- ${date}: ${s1}`;
          });
          const block =
            `\nRelevant previous episodes (most similar):\n${lines.join('\n')}\n`;
          setSimilarPromptBlock(block);
        } else {
          setSimilarPromptBlock('');
        }
      } catch (e) {
        // Don’t block the chat if this fails
        setSimilarEpisodes([]);
        setSimilarPromptBlock('');
        console.warn('[similar episodes] error:', e.message);
      }
    }

    // only run when we have patient and visits ready
    if (patient && Array.isArray(visits)) run();

    return () => {
      cancelled = true;
    };
  }, [patient, visits, patientId]);

  // 3) autoscroll
  useEffect(() => {
    if (flatListRef.current) flatListRef.current.scrollToEnd({ animated: true });
  }, [messages]);

  // 4) persist messages to Supabase
  useEffect(() => {
    const nonSystem = messages.filter(m => m.role !== 'system');
    if (nonSystem.length === 0) return;

    async function persist() {
      try {
        if (!sessionId) {
          const created = await createSession({
            patient_id: patientId,
            visit_id: visits?.[0]?.id || null,
            messages: nonSystem,
            summary: null,
          });
          setSessionId(created.id);
          lastSavedIndexRef.current = nonSystem.length;
        } else {
          const slice = nonSystem.slice(lastSavedIndexRef.current);
          if (slice.length > 0) {
            await appendMessageToSession(sessionId, slice);
            lastSavedIndexRef.current = nonSystem.length;
          }
        }
      } catch (e) {
        console.warn('[Supabase] persist error:', e.message);
      }
    }
    persist();
  }, [messages, sessionId, patientId, visits]);

  // 5) summarize & save (+ embedding)
  async function generateAndSaveSummary() {
    if (!sessionId) {
      Alert.alert('Please send at least one message first.');
      return;
    }
    setLoading(true);

    const summaryPrompt = `Please summarize this consultation with:
- Symptoms
- Key findings
- Diagnostic reasoning
- Medications/treatments in the required format
- Next steps`;

    // Important: add the similar episodes block to the system prompt for the summarization too
    const effectiveSystem = (messages[0]?.content || SYSTEM_PROMPT) + (similarPromptBlock || '');

    const convo = [
      { role: 'system', content: effectiveSystem },
      ...messages.filter(m => m.role !== 'system'),
      { role: 'user', content: summaryPrompt },
    ];

    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'healthmdv1://app',
          'X-Title': 'HealthMDv1',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: convo,
          max_tokens: 500,
        }),
      });

      const raw = await resp.text();
      let data;
      try { data = JSON.parse(raw); }
      catch { throw new Error(`Summary API HTTP ${resp.status}`); }

      const summaryText =
        data?.choices?.[0]?.message?.content?.trim() || 'No summary generated.';

      try {
        await updateSummaryWithEmbedding(sessionId, summaryText);
        Alert.alert('Summary Saved', 'Saved with embedding.');
      } catch (embedErr) {
        console.warn('[Summary] embedding failed, fallback:', embedErr.message);
        await updateSummary(sessionId, summaryText);
        Alert.alert('Summary Saved', 'Saved (no embedding).');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  const askAboutHistory = async (type) => {
    setLoading(true);
    
    try {
      let queryText = '';
      let promptText = '';
      
      if (type === 'improvement') {
        queryText = `patient ${patient?.first_name} ${patient?.last_name} improvement suggestions based on medical history`;
        promptText = `Based on my medical history and past consultations, how can I improve my health? Please analyze my previous symptoms, treatments, and outcomes to provide specific, actionable recommendations for improvement.`;
      } else if (type === 'treatment') {
        queryText = `patient ${patient?.first_name} ${patient?.last_name} treatment history what worked`;
        promptText = `Based on my medical history and past consultations, what treatments have worked for me in the past? Please analyze my previous symptoms, treatments, and outcomes to identify what has been effective.`;
      }
      
      const queryVec = await embedText(queryText, {
        model: 'gemini-embedding-001',
      });
      
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/similar_sessions`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_patient_id: patientId,
          p_query_vec: queryVec,
          p_match_count: 10,
        }),
      });
      
      let relevantSessions = [];
      if (rpcRes.ok) {
        relevantSessions = await rpcRes.json();
      }
      
      const historyContext = relevantSessions.length > 0 
        ? `\n\nRelevant medical history from past consultations:\n${relevantSessions.map(s => 
            `${s.created_at?.slice(0, 10) || 'Unknown date'}: ${s.summary || 'No summary available'}`
          ).join('\n\n')}`
        : '\n\nNo relevant past consultations found.';
      
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'healthmdv1://app',
          'X-Title': 'HealthMDv1',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: `You are a medical AI assistant analyzing a patient's medical history. Provide clear, actionable advice based on the patient's past consultations and outcomes.${historyContext}` 
            },
            { role: 'user', content: promptText }
          ],
          max_tokens: 800,
        }),
      });
      
      const raw = await resp.text();
      let data;
      try { data = JSON.parse(raw); }
      catch { throw new Error(`History API HTTP ${resp.status}`); }
      
      const reply = data?.choices?.[0]?.message?.content?.trim() || 'Unable to analyze medical history.';
      
      setMessages([
        { role: 'system', content: messages[0]?.content || SYSTEM_PROMPT },
        { role: 'assistant', content: reply },
      ]);
      
    } catch (e) {
      setMessages([
        { role: 'system', content: messages[0]?.content || SYSTEM_PROMPT },
        { role: 'assistant', content: `Error analyzing medical history: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 7) send chat
  const sendToAI = async (userMessage) => {
    if (!userMessage?.trim()) return;
    setLoading(true);

    try {
      const chatHistory = [
        ...messages.filter(m => m.role !== 'system'),
        { role: 'user', content: userMessage },
      ];

      // Inject similar episodes block into the *system* message we send to the model
      const effectiveSystem = (messages[0]?.content || SYSTEM_PROMPT) + (similarPromptBlock || '');

      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'healthmdv1://app',
          'X-Title': 'HealthMDv1',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [{ role: 'system', content: effectiveSystem }, ...chatHistory],
          max_tokens: 700,
        }),
      });

      const raw = await resp.text();
      let data;
      try { data = JSON.parse(raw); }
      catch { throw new Error(`Chat API HTTP ${resp.status}`); }

      const reply =
        data?.choices?.[0]?.message?.content?.trim() || 'AI returned no response.';
      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: reply },
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: `Error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  // ----------------- UI -----------------

  const renderBubble = ({ item }) => (
    <View
      style={[
        styles.bubble,
        item.role === 'user' ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <Text style={{ color: item.role === 'user' ? '#fff' : '#222' }}>
        {item.content}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1 }}>
        {/* Chat messages */}
        <FlatList
          ref={flatListRef}
          data={messages.slice(1)} // hide system message
          keyExtractor={(_, i) => String(i)}
          style={{ flex: 1, padding: 10 }}
          renderItem={renderBubble}
          ListHeaderComponent={
            <View>
              {/* Similar episodes cards (only if we have any) */}
              {similarEpisodes.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.simHeader}>
                    Similar past episodes (for context)
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 6 }}
                  >
                    {similarEpisodes.map((ep, idx) => (
                      <SimilarCard
                        key={ep.id || idx}
                        item={ep}
                        onPress={() => {
                          // Tap to preview full summary in-chat
                          const date = ep.created_at?.slice(0, 10) || '—';
                          setMessages(prev => [
                            ...prev,
                            {
                              role: 'assistant',
                              content:
                                `Here’s a similar past episode (${date}):\n\n` +
                                (ep.summary || 'No summary available.'),
                            },
                          ]);
                        }}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          }
        />

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            disabled={loading}
            onPress={() => askAboutHistory('improvement')}
          >
            <Text style={styles.quickActionText}>How can I improve?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            disabled={loading}
            onPress={() => askAboutHistory('treatment')}
          >
            <Text style={styles.quickActionText}>What treatments worked?</Text>
          </TouchableOpacity>
        </View>

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a question..."
            value={input}
            onChangeText={setInput}
            editable={!loading}
            onSubmitEditing={() => sendToAI(input)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={styles.sendBtn}
            disabled={loading}
            onPress={() => sendToAI(input)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* Summarize button */}
        <View style={{ padding: 10 }}>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: '#43a047' }]}
            onPress={generateAndSaveSummary}
            disabled={loading || !sessionId}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              Summarize & Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ----------------- styles -----------------

const styles = StyleSheet.create({
  bubble: { marginVertical: 4, padding: 12, borderRadius: 10, maxWidth: '86%' },
  aiBubble: { backgroundColor: '#e9f4fd', alignSelf: 'flex-start' },
  userBubble: { backgroundColor: '#1976d2', alignSelf: 'flex-end' },
  quickActionsRow: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#f8f9fa' },
  quickActionBtn: { 
    flex: 1, 
    backgroundColor: '#e3f2fd', 
    borderRadius: 15, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#bbdefb'
  },
  quickActionText: { 
    color: '#1976d2', 
    fontSize: 12, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  inputRow: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderColor: '#eee' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, padding: 10, marginRight: 8, backgroundColor: '#fff' },
  sendBtn: { backgroundColor: '#1976d2', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 18 },

  simHeader: { fontWeight: '600', color: '#333', marginLeft: 6, marginBottom: 2 },
  simCard: {
    width: 220,
    marginHorizontal: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    backgroundColor: '#f9fcff',
  },
  simDate: { fontWeight: '700', marginBottom: 6, color: '#1976d2' },
  simText: { color: '#333' },
});