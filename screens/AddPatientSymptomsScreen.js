// screens/AddPatientSymptomsScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

export default function AddPatientSymptomsScreen({ navigation, route }) {
  const { patientId, unique_id, personal, vitals } = route.params;
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // 1. Insert into visits
      const visitRes = await fetch(`${SUPABASE_URL}/rest/v1/visits`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          patient_id: patientId,
          visit_date: new Date().toISOString(),
          weight: vitals.weight,
          weight_unit: vitals.weightUnit,
          height: vitals.height,
          height_unit: vitals.heightUnit,
          bp: vitals.bp,
          bp_unit: vitals.bpUnit,
          pulse: vitals.pulse,
          pulse_unit: vitals.pulseUnit,
          sugar: vitals.sugar,
          sugar_unit: vitals.sugarUnit,
          spo2: vitals.spo2,
          spo2_unit: vitals.spo2Unit,
          thermal_scan: vitals.thermalScan,
          thermal_scan_unit: vitals.thermalScanUnit,
          pulse_oximeter: vitals.pulseOximeter,
          pulse_oximeter_unit: vitals.pulseOximeterUnit,
          glucometer: vitals.glucometer,
          glucometer_unit: vitals.glucometerUnit,
          scale: vitals.scale,
          scale_unit: vitals.scaleUnit,
          swab_result: vitals.swabResult,
          symptoms,
          notes,
        }),
      });
      const visitData = await visitRes.json();
      setLoading(false);

      if (!visitRes.ok) {
        Alert.alert('Failed to add patient visit', visitData.message || JSON.stringify(visitData));
        return;
      }

      Alert.alert(
        'Success!',
        `Patient profile created.\nUnique ID: ${unique_id}\nVisit recorded.`,
        [{ text: 'OK', onPress: () => navigation.popToTop() }]
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Symptoms & Notes</Text>
      <TextInput style={[styles.input, { minHeight: 40 }]} placeholder="Symptoms" value={symptoms} multiline onChangeText={setSymptoms} />
      <TextInput style={[styles.input, { minHeight: 40 }]} placeholder="Notes" value={notes} multiline onChangeText={setNotes} />
      <View style={styles.button}>
        <Button title={loading ? "Submitting..." : "Submit Patient"} onPress={handleSubmit} disabled={loading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, width: '100%', marginBottom: 10, padding: 10 },
  button: { marginTop: 12, width: '100%' }
});
