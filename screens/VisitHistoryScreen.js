import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

// Embedding and trend utilities
import { cosineSimilarity } from '../utils/embeddings';
import { detectTrend } from '../utils/trends';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

export default function VisitHistoryScreen({ route, navigation }) {
  const { patientId } = route.params;
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  // Store computed trend information per vital. Values will be strings
  // such as 'increasing', 'decreasing' or 'stable'.
  const [trends, setTrends] = useState(null);
  // Store visits that are similar to the most recent one. Each entry
  // contains the visit and a similarity score.
  const [similarVisits, setSimilarVisits] = useState([]);

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
      // After visits are loaded compute trends and similar visits.
      if (Array.isArray(data) && data.length > 0) {
        // Compute trend for numeric vitals. We parse strings into numbers when possible.
        const parseFloatSafe = (val) => {
          const num = parseFloat(val);
          return isNaN(num) ? null : num;
        };
        const weights = data.map(v => parseFloatSafe(v.weight));
        const pulses = data.map(v => parseFloatSafe(v.pulse));
        const sugars = data.map(v => parseFloatSafe(v.sugar));
        const spo2s = data.map(v => parseFloatSafe(v.spo2));
        const thermals = data.map(v => parseFloatSafe(v.thermal_scan));
        const trendsObj = {
          weight: detectTrend(weights),
          pulse: detectTrend(pulses),
          sugar: detectTrend(sugars),
          spo2: detectTrend(spo2s),
          thermal: detectTrend(thermals),
        };
        setTrends(trendsObj);
        // Compute similar visits using cosine similarity on embeddings. Use the most recent visit as the reference.
        const reference = data[0];
        const refEmb = reference?.vector_embedding;
        if (Array.isArray(refEmb)) {
          const sims = [];
          for (let i = 1; i < data.length; i++) {
            const emb = data[i].vector_embedding;
            if (Array.isArray(emb) && emb.length === refEmb.length) {
              const score = cosineSimilarity(refEmb, emb);
              // Use a relatively high threshold to filter out weak matches
              if (score >= 0.9) {
                sims.push({ visit: data[i], score });
              }
            }
          }
          sims.sort((a, b) => b.score - a.score);
          setSimilarVisits(sims);
        } else {
          setSimilarVisits([]);
        }
      } else {
        setTrends(null);
        setSimilarVisits([]);
      }
    } catch (e) {
      setVisits([]);
      setTrends(null);
      setSimilarVisits([]);
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
      ListHeaderComponent={() => (
        <View>
          <Text style={styles.heading}>Visit History</Text>
          {/* Show computed trends if available */}
          {trends && (
            <View style={styles.trendContainer}>
              <Text style={styles.trendHeading}>Vital Trends:</Text>
              <Text style={styles.trendItem}>Weight: {trends.weight}</Text>
              <Text style={styles.trendItem}>Pulse: {trends.pulse}</Text>
              <Text style={styles.trendItem}>Sugar: {trends.sugar}</Text>
              <Text style={styles.trendItem}>SpO2: {trends.spo2}</Text>
              <Text style={styles.trendItem}>Thermal: {trends.thermal}</Text>
            </View>
          )}
          {/* Show similar visits if any */}
          {similarVisits && similarVisits.length > 0 && (
            <View style={styles.trendContainer}>
              <Text style={styles.trendHeading}>Similar Visits:</Text>
              {similarVisits.map(({ visit, score }) => (
                <Text key={visit.id} style={styles.trendItem}>
                  {visit.visit_date ? visit.visit_date.slice(0, 16).replace('T', ' ') : '-'}
                  {` (score ${score.toFixed(2)})`}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
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
  /**
   * Trend and similarity containers displayed at the top of the list.
   * These styles provide subtle background shading and spacing to
   * differentiate analytics information from the visit cards below.
   */
  trendContainer: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#eef4fb',
  },
  trendHeading: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2d55a6',
  },
  trendItem: {
    fontSize: 14,
    color: '#333',
  }
});
