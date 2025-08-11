// screens/PatientProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

export default function PatientProfileScreen({ route, navigation }) {
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [latestVisit, setLatestVisit] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch patient personal details
  const fetchPatient = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${patientId}&select=*`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await res.json();
      setPatient(data[0] || null);
    } catch {
      setPatient(null);
    }
    setLoading(false);
  };

  // Fetch most recent visit
  const fetchLatestVisit = async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/visits?patient_id=eq.${patientId}&order=visit_date.desc&limit=1`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await res.json();
      setLatestVisit(data[0] || null);
    } catch {
      setLatestVisit(null);
    }
  };

  // Fetch all visits
  const fetchVisits = async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/visits?patient_id=eq.${patientId}&order=visit_date.desc`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await res.json();
      setVisits(Array.isArray(data) ? data : []);
    } catch {
      setVisits([]);
    }
  };

  useEffect(() => {
    fetchPatient();
    fetchLatestVisit();
    fetchVisits();
  }, [patientId]);

  if (loading || !patient) return <ActivityIndicator size="large" style={{ flex: 1, marginTop: 100 }} />;

  // Helper function for formatting latest vitals
  function formatVitals(visit) {
    if (!visit) return '-';
    return [
      `Weight: ${visit.weight || '-'} ${visit.weight_unit || ''}`,
      `Height: ${visit.height || '-'} ${visit.height_unit || ''}`,
      `BP: ${visit.bp || '-'} ${visit.bp_unit || ''}`,
      `Pulse: ${visit.pulse || '-'} ${visit.pulse_unit || ''}`,
      `Sugar: ${visit.sugar || '-'} ${visit.sugar_unit || ''}`,
      `SpO2: ${visit.spo2 || '-'} ${visit.spo2_unit || ''}`,
      `Thermal Scan: ${visit.thermal_scan || '-'} ${visit.thermal_scan_unit || ''}`,
      `Pulse Oximeter: ${visit.pulse_oximeter || '-'} ${visit.pulse_oximeter_unit || ''}`,
      `Glucometer: ${visit.glucometer || '-'} ${visit.glucometer_unit || ''}`,
      `Scale: ${visit.scale || '-'} ${visit.scale_unit || ''}`,
      `Swab/Virus Result: ${visit.swab_result || '-'}`,
      `Notes: ${visit.notes || '-'}`
    ].join('\n');
  }

  // Render personal info row
  const InfoRow = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}:</Text>
      <Text style={styles.rowValue}>{value ? value.toString() : '-'}</Text>
    </View>
  );

  // Render latest vitals/symptoms/notes
  const renderLatestVisit = () => {
    if (!latestVisit) return <Text style={{ fontStyle: 'italic', color: '#666' }}>No visits yet.</Text>;
    return (
      <View>
        <InfoRow label="Visit Date" value={latestVisit.visit_date?.slice(0, 16)} />
        <InfoRow label="Weight" value={latestVisit.weight ? `${latestVisit.weight} ${latestVisit.weight_unit}` : '-'} />
        <InfoRow label="Height" value={latestVisit.height ? `${latestVisit.height} ${latestVisit.height_unit}` : '-'} />
        <InfoRow label="BP" value={latestVisit.bp ? `${latestVisit.bp} ${latestVisit.bp_unit}` : '-'} />
        <InfoRow label="Pulse" value={latestVisit.pulse ? `${latestVisit.pulse} ${latestVisit.pulse_unit}` : '-'} />
        <InfoRow label="Sugar" value={latestVisit.sugar ? `${latestVisit.sugar} ${latestVisit.sugar_unit}` : '-'} />
        <InfoRow label="SpO2" value={latestVisit.spo2 ? `${latestVisit.spo2} ${latestVisit.spo2_unit}` : '-'} />
        <InfoRow label="Thermal Scan" value={latestVisit.thermal_scan ? `${latestVisit.thermal_scan} ${latestVisit.thermal_scan_unit}` : '-'} />
        <InfoRow label="Pulse Oximeter" value={latestVisit.pulse_oximeter ? `${latestVisit.pulse_oximeter} ${latestVisit.pulse_oximeter_unit}` : '-'} />
        <InfoRow label="Glucometer" value={latestVisit.glucometer ? `${latestVisit.glucometer} ${latestVisit.glucometer_unit}` : '-'} />
        <InfoRow label="Scale" value={latestVisit.scale ? `${latestVisit.scale} ${latestVisit.scale_unit}` : '-'} />
        <InfoRow label="Swab/Virus Result" value={latestVisit.swab_result || '-'} />
        <InfoRow label="Symptoms" value={latestVisit.symptoms || '-'} />
        <InfoRow label="Notes" value={latestVisit.notes || '-'} />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>Patient Profile</Text>
      <InfoRow label="Unique ID" value={patient.unique_id} />
      <InfoRow label="Name" value={`${patient.first_name} ${patient.last_name}`} />
      <InfoRow label="DOB" value={patient.dob} />
      <InfoRow label="Gender" value={patient.gender} />
      <InfoRow label="Phone" value={patient.phone_number} />
      <InfoRow label="Tribe" value={patient.tribe} />
      <InfoRow label="Area" value={patient.area} />
      <InfoRow label="Email" value={patient.email} />

      <View style={{ height: 18 }} />
      <Text style={styles.subheading}>Latest Visit</Text>
      {renderLatestVisit()}

      <View style={styles.btnGroup}>
        <Button title="Visit History" onPress={() => navigation.navigate('VisitHistory', { patientId: patient.id  })} />
        <Button title="New Visit" color="#388e3c" onPress={() => navigation.navigate('AddVisit', { patientId: patient.id, uniqueId: patient.unique_id })} />
      </View>

      {/* ---- ASK AI BUTTON ---- */}
      <TouchableOpacity
        style={styles.askAIButton}
        onPress={() => {
          navigation.navigate('AskAI', {
            patient,
            visits,
            patientId: patient.id,
            latestVitals: formatVitals(latestVisit),
            latestSymptoms: latestVisit?.symptoms || '',
          });
        }}
      >
        <Text style={styles.askAIText}>Ask AI</Text>
      </TouchableOpacity>

            {/* ---- TRENDS BUTTON ---- */}
      <TouchableOpacity
        style={styles.trendsButton}
        onPress={() => {
          navigation.navigate('Trends', {
            patientId: patient.id,
            visits,
          });
        }}
      >
        <Text style={styles.trendsText}>View Trends</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', flex: 1, padding: 20 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subheading: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 6, alignItems: 'center' },
  rowLabel: { width: 130, color: '#666', fontWeight: '600' },
  rowValue: { flex: 1, fontSize: 16 },
  btnGroup: { marginTop: 25, gap: 12 },
  askAIButton: {
    marginTop: 22,
    alignSelf: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 26,
    paddingVertical: 11,
    borderRadius: 7,
  },
  askAIText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },

  trendsButton: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: '#6a1b9a',
    paddingHorizontal: 26,
    paddingVertical: 11,
    borderRadius: 7,
  },
  trendsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
});
