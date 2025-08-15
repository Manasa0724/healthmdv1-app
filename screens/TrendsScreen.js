// screens/TrendsScreen.js
// This screen performs health trend analysis for a given patient. It
// computes simple numeric trends over time, identifies repeated
// symptom clusters and calculates pair‑wise cosine similarity across
// visit records. Results are visualised with a few easy‑to‑read
// summary sections and a side‑by‑side comparison of the two most
// similar visits.

import React, { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

// We reuse the same Supabase credentials defined in the other
// screens. Because we were instructed not to modify any database
// schema, we simply read from the existing visits table and do all
// processing client‑side.
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '';

/**
 * Parse a blood pressure string. If the value contains a slash (e.g.
 * "120/80"), returns [systolic, diastolic]. Otherwise returns the
 * numeric value in the first element and 0 for the second. If the
 * input cannot be parsed, returns [0, 0].
 */
function parseBloodPressure(bp) {
  if (!bp) return [0, 0];
  const str = bp.toString();
  if (str.includes('/')) {
    const [sys, dia] = str.split('/');
    const s = parseFloat(sys);
    const d = parseFloat(dia);
    return [isNaN(s) ? 0 : s, isNaN(d) ? 0 : d];
  }
  const val = parseFloat(str);
  return [isNaN(val) ? 0 : val, 0];
}

/**
 * Build a bag‑of‑words dictionary from all symptom strings. Words
 * are lower‑cased and split on whitespace or commas. Returns an
 * ordered array of unique words.
 */
function buildSymptomDictionary(visits) {
  const set = new Set();
  visits.forEach(v => {
    if (v && v.symptoms) {
      const words = v.symptoms
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map(w => w.trim())
        .filter(Boolean);
      words.forEach(w => set.add(w));
    }
  });
  return Array.from(set);
}

/**
 * Convert a visit record into a numeric vector. The vector
 * concatenates the available numeric measurements (weight, height,
 * blood pressure, pulse, sugar, SpO2, thermal scan, pulse
 * oximeter, glucometer and scale) with a binary bag‑of‑words
 * representation of its symptom text. For missing numeric fields
 * we substitute 0. Booleans for symptom words are 1 when the
 * symptom list contains the term and 0 otherwise. The returned
 * vector is then normalised to unit length.
 */
function visitToVector(visit, words) {
  const vec = [];
  const parseNum = val => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };
  vec.push(parseNum(visit.weight));
  vec.push(parseNum(visit.height));
  const [bpSys, bpDia] = parseBloodPressure(visit.bp);
  vec.push(bpSys);
  vec.push(bpDia);
  vec.push(parseNum(visit.pulse));
  vec.push(parseNum(visit.sugar));
  // note: spo2 is sometimes named spo2 or spO2; we use spo2
  vec.push(parseNum(visit.spo2));
  vec.push(parseNum(visit.thermal_scan));
  vec.push(parseNum(visit.pulse_oximeter));
  vec.push(parseNum(visit.glucometer));
  vec.push(parseNum(visit.scale));
  // symptoms bag of words
  const symptomText = (visit.symptoms || '').toLowerCase();
  words.forEach(w => {
    vec.push(symptomText.includes(w) ? 1 : 0);
  });
  // normalise to unit length to prepare for cosine similarity
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return norm === 0 ? vec.map(() => 0) : vec.map(v => v / norm);
}

/**
 * Compute pair‑wise cosine similarities for all visits. Returns an
 * array of objects { visit1, visit2, similarity } sorted by
 * descending similarity. A similarity of 1 means identical vectors
 * whereas 0 indicates no overlap. Pairs with very few numeric
 * measurements or missing symptom data may exhibit lower scores.
 */
function computeSimilarity(visits) {
  if (!Array.isArray(visits) || visits.length < 2) return [];
  const dict = buildSymptomDictionary(visits);
  const vectors = visits.map(v => visitToVector(v, dict));
  const results = [];
  for (let i = 0; i < visits.length; i++) {
    for (let j = i + 1; j < visits.length; j++) {
      const a = vectors[i];
      const b = vectors[j];
      let dot = 0;
      for (let k = 0; k < a.length; k++) {
        dot += a[k] * b[k];
      }
      results.push({ visit1: visits[i], visit2: visits[j], similarity: dot });
    }
  }
  return results.sort((x, y) => y.similarity - x.similarity);
}

