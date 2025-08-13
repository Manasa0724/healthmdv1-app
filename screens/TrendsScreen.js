// screens/TrendsScreen.js
// This screen performs health trend analysis for a given patient. It
// computes simple numeric trends over time, identifies repeated
// symptom clusters and calculates pair‑wise cosine similarity across
// visit records. Results are visualised with a choice of bar or line
// charts and a side‑by‑side comparison of the two most similar visits.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

// Supabase configuration (read‑only access)
const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

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
 * blood pressure, pulse, sugar, SpO₂, thermal scan, pulse
 * oximeter, glucometer and scale) with a binary bag‑of‑words
 * representation of its symptom text. Missing numeric fields are
 * replaced with 0; symptom terms are represented with 1/0 flags.
 * The vector is normalised to unit length for cosine similarity.
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
  vec.push(parseNum(visit.spo2));
  vec.push(parseNum(visit.thermal_scan));
  vec.push(parseNum(visit.pulse_oximeter));
  vec.push(parseNum(visit.glucometer));
  vec.push(parseNum(visit.scale));
  const symptomText = (visit.symptoms || '').toLowerCase();
  words.forEach(w => {
    vec.push(symptomText.includes(w) ? 1 : 0);
  });
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return norm === 0 ? vec.map(() => 0) : vec.map(v => v / norm);
}

/**
 * Compute pair‑wise cosine similarities for all visits. Returns an
 * array of objects { visit1, visit2, similarity } sorted in
 * descending order of similarity.
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
 * Determine a rising/falling/stable trend by comparing the first and
 * last values of a numeric series. A relative change over 10% is
 * considered rising or falling; otherwise it's stable.
 */
