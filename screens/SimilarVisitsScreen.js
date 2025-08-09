import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { rpcSimilarVisits } from "../utils/supabase";

export default function SimilarVisitsScreen({ route, navigation }) {
  const { seedVector, patientId, minSim = 0.75 } = route.params;
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await rpcSimilarVisits({ vector: seedVector, patientId, limit: 20, minSim });
        setRows(data);
      } catch (e) {
        console.error(e);
        Alert.alert("Error", e.message || "Similarity query failed");
      }
    })();
  }, [seedVector, patientId, minSim]);

  if (!rows) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 8 }}>Similar Visits</Text>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.visit_id}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 }}>
            <Text style={{ fontWeight: "600" }}>{new Date(item.recorded_at).toLocaleString()}</Text>
            <Text numberOfLines={3} style={{ marginTop: 4 }}>{item.summary}</Text>
            <Text style={{ marginTop: 4, opacity: 0.7 }}>
              BP: {item.bp_systolic ?? "-"} / {item.bp_diastolic ?? "-"} | HR: {item.heart_rate ?? "-"}
            </Text>
            <Text style={{ marginTop: 4 }}>Similarity: {item.similarity.toFixed(3)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
