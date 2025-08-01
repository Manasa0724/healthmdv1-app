// screens/EditPatientScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc'; // your anon key

export default function EditPatientScreen({ navigation, route }) {
  const { patientId } = route.params; // pass unique_id or row id to this screen
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Load patient data by unique_id
  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/users?unique_id=eq.${patientId}&select=*`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      }
    })
    .then(res => res.json())
    .then(data => {
      setForm(data[0] || {});
      setLoading(false);
    })
    .catch(e => {
      Alert.alert('Error loading patient', e.message);
      setLoading(false);
    });
  }, [patientId]);

  // 2. Edit fields
  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  // 3. Save changes to Supabase
  const handleSave = async () => {
    setSaving(true);
    try {
      // PATCH by unique_id (edit this if you use "id" as PK)
      const patch = await fetch(`${SUPABASE_URL}/rest/v1/users?unique_id=eq.${patientId}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(form)
      });
      const data = await patch.json();
      if (patch.ok) {
        Alert.alert('Updated!', 'Patient details updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Update failed', data.message || JSON.stringify(data));
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Patient</Text>
      {/* Personal Details */}
      <Text style={styles.section}>Personal Details</Text>
      <TextInput style={styles.input} placeholder="First Name" value={form.first_name} onChangeText={v => handleChange('first_name', v)} />
      <TextInput style={styles.input} placeholder="Last Name" value={form.last_name} onChangeText={v => handleChange('last_name', v)} />
      <TextInput style={styles.input} placeholder="Date of Birth" value={form.dob} onChangeText={v => handleChange('dob', v)} />
      <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={v => handleChange('email', v)} />
      <TextInput style={styles.input} placeholder="Phone Number" value={form.phone_number} onChangeText={v => handleChange('phone_number', v)} />
      <TextInput style={styles.input} placeholder="Tribe" value={form.tribe} onChangeText={v => handleChange('tribe', v)} />
      <TextInput style={styles.input} placeholder="Area" value={form.area} onChangeText={v => handleChange('area', v)} />
      <TextInput style={styles.input} placeholder="Gender" value={form.gender} onChangeText={v => handleChange('gender', v)} />
      <TextInput style={styles.input} placeholder="Password" value={form.password} secureTextEntry onChangeText={v => handleChange('password', v)} />

      {/* Vitals */}
      <Text style={styles.section}>Vitals</Text>
      <TextInput style={styles.input} placeholder="Weight" value={form.weight} onChangeText={v => handleChange('weight', v)} />
      <TextInput style={styles.input} placeholder="Weight Unit" value={form.weightUnit} onChangeText={v => handleChange('weightUnit', v)} />
      <TextInput style={styles.input} placeholder="Height" value={form.height} onChangeText={v => handleChange('height', v)} />
      <TextInput style={styles.input} placeholder="Height Unit" value={form.heightUnit} onChangeText={v => handleChange('heightUnit', v)} />
      <TextInput style={styles.input} placeholder="BP" value={form.bp} onChangeText={v => handleChange('bp', v)} />
      <TextInput style={styles.input} placeholder="BP Unit" value={form.bpUnit} onChangeText={v => handleChange('bpUnit', v)} />
      <TextInput style={styles.input} placeholder="Pulse" value={form.pulse} onChangeText={v => handleChange('pulse', v)} />
      <TextInput style={styles.input} placeholder="Pulse Unit" value={form.pulseUnit} onChangeText={v => handleChange('pulseUnit', v)} />
      <TextInput style={styles.input} placeholder="Sugar" value={form.sugar} onChangeText={v => handleChange('sugar', v)} />
      <TextInput style={styles.input} placeholder="Sugar Unit" value={form.sugarUnit} onChangeText={v => handleChange('sugarUnit', v)} />
      <TextInput style={styles.input} placeholder="SpO2" value={form.spo2} onChangeText={v => handleChange('spo2', v)} />
      <TextInput style={styles.input} placeholder="SpO2 Unit" value={form.spo2Unit} onChangeText={v => handleChange('spo2Unit', v)} />
      <TextInput style={styles.input} placeholder="Thermal Scan" value={form.thermalScan} onChangeText={v => handleChange('thermalScan', v)} />
      <TextInput style={styles.input} placeholder="Thermal Scan Unit" value={form.thermalScanUnit} onChangeText={v => handleChange('thermalScanUnit', v)} />
      <TextInput style={styles.input} placeholder="Pulse Oximeter" value={form.pulseOximeter} onChangeText={v => handleChange('pulseOximeter', v)} />
      <TextInput style={styles.input} placeholder="Pulse Oximeter Unit" value={form.pulseOximeterUnit} onChangeText={v => handleChange('pulseOximeterUnit', v)} />
      <TextInput style={styles.input} placeholder="Glucometer" value={form.glucometer} onChangeText={v => handleChange('glucometer', v)} />
      <TextInput style={styles.input} placeholder="Glucometer Unit" value={form.glucometerUnit} onChangeText={v => handleChange('glucometerUnit', v)} />
      <TextInput style={styles.input} placeholder="Scale" value={form.scale} onChangeText={v => handleChange('scale', v)} />
      <TextInput style={styles.input} placeholder="Scale Unit" value={form.scaleUnit} onChangeText={v => handleChange('scaleUnit', v)} />
      <TextInput style={styles.input} placeholder="Swab/Virus Result" value={form.swabResult} onChangeText={v => handleChange('swabResult', v)} />

      {/* Symptoms & Notes */}
      <Text style={styles.section}>Symptoms & Notes</Text>
      <TextInput style={styles.input} placeholder="Symptoms" value={form.symptoms} onChangeText={v => handleChange('symptoms', v)} multiline />
      <TextInput style={styles.input} placeholder="Notes" value={form.notes} onChangeText={v => handleChange('notes', v)} multiline />

      <View style={styles.buttonRow}>
        <Button title="Back" onPress={() => navigation.goBack()} />
        <Button title={saving ? 'Saving...' : 'Save'} onPress={handleSave} disabled={saving} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 18, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  section: { fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, width: '100%', marginBottom: 8, padding: 9 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }
});
