import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const PatientAuthScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Patient</Text>
    <Button
      title="Login"
      onPress={() => navigation.navigate('PatientLogin')}
    />
    <View style={{ height: 12 }} />
    <Button
      title="Sign Up"
      onPress={() => navigation.navigate('PatientSignup')}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32 },
});

export default PatientAuthScreen;
