import React, { useState } from 'react';
import Constants from 'expo-constants';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '';

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
        Alert.alert('Login successful!', `Welcome, ${data[0].first_name}`, [
          {
            text: 'Continue',
            onPress: () => {
              navigation.replace('FieldWorkerDashboard', { user: data[0] });
            },
          },
        ]);
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
    <View style={styles.container}>
      <Text style={styles.title}>Field Worker Login</Text>
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
      <Button
        title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, width: '100%', marginBottom: 14, padding: 10 }
});

export default FieldWorkerLoginScreen;
