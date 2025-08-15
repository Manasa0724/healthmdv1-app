// screens/AddPatientReviewScreen.js
import React, { useState } from 'react';
import Constants from 'expo-constants';
import { View, Text, Button, ScrollView, StyleSheet, Alert } from 'react-native';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '';

function generatePatientId() {
  return 'PT-' + Math.floor(100000 + Math.random() * 900000);
}

export default function AddPatientReviewScreen({ navigation, route }) {
  // Route params contains all previous data:
  const { personal, vitals, symptoms, notes } = route.params;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const patientId = generatePatientId();
    try {
      // 1. Insert patient into users
      const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          ...personal,
          ...vitals,
          unique_id: patientId,
          role: 'patient',
          is_active: true,
          symptoms,
          notes,
        }),
      });
      const userData = await userRes.json();
      if (!userRes.ok) {
        setLoading(false);
        Alert.alert('Failed to add patient', userData.message || JSON.stringify(userData));
        return;
      }

      // 2. Insert a visit record
      await fetch(`${SUPABASE_URL}/rest/v1/visits`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          patient_id: patientId,
          // field_worker_id: ... // if you have it
          date: new Date().toISOString(),
          notes: notes || null,
        }),
      });

      setLoading(false);
      Alert.alert(
        'Patient added!',
        `Patient Unique ID: ${patientId}\n\nA visit record was also created.`,
        [{ text: 'OK', onPress: () => navigation.popToTop() }]
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Review Patient Details</Text>
      <Section label="Personal Details" data={personal} />
      <Section label="Vitals" data={vitals} />
      <Section label="Symptoms & Notes" data={{ symptoms, notes }} />
      <View style={styles.button}>
        <Button
          title={loading ? "Submitting..." : "Confirm & Submit"}
          onPress={handleSubmit}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
}

// Helper to pretty-print fields
function Section({ label, data }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      {Object.entries(data).map(([k, v]) =>
        v ? (
          <View key={k} style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={styles.fieldKey}>{formatLabel(k)}: </Text>
            <Text>{v}</Text>
          </View>
        ) : null
      )}
    </View>
  );
}

// Convert camelCase or snake_case to nice label
function formatLabel(s) {
  return s.replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' },
  section: { marginBottom: 15 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 6, textDecorationLine: 'underline' },
  fieldKey: { fontWeight: 'bold' },
  button: { marginTop: 20 }
});
