import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

export default function VisitHistoryScreen({ route, navigation }) {
  const { patientId } = route.params;
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, [patientId]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/visits?patient_id=eq.${patientId}&order=visit_date.desc`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await res.json();
      setVisits(data);
    } catch (e) {
      setVisits([]);
    }
    setLoading(false);
  };

  const renderVisit = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.date}>
        {item.visit_date ? item.visit_date.slice(0, 16).replace('T', ' ') : '-'}
      </Text>
      <Text style={styles.patientInfo}>Weight: {item.weight ? `${item.weight} ${item.weight_unit}` : '-'}</Text>
      <Text style={styles.patientInfo}>Height: {item.height ? `${item.height} ${item.height_unit}` : '-'}</Text>
      <Text style={styles.patientInfo}>BP: {item.bp ? `${item.bp} ${item.bp_unit}` : '-'}</Text>
      <Text style={styles.patientInfo}>Pulse: {item.pulse ? `${item.pulse} ${item.pulse_unit}` : '-'}</Text>
      <Text style={styles.patientInfo}>Sugar: {item.sugar ? `${item.sugar} ${item.sugar_unit}` : '-'}</Text>
      <Text style={styles.patientInfo}>SpO2: {item.spo2 ? `${item.spo2} ${item.spo2_unit}` : '-'}</Text>
      <Text style={styles.patientInfo}>Thermal Scan: {item.thermal_scan ? `${item.thermal_scan} ${item.thermal_scan_unit}` : '-'}</Text>
      <Text style={styles.patientInfo}>Pulse Oximeter: {item.pulse_oximeter ? `${item.pulse_oximeter} ${item.pulse_oximeter_unit}` : '-'}</Text>
      <Text style={styles.patientInfo}>Glucometer: {item.glucometer ? `${item.glucometer} ${item.glucometer_unit}` : '-'}</Text>
      <Text style={styles.patientInfo}>Scale: {item.scale ? `${item.scale} ${item.scale_unit}` : '-'}</Text>
      <Text style={styles.patientInfo}>Swab/Virus Result: {item.swab_result || '-'}</Text>
      <Text style={styles.patientInfo}>Symptoms: {item.symptoms || '-'}</Text>
      <Text style={styles.patientInfo}>Notes: {item.notes || '-'}</Text>
      {/* EDIT VISIT BUTTON */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditVisit', { visit: item, patientId })}
      >
        <Text style={styles.editButtonText}>Edit Visit</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
  }

  return (
    <FlatList
      data={visits}
      keyExtractor={item => item.id?.toString() || Math.random().toString()}
      renderItem={renderVisit}
      ListHeaderComponent={<Text style={styles.heading}>Visit History</Text>}
      ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>No visits yet.</Text>}
      contentContainerStyle={{ padding: 20, paddingBottom: 40, backgroundColor: '#fff' }}
    />
  );
}

const styles = StyleSheet.create({
  heading: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 18, 
    textAlign: 'center' 
  },

  card: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#f7f7fa',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#eee'
  },
  
  date: { 
    fontWeight: 'bold', 
    color: '#2d55a6', 
    marginBottom: 10,
  },

  editButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: 'black',
    alignSelf: 'flex-start',
  },

  patientInfo: {
    fontSize: 16,
    marginBottom: 5,
  },

  editButtonText: {
    color: '#fff', fontWeight: 'bold',
  },


});
