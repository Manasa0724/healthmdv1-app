// screens/AdminLoginScreen.js
import React, { useState } from 'react';
import { View, SafeAreaView, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';

// For demo: Hardcode the admin email/password.
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123';

const AdminLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      navigation.navigate('AdminApproval');
    } else {
      Alert.alert('Login failed', 'Invalid credentials.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.heading}>Admin Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          autoCapitalize="none"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Log In</Text>
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
    padding: 30,
    alignSelf: 'center',
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
    width: 250,
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

export default AdminLoginScreen;
