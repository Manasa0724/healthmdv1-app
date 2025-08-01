import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const FieldWorkerAuthScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Field Worker</Text>
      <Button title="Login" onPress={() => navigation.navigate('FieldWorkerLogin')} />
      <View style={{ height: 10 }} />
      <Button title="Sign Up" onPress={() => navigation.navigate('FieldWorkerSignup')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});

export default FieldWorkerAuthScreen;
