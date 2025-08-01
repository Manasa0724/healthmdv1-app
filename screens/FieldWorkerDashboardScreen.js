import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const FieldWorkerDashboardScreen = ({ navigation, route }) => {
  // Get the user info passed from login
  const user = route.params?.user;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Welcome, {user?.first_name || 'Field Worker'}!
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Add New Patient"
          onPress={() =>
            navigation.navigate('AddPatientPersonal', { fieldWorkerId: user?.unique_id })
          }
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Patient List"
          onPress={() =>
            navigation.navigate('PatientList', { fieldWorkerId: user?.unique_id })
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
  buttonContainer: { width: 220, marginBottom: 20 }
});

export default FieldWorkerDashboardScreen;
