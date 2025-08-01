// screens/AskAIScreen.js

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createSession, appendMessageToSession, fetchSessionsForPatient } from '../utils/DiagnosisSession';

// !! PLACE YOUR OPENROUTER API KEY HERE !!
const OPENROUTER_API_KEY = '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';

// -- SYSTEM PROMPT --
const SYSTEM_PROMPT = `
You are the world's leading virtual diagnostic doctor. A patient presents their visit data in the structured JSON format below.
Your responsibilities are:
Analyze the provided vitals and device readings for abnormalities, red flags, or inconsistencies.
Interpret the patient's symptoms in conjunction with the physiological data.
Engage the user with one medically-relevant question at a time, like a real doctor would during a consultation.
Based on each response, dynamically adapt your questioning, ruling out or exploring different possible diagnoses.
After sufficient data has been gathered, identify likely or urgent conditions, explain them in clear, empathetic language, and recommend next steps.
🔄 Diagnostic Consultation Flow
Step 1: Immediately analyze all incoming vitals, symptoms, and device readings. Spot and highlight:
Critically abnormal values, Measurement inconsistencies, Potential data entry errors
Step 2: Start with Question 1 — the most urgent and medically relevant question based on the data.
❗ Ask only one question at a time. Wait for the user’s response before moving to the next.
Step 3: With each answer, reassess and adjust your clinical reasoning. Ask the next best diagnostic question.
Examples: Consciousness level? Breathing difficulty? Duration and nature of symptoms? Medication history? Environmental exposure?
Step 4: Once enough information is gathered, summarize:
The top possible conditions (ranked by urgency or likelihood)
The reasoning behind each
What to do next (e.g., emergency care, tests, home monitoring, etc.)
Use a professional, clear, empathetic tone.
Below are the patient visits (JSON format):
`;

function getLastNVisits(visits, n = 3) {
  // Sort by date descending (assuming visit_date is ISO string)
  const sorted = visits.slice().sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
  return sorted.slice(0, n).map(v => ({
    visitDate: v.visit_date,
    vitals: {
      weight: { value: v.weight, unit: v.weight_unit },
      height: { value: v.height, unit: v.height_unit },
      bp: { value: v.bp, unit: v.bp_unit },
      pulse: { value: v.pulse, unit: v.pulse_unit },
      sugar: { value: v.sugar, unit: v.sugar_unit },
      spO2: { value: v.spo2, unit: v.spo2_unit },
      thermalScan: { value: v.thermal_scan, unit: v.thermal_scan_unit }
    },
    deviceReadings: {
      pulseOximeter: { value: v.pulse_oximeter, unit: v.pulse_oximeter_unit },
      glucometer: { value: v.glucometer, unit: v.glucometer_unit },
      scale: { value: v.scale, unit: v.scale_unit }
    },
    swabVirusResult: v.swab_result,
    symptoms: v.symptoms,
    notes: v.notes
  }));
}

export default function AskAIScreen({ navigation, route }) {
  const { patient, visits, patientId } = route.params;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  // Initial system prompt + AI intro
  useEffect(() => {
    const patientName = `${patient.first_name} ${patient.last_name}`.trim();
    const lastVisits = getLastNVisits(visits, 3);
    const systemPrompt = SYSTEM_PROMPT
      + '\nPatient Name: ' + patientName
      + '\n' + JSON.stringify(lastVisits, null, 2);
    setMessages([
      { role: 'system', content: systemPrompt },
      {
        role: 'assistant',
        content: `Hi! I am your virtual diagnostic doctor.\nI see your latest visit data. Please describe your main concern or symptoms, or let me know if you want me to analyze your records.`,
      }
    ]);
  }, [patient, visits]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current) flatListRef.current.scrollToEnd({ animated: true });
  }, [messages]);

  // Save or update chat session on each message from AI
  useEffect(() => {
    // Only save if we have at least 3 messages (system, AI, user/AI)
    if (messages.length < 3) return;
    // Do not save system message
    const chatToSave = messages.filter(m => m.role !== 'system');
    // If sessionId is not set, create new session
    if (!sessionId) {
      createSession({
        patient_id: patientId,
        visit_id: visits[0]?.id || null,
        messages: chatToSave,
        summary: null,
      })
      .then(session => {
        setSessionId(session.id);
      })
      .catch(err => {
        // Optionally handle error
      });
    } else {
      // Append all new messages (could be optimized)
      appendMessageToSession(sessionId, [chatToSave[chatToSave.length - 2], chatToSave[chatToSave.length - 1]]);
    }
  }, [messages]);

  // --- AI Chat ---
  const sendToAI = async (userMessage) => {
    setLoading(true);

    // Prepare OpenRouter messages array
    const chatHistory = [
      ...messages.filter(m => m.role === 'assistant' || m.role === 'user').map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: userMessage }
    ];

    const openrouterMessages = [
      { role: 'system', content: messages[0]?.content || SYSTEM_PROMPT },
      ...chatHistory
    ];

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: openrouterMessages,
          max_tokens: 700,
        })
      });

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content?.trim() || 'AI returned no response.';
      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: reply }
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: `Error: ${e.message}` }
      ]);
    }
    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendToAI(input.trim());
    setInput('');
  };

  const renderItem = ({ item }) => (
    <View style={[
      styles.bubble,
      item.role === 'user'
        ? styles.userBubble
        : item.role === 'assistant'
        ? styles.aiBubble
        : styles.systemBubble
    ]}>
      <Text style={[
        styles.bubbleText,
        item.role === 'user' ? { color: '#fff' } : { color: '#222' }
      ]}>
        {item.content}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        
        <FlatList
          ref={flatListRef}
          data={messages.slice(1)} // Hide system message, only show chat
          renderItem={renderItem}
          keyExtractor={(_, i) => String(i)}
          style={{ flex: 1, padding: 10 }}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a question for AI..."
            value={input}
            onChangeText={setInput}
            editable={!loading}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#ececec', backgroundColor: '#fff' },
  headerText: { fontSize: 18, fontWeight: 'bold', color: '#222', flex: 1, textAlign: 'center', marginRight: 36 },
  bubble: { marginVertical: 4, padding: 12, borderRadius: 10, maxWidth: '86%', alignSelf: 'flex-start' },
  aiBubble: { backgroundColor: '#e9f4fd', alignSelf: 'flex-start' },
  userBubble: { backgroundColor: '#1976d2', alignSelf: 'flex-end' },
  systemBubble: { backgroundColor: '#eee', borderColor: '#ccc', borderWidth: 1 },
  bubbleText: { fontSize: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fafbfc' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, padding: 10, marginRight: 8, fontSize: 16, backgroundColor: '#fff' },
  sendBtn: { backgroundColor: '#1976d2', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 18 }
});