/**
 * Determine simple rising/falling/stable trends for a given numeric
 * measurement across visits. We sort visits chronologically and
 * compare the first and last available values. A relative change
 * greater than 10% counts as rising/falling. Missing values are
 * ignored. Returns 'rising', 'falling' or 'stable'.
 */
function detectTrend(values) {
  if (!values || values.length < 2) return 'stable';
  const first = values[0];
  const last = values[values.length - 1];
  // handle zeros to avoid division by zero
  if (first === 0) {
    const diff = last - first;
    if (diff > 5) return 'rising';
    if (diff < -5) return 'falling';
    return 'stable';
  }
  const change = (last - first) / Math.abs(first);
  if (change > 0.1) return 'rising';
  if (change < -0.1) return 'falling';
  return 'stable';
}

/**
 * Compute trend analysis for the various numeric fields. It returns
 * an array of objects with keys { label, first, last, trend }. Only
 * fields with at least two observed values are included. BP is
 * separated into systolic and diastolic components.
 */
function computeTrends(visits) {
  if (!Array.isArray(visits) || visits.length === 0) return [];
  // sort by ascending date
  const sorted = visits
    .slice()
    .sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));
  // helper to collect non‑null numbers for a field
  const collect = key => {
    return sorted
      .map(v => {
        const val = parseFloat(v[key]);
        return isNaN(val) ? null : val;
      })
      .filter(v => v !== null);
  };
  const metrics = [
    { key: 'weight', label: 'Weight' },
    { key: 'height', label: 'Height' },
    { key: 'pulse', label: 'Pulse' },
    { key: 'sugar', label: 'Sugar' },
    { key: 'spo2', label: 'SpO2' },
    { key: 'thermal_scan', label: 'Thermal Scan' },
    { key: 'pulse_oximeter', label: 'Pulse Oximeter' },
    { key: 'glucometer', label: 'Glucometer' },
    { key: 'scale', label: 'Scale' },
  ];
  const results = [];
  metrics.forEach(m => {
    const vals = collect(m.key);
    if (vals.length >= 2) {
      const trend = detectTrend(vals);
      results.push({ label: m.label, first: vals[0], last: vals[vals.length - 1], trend });
    }
  });
  // handle blood pressure separately
  const bpSys = [];
  const bpDia = [];
  sorted.forEach(v => {
    const [s, d] = parseBloodPressure(v.bp);
    if (s) bpSys.push(s);
    if (d) bpDia.push(d);
  });
  if (bpSys.length >= 2) {
    results.push({ label: 'BP (Systolic)', first: bpSys[0], last: bpSys[bpSys.length - 1], trend: detectTrend(bpSys) });
  }
  if (bpDia.length >= 2) {
    results.push({ label: 'BP (Diastolic)', first: bpDia[0], last: bpDia[bpDia.length - 1], trend: detectTrend(bpDia) });
  }
  return results;
}

/**
 * Identify repeated symptom clusters. If the same symptom string
 * appears on consecutive visits we flag it. The return array
 * contains objects { symptoms, dates } where dates is a pair of
 * ISO strings.
 */
function detectRepeatedSymptoms(visits) {
  if (!Array.isArray(visits) || visits.length < 2) return [];
  const sorted = visits
    .slice()
    .sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));
  const repeats = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = (sorted[i - 1].symptoms || '').trim().toLowerCase();
    const curr = (sorted[i].symptoms || '').trim().toLowerCase();
    if (prev && curr && prev === curr) {
      repeats.push({ symptoms: curr, dates: [sorted[i - 1].visit_date, sorted[i].visit_date] });
    }
  }
  return repeats;
}

