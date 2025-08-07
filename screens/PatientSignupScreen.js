import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

function generatePatientID() {
  // Generate a random 6-digit Patient ID
  return 'PT-' + Math.floor(100000 + Math.random() * 900000);
}

export default function PatientSignupScreen({ navigation }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', dob: '', email: '', phone_number: '',
    tribe: '', area: '', password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSignup = async () => {
    if (!form.first_name || !form.last_name || !form.dob || !form.email || !form.password) {
      Alert.alert('All fields marked * are required');
      return;
    }
    setLoading(true);
    const unique_id = generatePatientID();

    try {
      // Save to Supabase (add `role: 'patient'`)
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ ...form, unique_id, role: 'patient' }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        Alert.alert('Signup failed', JSON.stringify(data));
        return;
      }
      Alert.alert(
        'Signup Successful',
        `Your Patient ID: ${unique_id}\n\nPlease use this Patient ID to login.`,
        [{ text: 'OK', onPress: () => navigation.navigate('PatientAuth') }]
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.heading}>Patient Sign Up</Text>
        <TextInput placeholder="First Name*" style={styles.input} value={form.first_name} onChangeText={v => handleChange('first_name', v)} />
        <TextInput placeholder="Last Name*" style={styles.input} value={form.last_name} onChangeText={v => handleChange('last_name', v)} />
        <TextInput placeholder="Date of Birth (YYYY-MM-DD)*" style={styles.input} value={form.dob} onChangeText={v => handleChange('dob', v)} />
        <TextInput placeholder="Email*" style={styles.input} value={form.email} onChangeText={v => handleChange('email', v)} keyboardType="email-address" />
        <TextInput placeholder="Phone (optional)" style={styles.input} value={form.phone_number} onChangeText={v => handleChange('phone_number', v)} keyboardType="phone-pad" />
        <TextInput placeholder="Tribe" style={styles.input} value={form.tribe} onChangeText={v => handleChange('tribe', v)} />
        <TextInput placeholder="Area" style={styles.input} value={form.area} onChangeText={v => handleChange('area', v)} />
        <TextInput placeholder="Password*" style={styles.input} value={form.password} onChangeText={v => handleChange('password', v)} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a9df4'
  },
  form: {
    alignSelf: 'center',
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 22,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0ff',
    borderRadius: 5,
    marginBottom: 12,
    padding: 12,
    fontSize: 16
  },
  button: {
    backgroundColor: 'black',
    padding: 16,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 12,
  }
});
