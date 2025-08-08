import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

export default function PatientListScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // Updated query: fetch only patients
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?role=eq.patient&order=created_at.desc`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (e) {
      setPatients([]);
    }
    setLoading(false);
  };

  // Filter patients by search
  const filteredPatients = patients.filter(p =>
    (`${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().includes(search.toLowerCase())) ||
    (p.unique_id && p.unique_id.toLowerCase().includes(search.toLowerCase()))
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('PatientProfile', {
          patientId: item.id,         // uuid (for DB actions!)
          uniqueId: item.unique_id,   // for friendly display
        })
      }
    >
      <Text style={styles.name}>
        {item.unique_id} - {item.first_name} {item.last_name}
      </Text>
      <Text style={styles.details}>
        DOB: {item.dob || '-'} | Gender: {item.gender || '-'}
      </Text>
      <Text style={styles.details}>
        Tribe: {item.tribe || '-'} | Area: {item.area || '-'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Patient List</Text>
      <TextInput
        style={styles.search}
        placeholder="Search by name or ID"
        value={search}
        onChangeText={setSearch}
      />
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderItem}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#aaa' }}>No patients found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  heading: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 18, 
    textAlign: 'center' 
  },

  search: {
    borderWidth: 1, borderColor: '#bbb', borderRadius: 7,
    padding: 10, marginBottom: 15, fontSize: 16
  },

  card: {
    backgroundColor: '#f8f9fb', 
    borderRadius: 8, 
    padding: 15,
    marginBottom: 14, 
    borderWidth: 1, 
    borderColor: '#e2e2e2',
  },
  
  name: { 
    fontWeight: 'bold', 
    fontSize: 18, 
    marginBottom: 2 
  },

  details: { 
    fontSize: 14, 
    color: '#555' 
  },
});
