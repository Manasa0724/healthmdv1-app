import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert } from 'react-native';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

// Helper: Generate unique ID like FW-123456
function generateUniqueId(prefix = "FW") {
  const code = Math.floor(100000 + Math.random() * 900000); // random 6-digit
  return `${prefix}-${code}`;
}

const AdminApprovalScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/signup_requests?status=eq.pending&select=*`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      const data = await res.json();
      setRequests(data);
    } catch (e) {
      Alert.alert('Error fetching requests', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecision = async (item, approve) => {
    if (approve) {
      // 1. Generate unique ID
      const unique_id = generateUniqueId("FW");

      // 2. Add to users table
      const addRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          unique_id,
          email: item.email,
          first_name: item.first_name,
          last_name: item.last_name,
          dob: item.dob,
          phone_number: item.phone_number,
          password: item.password, // <-- Copy password
          role: 'field_worker',
          is_active: true,
        }),
      });
      const addData = await addRes.json();
      if (!addRes.ok) {
        Alert.alert('Failed to add user', JSON.stringify(addData));
        return;
      }

      // 3. Show the unique ID in the popup
      Alert.alert(
        'User approved!',
        `Field Worker Unique ID:\n\n${unique_id}\n\nShare this with the new Field Worker!`
      );
    }

    // 4. Update signup_requests status
    const status = approve ? 'approved' : 'denied';
    await fetch(`${SUPABASE_URL}/rest/v1/signup_requests?id=eq.${item.id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    fetchRequests(); // Refresh list
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.bold}>{item.first_name} {item.last_name}</Text>
      <Text>Email: {item.email}</Text>
      <Text>Phone: {item.phone_number}</Text>
      <Text>DOB: {item.dob}</Text>
      <View style={styles.row}>
        <Button title="Approve" onPress={() => handleDecision(item, true)} />
        <View style={{ width: 10 }} />
        <Button title="Deny" color="red" onPress={() => handleDecision(item, false)} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Field Worker Requests</Text>
      {loading ? <Text>Loading...</Text> : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text>No pending requests</Text>}
        />
      )}
      <Button title="Refresh" onPress={fetchRequests} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginBottom: 14 },
  bold: { fontWeight: 'bold', fontSize: 18, marginBottom: 4 },
  row: { flexDirection: 'row', marginTop: 10 },
});

export default AdminApprovalScreen;
