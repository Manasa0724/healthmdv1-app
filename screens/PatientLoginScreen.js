import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

export default function PatientLoginScreen({ navigation }) {
  const [unique_id, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!unique_id || !password) {
      Alert.alert('Please enter Patient ID and password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?unique_id=eq.${unique_id}&password=eq.${password}`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await res.json();
      setLoading(false);
      if (data.length === 0) {
        Alert.alert('Invalid Patient ID or password');
        return;
      }
      // Navigate to Patient Home/Profile, pass patientId!
      navigation.replace('PatientProfile', { patientId: data[0].id });
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Patient Login</Text>
      <TextInput
        placeholder="Patient ID (e.g., PT-123456)"
        style={styles.input}
        value={unique_id}
        onChangeText={setUniqueId}
        autoCapitalize="characters"
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 22, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12, padding: 12, fontSize: 16 },
});
