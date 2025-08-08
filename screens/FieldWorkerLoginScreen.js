import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

// For testing:
// FW-483681
// pw: 123
const FieldWorkerLoginScreen = ({ navigation }) => {
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!uniqueId || !password) {
      Alert.alert('Please enter both Unique ID and Password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?unique_id=eq.${uniqueId}&password=eq.${password}&role=eq.field_worker&is_active=eq.true&select=*`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      const data = await res.json();
      if (data.length === 1) {
        navigation.replace('FieldWorkerDashboard', { user: data[0] });

      } else {
        Alert.alert('Login failed', 'Invalid credentials or user not approved.');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.heading}>Field Worker Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Unique ID (e.g. FW-123456)"
          value={uniqueId}
          autoCapitalize="characters"
          onChangeText={setUniqueId}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Login</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2a9df4'
  },

  form: {
    marginTop: 90,
    alignSelf: 'center',
    padding: 30,
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
    marginTop: 30,
  }
});

export default FieldWorkerLoginScreen;
