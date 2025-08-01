// screens/AddPatientPersonalScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity, ActionSheetIOS } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

function generatePatientId() {
  return 'PT-' + Math.floor(100000 + Math.random() * 900000);
}

export default function AddPatientPersonalScreen({ navigation, route }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    email: '',
    phone_number: '',
    tribe: '',
    area: '',
    gender: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  const openGenderPicker = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', ...genderOptions],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex > 0) handleChange('gender', genderOptions[buttonIndex - 1]);
      }
    );
  };

  // Submit personal details to Supabase users table
  const handleNext = async () => {
    if (!form.first_name || !form.last_name || !form.dob || !form.gender || !form.password) {
      Alert.alert('Fill all required fields');
      return;
    }
    setLoading(true);
    const unique_id = generatePatientId();

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          ...form,
          unique_id,
          role: 'patient',
          is_active: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.length > 0) {
        const newPatient = data[0];
        navigation.navigate('AddPatientVitals', {
          patientId: newPatient.id, // UUID from DB
          unique_id: newPatient.unique_id,
          personal: { ...form, unique_id }
        });
      } else {
        Alert.alert('Error', data.message || JSON.stringify(data));
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add Patient - Personal Details</Text>
      <TextInput style={styles.input} placeholder="First Name*" value={form.first_name} onChangeText={v => handleChange('first_name', v)} />
      <TextInput style={styles.input} placeholder="Last Name*" value={form.last_name} onChangeText={v => handleChange('last_name', v)} />
      <TextInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)*" value={form.dob} onChangeText={v => handleChange('dob', v)} />
      <TextInput style={styles.input} placeholder="Email" value={form.email} keyboardType="email-address" onChangeText={v => handleChange('email', v)} />
      <TextInput style={styles.input} placeholder="Phone Number" value={form.phone_number} keyboardType="phone-pad" onChangeText={v => handleChange('phone_number', v)} />
      <TextInput style={styles.input} placeholder="Tribe" value={form.tribe} onChangeText={v => handleChange('tribe', v)} />
      <TextInput style={styles.input} placeholder="Area" value={form.area} onChangeText={v => handleChange('area', v)} />
      {/* Gender Picker: iOS uses ActionSheet, Android uses Picker */}
      {Platform.OS === 'ios' ? (
        <TouchableOpacity style={styles.pickerBox} onPress={openGenderPicker}>
          <Text style={{ color: form.gender ? '#111' : '#888', fontSize: 16 }}>
            {form.gender ? form.gender : 'Select Gender*'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={form.gender}
            onValueChange={v => handleChange('gender', v)}
            style={{ width: '100%' }}
          >
            <Picker.Item label="Select Gender*" value="" />
            {genderOptions.map(opt => (
              <Picker.Item label={opt} value={opt} key={opt} />
            ))}
          </Picker>
        </View>
      )}
      <TextInput style={styles.input} placeholder="Password*" value={form.password} secureTextEntry onChangeText={v => handleChange('password', v)} />
      <View style={styles.button}>
        <Button title={loading ? "Submitting..." : "Next: Vitals"} onPress={handleNext} disabled={loading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, width: '100%', marginBottom: 10, padding: 10, fontSize: 16 },
  pickerBox: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  button: { marginTop: 12, width: '100%' }
});
