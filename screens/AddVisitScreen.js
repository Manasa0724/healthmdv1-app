import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Platform, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

// Embedding utilities
import { generateEmbedding } from '../utils/embeddings';

const SUPABASE_URL = 'https://tddfatkdbisikgjynwwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGZhdGtkYmlzaWtnanlud3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODE2NzIsImV4cCI6MjA2OTA1NzY3Mn0.K0etM03LKzZGdZZGisnQoAz0b6wBP9-PDAstta1U7sc';

export default function AddVisitScreen({ route, navigation }) {
  // Use the UUID from users table, not unique_id!
  const { patientId, uniqueId } = route.params;

  const [vitals, setVitals] = useState({
    weight: '', weight_unit: 'kg',
    height: '', height_unit: 'cm',
    bp: '', bp_unit: 'mmHg',
    pulse: '', pulse_unit: 'bpm',
    sugar: '', sugar_unit: 'mg/dL',
    spo2: '', spo2_unit: '%',
    thermal_scan: '', thermal_scan_unit: '°C',
    pulse_oximeter: '', pulse_oximeter_unit: '%',
    glucometer: '', glucometer_unit: 'mg/dL',
    scale: '', scale_unit: 'kg',
    swab_result: '',
    symptoms: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [pickerModal, setPickerModal] = useState({ visible: false, field: '', options: [] });

  const handleChange = (key, value) => setVitals({ ...vitals, [key]: value });

  // For unit picker
  const VitalRow = ({ name, unitKey, label, options, placeholder }) => (
    <View style={styles.row}>
      <TextInput
        style={[styles.input, { flex: 2 }]}
        placeholder={placeholder}
        value={vitals[name]}
        keyboardType="numeric"
        onChangeText={v => handleChange(name, v)}
      />
      {Platform.OS === 'ios' ? (
        <TouchableOpacity
          style={[styles.pickerButton, { flex: 1 }]}
          onPress={() => setPickerModal({ visible: true, field: unitKey, options })}
        >
          <Text>{vitals[unitKey]}</Text>
        </TouchableOpacity>
      ) : (
        <Picker
          selectedValue={vitals[unitKey]}
          onValueChange={v => handleChange(unitKey, v)}
          style={{ flex: 1, height: 44 }}
        >
          {options.map(opt => <Picker.Item label={opt} value={opt} key={opt} />)}
        </Picker>
      )}
    </View>
  );

  // Modal picker for iOS
  const renderPickerModal = () => {
    if (!pickerModal.visible) return null;
    return (
      <Modal
        transparent
        animationType="slide"
        visible={pickerModal.visible}
        onRequestClose={() => setPickerModal({ visible: false, field: '', options: [] })}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPickerModal({ visible: false, field: '', options: [] })}>
          <View style={styles.modalContent}>
            <FlatList
              data={pickerModal.options}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    handleChange(pickerModal.field, item);
                    setPickerModal({ visible: false, field: '', options: [] });
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Build a plain‑text summary string from the vitals and notes to feed into the embedding model.
      const summaryParts = [
        `weight:${vitals.weight || 'NA'} ${vitals.weight_unit}`,
        `height:${vitals.height || 'NA'} ${vitals.height_unit}`,
        `bp:${vitals.bp || 'NA'} ${vitals.bp_unit}`,
        `pulse:${vitals.pulse || 'NA'} ${vitals.pulse_unit}`,
        `sugar:${vitals.sugar || 'NA'} ${vitals.sugar_unit}`,
        `spo2:${vitals.spo2 || 'NA'} ${vitals.spo2_unit}`,
        `thermal:${vitals.thermal_scan || 'NA'} ${vitals.thermal_scan_unit}`,
        `pulse_oximeter:${vitals.pulse_oximeter || 'NA'} ${vitals.pulse_oximeter_unit}`,
        `glucometer:${vitals.glucometer || 'NA'} ${vitals.glucometer_unit}`,
        `scale:${vitals.scale || 'NA'} ${vitals.scale_unit}`,
        `swab_result:${vitals.swab_result || 'NA'}`,
        `symptoms:${vitals.symptoms || 'NA'}`,
        `notes:${vitals.notes || 'NA'}`,
      ];
      const summary = summaryParts.join(', ');
      // Generate an embedding for this visit. If the API key is not configured
      // the embedding will be null. This call can take a moment, so we await it
      // before the Supabase insert.
      const embedding = await generateEmbedding(summary);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/visits`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          patient_id: patientId,
          visit_date: new Date().toISOString(),
          weight: vitals.weight ? parseFloat(vitals.weight) : null,
          weight_unit: vitals.weight_unit,
          height: vitals.height ? parseFloat(vitals.height) : null,
          height_unit: vitals.height_unit,
          bp: vitals.bp,
          bp_unit: vitals.bp_unit,
          pulse: vitals.pulse ? parseFloat(vitals.pulse) : null,
          pulse_unit: vitals.pulse_unit,
          sugar: vitals.sugar ? parseFloat(vitals.sugar) : null,
          sugar_unit: vitals.sugar_unit,
          spo2: vitals.spo2 ? parseFloat(vitals.spo2) : null,
          spo2_unit: vitals.spo2_unit,
          thermal_scan: vitals.thermal_scan ? parseFloat(vitals.thermal_scan) : null,
          thermal_scan_unit: vitals.thermal_scan_unit,
          pulse_oximeter: vitals.pulse_oximeter ? parseFloat(vitals.pulse_oximeter) : null,
          pulse_oximeter_unit: vitals.pulse_oximeter_unit,
          glucometer: vitals.glucometer ? parseFloat(vitals.glucometer) : null,
          glucometer_unit: vitals.glucometer_unit,
          scale: vitals.scale ? parseFloat(vitals.scale) : null,
          scale_unit: vitals.scale_unit,
          swab_result: vitals.swab_result,
          symptoms: vitals.symptoms,
          notes: vitals.notes,
          summary,
          vector_embedding: embedding,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        Alert.alert('Failed to add visit', data.message || JSON.stringify(data));
        return;
      }
      Alert.alert('Visit Added!', 'Visit/vitals were recorded for this patient.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Visit / Vitals</Text>
      <VitalRow name="weight" unitKey="weight_unit" label="Weight" options={['kg', 'lb']} placeholder="Weight" />
      <VitalRow name="height" unitKey="height_unit" label="Height" options={['cm', 'in']} placeholder="Height" />
      <VitalRow name="bp" unitKey="bp_unit" label="BP" options={['mmHg']} placeholder="BP" />
      <VitalRow name="pulse" unitKey="pulse_unit" label="Pulse" options={['bpm']} placeholder="Pulse" />
      <VitalRow name="sugar" unitKey="sugar_unit" label="Sugar" options={['mg/dL', 'mmol/L']} placeholder="Sugar" />
      <VitalRow name="spo2" unitKey="spo2_unit" label="SpO2" options={['%']} placeholder="SpO2" />
      <VitalRow name="thermal_scan" unitKey="thermal_scan_unit" label="Thermal Scan" options={['°C', '°F']} placeholder="Thermal Scan" />
      <VitalRow name="pulse_oximeter" unitKey="pulse_oximeter_unit" label="Pulse Oximeter" options={['%']} placeholder="Pulse Oximeter" />
      <VitalRow name="glucometer" unitKey="glucometer_unit" label="Glucometer" options={['mg/dL', 'mmol/L']} placeholder="Glucometer" />
      <VitalRow name="scale" unitKey="scale_unit" label="Scale" options={['kg', 'lb']} placeholder="Scale" />
      <TextInput
        style={styles.input}
        placeholder="Swab/Virus Result"
        value={vitals.swab_result}
        onChangeText={v => handleChange('swab_result', v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Symptoms"
        value={vitals.symptoms}
        onChangeText={v => handleChange('symptoms', v)}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Notes"
        value={vitals.notes}
        onChangeText={v => handleChange('notes', v)}
        multiline
      />
      <View style={styles.button}>
        <Button title={loading ? 'Submitting...' : 'Submit Visit'} onPress={handleSubmit} disabled={loading} />
      </View>
      {renderPickerModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, width: '100%', marginBottom: 10, padding: 10, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, width: '100%' },
  pickerButton: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10,
    alignItems: 'center', backgroundColor: '#eee', marginLeft: 8,
  },
  button: { marginTop: 12, width: '100%' },
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)'
  },
  modalContent: {
    backgroundColor: '#fff', padding: 18, borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '40%'
  },
  modalItem: {
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee'
  },
});