function detectTrend(values) {
  if (!values || values.length < 2) return 'stable';
  const first = values[0];
  const last = values[values.length - 1];
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
 * Compute trend analysis for the various numeric fields. Each entry
 * contains { label, first, last, trend } and only fields with at
 * least two recorded values are included. Blood pressure values are
 * split into systolic and diastolic.
 */
function computeTrends(visits) {
  if (!Array.isArray(visits) || visits.length === 0) return [];
  const sorted = visits
    .slice()
    .sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));
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
    { key: 'spo2', label: 'SpO₂' },
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
 * appears on consecutive visits it's flagged here. Each entry
 * contains { symptoms, dates }.
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
  // For visualising trends we extract numeric series for each metric across
  // visits. Each entry contains { key, label, values, unit }.
  const [series, setSeries] = useState([]);
  // Chart type for visualising metrics. Options: 'bar', 'line'
  const [chartType, setChartType] = useState('bar');

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
    } catch {
      setVisits([]);
      setTrends([]);
      setRepeats([]);
      setSimilarPairs([]);
      setTopPair(null);
    }
    setLoading(false);
  };

  // Analyse visits: compute similarities, trends, repeated symptoms and series data
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

    // Build numeric series for charts (with units)
    const chronological = list.slice().sort(
      (a, b) => new Date(a.visit_date) - new Date(b.visit_date),
    );
    const seriesData = [];
    const metricDefs = [
      { key: 'weight', label: 'Weight' },
      { key: 'height', label: 'Height' },
      { key: 'pulse', label: 'Pulse' },
      { key: 'sugar', label: 'Sugar' },
      { key: 'spo2', label: 'SpO₂' },
      { key: 'thermal_scan', label: 'Thermal Scan' },
      { key: 'pulse_oximeter', label: 'Pulse Oximeter' },
      { key: 'glucometer', label: 'Glucometer' },
      { key: 'scale', label: 'Scale' },
    ];
    const bpSysVals = [];
    const bpDiaVals = [];
    chronological.forEach(v => {
      const [s, d] = parseBloodPressure(v.bp);
      bpSysVals.push(isNaN(s) ? null : s);
      bpDiaVals.push(isNaN(d) ? null : d);
    });
    metricDefs.forEach(({ key, label }) => {
      const vals = chronological.map(v => {
        const n = parseFloat(v[key]);
        return isNaN(n) ? null : n;
      });
      // Determine unit from the first non‑null unit field
      let unit = '';
      for (let i = 0; i < chronological.length; i++) {
        const v = chronological[i];
        const unitProp = `${key}_unit`;
        if (v && v[unitProp]) {
          unit = v[unitProp];
          break;
        }
      }
      if (vals.filter(x => x !== null).length >= 2) {
        seriesData.push({ key, label, values: vals, unit });
      }
    });
    if (bpSysVals.filter(x => x !== null).length >= 2) {
      let bpUnit = '';
      for (let i = 0; i < chronological.length; i++) {
        const v = chronological[i];
        if (v && v.bp_unit) {
          bpUnit = v.bp_unit;
          break;
        }
      }
      seriesData.push({ key: 'bpSys', label: 'BP (Systolic)', values: bpSysVals, unit: bpUnit });
    }
    if (bpDiaVals.filter(x => x !== null).length >= 2) {
      let bpUnit = '';
      for (let i = 0; i < chronological.length; i++) {
        const v = chronological[i];
        if (v && v.bp_unit) {
          bpUnit = v.bp_unit;
          break;
        }
      }
      seriesData.push({ key: 'bpDia', label: 'BP (Diastolic)', values: bpDiaVals, unit: bpUnit });
    }
    setSeries(seriesData);
  };

  /**
   * Render a horizontal bar chart for a numeric series. Each bar
   * corresponds to a visit and extends horizontally based on the
   * measurement value. Visit numbers appear on the y‑axis; the x‑axis
   * shows the range from 0 to the maximum value, with the unit
   * appended. The bar itself is light blue and displays the value in
   * bold inside.
   */
  const renderBarChart = ({ label, values, unit }) => {
    const numeric = values.map(v => (v == null || isNaN(v) ? 0 : v));
    const maxVal = Math.max(...numeric, 0);
    const { width: windowWidth } = Dimensions.get('window');
    const yAxisWidth = 70;
    const chartWidth = windowWidth - yAxisWidth - 40;
    const rowHeight = 24;
    const barColor = '#90caf9';
    return (
      <View key={label} style={{ marginBottom: 32 }}>
        {/* Chart title with unit */}
        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{label}{unit ? ` (${unit})` : ''}</Text>
        <View style={{ flexDirection: 'row' }}>
          {/* Y‑axis: Visit labels */}
          <View style={{ width: yAxisWidth, paddingTop: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#555', marginBottom: 4 }}>Visit</Text>
            {values.map((_, idx) => (
              <View key={`y-${idx}`} style={{ height: rowHeight, justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, color: '#555' }}>{idx + 1}</Text>
              </View>
            ))}
          </View>
          {/* Bars area */}
          <View style={{ flex: 1 }}>
            {/* X‑axis ticks: show 0 and max with units */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginRight: 4 }}>
              <Text style={{ fontSize: 10, color: '#555' }}>0</Text>
              <Text style={{ fontSize: 10, color: '#555' }}>{maxVal} {unit}</Text>
            </View>
            {numeric.map((val, idx) => {
              const isMissing = values[idx] == null || isNaN(values[idx]);
              const barWidth = maxVal === 0 ? 0 : (val / maxVal) * chartWidth;
              return (
                <View key={`row-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', height: rowHeight }}>
                  <View
                    style={{
                      height: rowHeight * 0.6,
                      width: chartWidth,
                      backgroundColor: '#e8eaf6',
                      borderRadius: 4,
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: barWidth,
                        backgroundColor: isMissing ? '#ddd' : barColor,
                        borderRadius: 4,
                        justifyContent: 'center',
                        paddingLeft: 4,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0d47a1' }}>
                        {isMissing ? '-' : String(values[idx])}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {/* X‑axis label */}
            <Text style={{ fontSize: 10, color: '#555', marginTop: 4, alignSelf: 'center' }}>
              {unit ? `${label} (${unit})` : label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render a line chart for a single numeric series. The x‑axis
   * represents visits (1, 2, …), and the y‑axis shows values in the
   * given unit. Points are connected by diagonal segments. Each point
   * displays its value in bold. Min and max tick labels on the y‑axis
   * include the unit.
   */
  const renderLineChart = ({ label, values, unit }) => {
    const numeric = values.map(v => (v == null || isNaN(v) ? 0 : v));
    const maxVal = Math.max(...numeric);
    const minVal = Math.min(...numeric);
    const { width: windowWidth } = Dimensions.get('window');
    const marginLeft = 50;
    const chartWidth = windowWidth - marginLeft - 40;
    const chartHeight = 100;
    const n = numeric.length;
    const stepX = n > 1 ? chartWidth / (n - 1) : chartWidth;
    const points = numeric.map((val, idx) => {
      let y;
      if (maxVal === minVal) {
        y = chartHeight / 2;
      } else {
        y = chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
      }
      const x = marginLeft + idx * stepX;
      return { x, y };
    });
    return (
      <View key={label} style={{ marginBottom: 32 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{label}{unit ? ` (${unit})` : ''}</Text>
        <View
          style={{
            width: marginLeft + chartWidth,
            height: chartHeight + 40,
            backgroundColor: '#f5f5f8',
            borderRadius: 6,
          }}
        >
          {/* Y‑axis max and min labels with units */}
          <Text style={{ position: 'absolute', left: 0, top: -4, fontSize: 10, color: '#555' }}>
            {maxVal} {unit}
          </Text>
          <Text style={{ position: 'absolute', left: 0, top: chartHeight - 8, fontSize: 10, color: '#555' }}>
            {minVal} {unit}
          </Text>
          {/* Line segments */}
          {points.map((pt, idx) => {
            if (idx === points.length - 1) return null;
            const next = points[idx + 1];
            const dx = next.x - pt.x;
            const dy = next.y - pt.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const cx = (pt.x + next.x) / 2;
            const cy = (pt.y + next.y) / 2;
            return (
              <View
                key={`line-${idx}`}
                style={{
                  position: 'absolute',
                  left: cx - length / 2,
                  top: cy - 1,
                  width: length,
                  height: 2,
                  backgroundColor: '#90caf9',
                  transform: [{ rotateZ: `${angle}rad` }],
                }}
              />
            );
          })}
          {/* Points and labels */}
          {points.map((pt, idx) => {
            const isMissing = values[idx] == null || isNaN(values[idx]);
            return (
              <React.Fragment key={`pt-${idx}`}>
                <View
                  style={{
                    position: 'absolute',
                    left: pt.x - 4,
                    top: pt.y - 4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isMissing ? '#ddd' : '#90caf9',
                  }}
                />
                <Text
                  style={{
                    position: 'absolute',
                    left: pt.x - 10,
                    top: pt.y - 20,
                    fontSize: 9,
                    color: '#0d47a1',
                    fontWeight: 'bold',
                  }}
                >
                  {isMissing ? '-' : String(values[idx])}
                </Text>
              </React.Fragment>
            );
          })}
          {/* X‑axis tick labels (visit numbers) */}
          {points.map((pt, idx) => (
            <Text
              key={`xlab-${idx}`}
              style={{
                position: 'absolute',
                left: pt.x - 6,
                top: chartHeight + 6,
                fontSize: 9,
                color: '#555',
              }}
            >
              {idx + 1}
            </Text>
          ))}
          {/* X‑axis label */}
          <Text
            style={{
              position: 'absolute',
              left: marginLeft + chartWidth / 2 - 30,
              top: chartHeight + 20,
              fontSize: 9,
              color: '#555',
            }}
          >
            Visit
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
  }

  // Render detailed information for each visit in the comparison section
  const renderVisitDetails = v => (
    <View style={{ marginBottom: 6 }}>
      <Text>Weight: {v.weight || '-'} {v.weight_unit || ''}</Text>
      <Text>Height: {v.height || '-'} {v.height_unit || ''}</Text>
      <Text>BP: {v.bp || '-'} {v.bp_unit || ''}</Text>
      <Text>Pulse: {v.pulse || '-'} {v.pulse_unit || ''}</Text>
      <Text>Sugar: {v.sugar || '-'} {v.sugar_unit || ''}</Text>
      <Text>SpO₂: {v.spo2 || '-'} {v.spo2_unit || ''}</Text>
      <Text>Thermal Scan: {v.thermal_scan || '-'} {v.thermal_scan_unit || ''}</Text>
      <Text>Pulse Oximeter: {v.pulse_oximeter || '-'} {v.pulse_oximeter_unit || ''}</Text>
      <Text>Glucometer: {v.glucometer || '-'} {v.glucometer_unit || ''}</Text>
      <Text>Scale: {v.scale || '-'} {v.scale_unit || ''}</Text>
      <Text>Symptoms: {v.symptoms || '-'}</Text>
      <Text>Notes: {v.notes || '-'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>Health Trends</Text>

      {/* Trend summary */}
      <Text style={styles.subheading}>Trend Analysis</Text>
      {trends.length === 0 ? (
        <Text style={{ color: '#666', marginBottom: 8 }}>No sufficient data for trend analysis.</Text>
      ) : (
        trends.map((t, idx) => (
          <Text
            key={`trend-${idx}`}
            style={{
              color: t.trend === 'rising' ? '#d32f2f' : t.trend === 'falling' ? '#388e3c' : '#333',
              marginBottom: 4,
            }}
          >
            {t.label}: {t.trend} (from {t.first} to {t.last})
          </Text>
        ))
      )}

      {/* Repeated symptom clusters */}
      <Text style={styles.subheading}>Repeated Symptoms</Text>
      {repeats.length === 0 ? (
        <Text style={{ color: '#666', marginBottom: 8 }}>None</Text>
      ) : (
        repeats.map((r, idx) => (
          <Text key={`repeat-${idx}`} style={{ marginBottom: 4 }}>
            {r.symptoms} (on {r.dates[0]?.slice(0, 10)} & {r.dates[1]?.slice(0, 10)})
          </Text>
        ))
      )}

      {/* Trend visualisations */}
      {series.length > 0 && (
        <>
          <Text style={styles.subheading}>Trend Visualisations</Text>
          {/* Chart type selector */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8, marginTop: 4 }}>
            {['bar', 'line'].map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setChartType(type)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginHorizontal: 4,
                  borderRadius: 4,
                  backgroundColor: chartType === type ? '#6a1b9a' : '#e0e0e0',
                }}
              >
                <Text style={{ color: chartType === type ? '#fff' : '#333', fontSize: 12, fontWeight: 'bold' }}>
                  {type === 'bar' ? 'Bars' : 'Lines'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {chartType === 'bar'
            ? series.map(ser => renderBarChart(ser))
            : series.map(ser => renderLineChart(ser))}
        </>
      )}

      {/* Similar visits summary */}
      <Text style={styles.subheading}>Similar Visits</Text>
      {similarPairs.length === 0 ? (
        <Text style={{ color: '#666', marginBottom: 8 }}>Not enough visits to compare.</Text>
      ) : (
        similarPairs.slice(0, 3).map((p, idx) => (
          <Text key={`sim-${idx}`} style={{ marginBottom: 4 }}>
            {p.visit1.visit_date?.slice(0, 10)} & {p.visit2.visit_date?.slice(0, 10)} – Similarity:{' '}
            {(p.similarity * 100).toFixed(1)}%
          </Text>
        ))
      )}

      {/* Detailed comparison of the most similar pair */}
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