export default function TrendsScreen({ route }) {
  const { patientId, visits: initialVisits } = route.params || {};
  const [visits, setVisits] = useState(Array.isArray(initialVisits) ? initialVisits : []);
  const [loading, setLoading] = useState(!initialVisits);
  const [trends, setTrends] = useState([]);
  const [repeats, setRepeats] = useState([]);
  const [similarPairs, setSimilarPairs] = useState([]);
  const [topPair, setTopPair] = useState(null);

  // Load visits from the server if they were not passed in
  useEffect(() => {
    if (!initialVisits) {
      fetchVisits();
    } else {
      analyse(initialVisits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVisits = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/visits?patient_id=eq.${patientId}&order=visit_date.asc`,
        {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        },
      );
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setVisits(list);
      analyse(list);
    } catch (err) {
      setVisits([]);
      setTrends([]);
      setRepeats([]);
      setSimilarPairs([]);
      setTopPair(null);
    }
    setLoading(false);
  };

  const analyse = list => {
    if (!Array.isArray(list) || list.length === 0) {
      setTrends([]);
      setRepeats([]);
      setSimilarPairs([]);
      setTopPair(null);
      return;
    }
    const sims = computeSimilarity(list);
    setSimilarPairs(sims);
    setTopPair(sims.length > 0 ? sims[0] : null);
    setTrends(computeTrends(list));
    setRepeats(detectRepeatedSymptoms(list));
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
  }

  const renderVisitDetails = (v) => {
    return (
      <View style={{ marginBottom: 6 }}>
        <Text>Weight: {v.weight || '-'} {v.weight_unit || ''}</Text>
        <Text>Height: {v.height || '-'} {v.height_unit || ''}</Text>
        <Text>BP: {v.bp || '-' } {v.bp_unit || ''}</Text>
        <Text>Pulse: {v.pulse || '-'} {v.pulse_unit || ''}</Text>
        <Text>Sugar: {v.sugar || '-'} {v.sugar_unit || ''}</Text>
        <Text>SpO2: {v.spo2 || '-'} {v.spo2_unit || ''}</Text>
        <Text>Thermal Scan: {v.thermal_scan || '-'} {v.thermal_scan_unit || ''}</Text>
        <Text>Pulse Oximeter: {v.pulse_oximeter || '-'} {v.pulse_oximeter_unit || ''}</Text>
        <Text>Glucometer: {v.glucometer || '-'} {v.glucometer_unit || ''}</Text>
        <Text>Scale: {v.scale || '-'} {v.scale_unit || ''}</Text>
        <Text>Symptoms: {v.symptoms || '-'}</Text>
        <Text>Notes: {v.notes || '-'}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>Health Trends</Text>
      {/* Trend Analysis */}
      <Text style={styles.subheading}>Trend Analysis</Text>
      {trends.length === 0 && (
        <Text style={{ color: '#666', marginBottom: 8 }}>No sufficient data for trend analysis.</Text>
      )}
      {trends.map((t, idx) => (
        <Text
          key={`trend-${idx}`}
          style={{
            color: t.trend === 'rising' ? '#d32f2f' : t.trend === 'falling' ? '#388e3c' : '#333',
            marginBottom: 4,
          }}
        >
          {t.label}: {t.trend} (from {t.first} to {t.last})
        </Text>
      ))}

      {/* Repeated Symptoms */}
      <Text style={styles.subheading}>Repeated Symptoms</Text>
      {repeats.length === 0 && <Text style={{ color: '#666', marginBottom: 8 }}>None</Text>}
      {repeats.map((r, idx) => (
        <Text key={`repeat-${idx}`} style={{ marginBottom: 4 }}>
          {r.symptoms} (on {r.dates[0]?.slice(0, 10)} & {r.dates[1]?.slice(0, 10)})
        </Text>
      ))}

      {/* Similar Visits */}
      <Text style={styles.subheading}>Similar Visits</Text>
      {similarPairs.length === 0 && <Text style={{ color: '#666', marginBottom: 8 }}>Not enough visits to compare.</Text>}
      {similarPairs.slice(0, 3).map((p, idx) => (
        <Text key={`sim-${idx}`} style={{ marginBottom: 4 }}>
          {p.visit1.visit_date?.slice(0, 10)} & {p.visit2.visit_date?.slice(0, 10)} – Similarity: {(p.similarity * 100).toFixed(1)}%
        </Text>
      ))}

      {/* Visit Comparison */}
      {topPair && (
        <>
          <Text style={styles.subheading}>Comparison (Most Similar Visits)</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.compareHeading}>Visit {topPair.visit1.visit_date?.slice(0, 10)}</Text>
              {renderVisitDetails(topPair.visit1)}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.compareHeading}>Visit {topPair.visit2.visit_date?.slice(0, 10)}</Text>
              {renderVisitDetails(topPair.visit2)}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', flex: 1, padding: 20 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subheading: { fontSize: 18, fontWeight: 'bold', marginTop: 18, marginBottom: 8 },
  compareHeading: { fontWeight: 'bold', marginBottom: 4 },
});
