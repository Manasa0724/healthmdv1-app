import React, { useState } from 'react';
import Constants from 'expo-constants';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || ''; 
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || ''; 

const FieldWorkerSignupScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    email: '',
    phone_number: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSignup = async () => {
    // Basic validation
    if (
      !form.first_name ||
      !form.last_name ||
      !form.dob ||
      !form.email ||
      !form.phone_number ||
      !form.password
    ) {
      Alert.alert('Please fill all fields');
      return;
    }
    setLoading(true);

    const bodyToSend = {
      first_name: form.first_name,
      last_name: form.last_name,
      dob: form.dob,
      email: form.email,
      phone_number: form.phone_number,
      password: form.password,
      requested_role: 'field_worker',
      status: 'pending'
    };

    console.log('BODY SENDING TO SUPABASE:', bodyToSend); // Debug log

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/signup_requests`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(bodyToSend),
      });

      const data = await res.json();
      console.log("RESPONSE FROM SUPABASE:", data); // Debug log
      if (res.ok) {
        Alert.alert(
          'Signup request sent!',
          'Your request has been sent to admin for approval. You will receive an email once approved.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Signup failed', data.message || JSON.stringify(data));
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Field Worker Signup</Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={form.first_name}
        onChangeText={v => handleChange('first_name', v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={form.last_name}
        onChangeText={v => handleChange('last_name', v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={form.dob}
        onChangeText={v => handleChange('dob', v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={form.email}
        keyboardType="email-address"
        onChangeText={v => handleChange('email', v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={form.phone_number}
        keyboardType="phone-pad"
        onChangeText={v => handleChange('phone_number', v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={form.password}
        secureTextEntry
        onChangeText={v => handleChange('password', v)}
      />
      <View style={styles.button}>
        <Button
          title={loading ? "Submitting..." : "Submit Request"}
          onPress={handleSignup}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, width: '100%', marginBottom: 14, padding: 10 },
  button: { marginTop: 10, width: '100%' }
});

export default FieldWorkerSignupScreen;
