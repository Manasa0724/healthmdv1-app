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
      <Text>Weight: {item.weight ? `${item.weight} ${item.weight_unit}` : '-'}</Text>
      <Text>Height: {item.height ? `${item.height} ${item.height_unit}` : '-'}</Text>
      <Text>BP: {item.bp ? `${item.bp} ${item.bp_unit}` : '-'}</Text>
      <Text>Pulse: {item.pulse ? `${item.pulse} ${item.pulse_unit}` : '-'}</Text>
      <Text>Sugar: {item.sugar ? `${item.sugar} ${item.sugar_unit}` : '-'}</Text>
      <Text>SpO2: {item.spo2 ? `${item.spo2} ${item.spo2_unit}` : '-'}</Text>
      <Text>Thermal Scan: {item.thermal_scan ? `${item.thermal_scan} ${item.thermal_scan_unit}` : '-'}</Text>
      <Text>Pulse Oximeter: {item.pulse_oximeter ? `${item.pulse_oximeter} ${item.pulse_oximeter_unit}` : '-'}</Text>
      <Text>Glucometer: {item.glucometer ? `${item.glucometer} ${item.glucometer_unit}` : '-'}</Text>
      <Text>Scale: {item.scale ? `${item.scale} ${item.scale_unit}` : '-'}</Text>
      <Text>Swab/Virus Result: {item.swab_result || '-'}</Text>
      <Text>Symptoms: {item.symptoms || '-'}</Text>
      <Text>Notes: {item.notes || '-'}</Text>
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
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' },
  card: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f7f7fa',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#eee'
  },
  date: { fontWeight: 'bold', color: '#2d55a6', marginBottom: 6 },
  editButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: '#1976d2',
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#fff', fontWeight: 'bold', fontSize: 16,
  },

  trendsButton: {
    marginTop: 6,
    backgroundColor: '#6a1b9a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  trendsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

});
