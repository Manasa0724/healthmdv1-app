// screens/RoleSelectionScreen.js
// For now, this screen is not in use for role selection (to avoid merge conflict) see OnboardingScreen.js
// import { useState } from 'react';
// import { View, Text, Button, StyleSheet } from 'react-native';

// const RoleSelectionScreen = ({ navigation }) => {
//   const [currentIndex, setCurrentIndex] = useState(0);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Who are you?</Text>
//       <View style={styles.button}>
//         <Button
//           title="Field Worker"
//           onPress={() => navigation.navigate('FieldWorkerAuth')}
//         />
//       </View>
//       <View style={styles.button}>
//         <Button
//           title="Patient"
//           onPress={() => navigation.navigate('PatientAuth')}
//         />
//       </View>
//       <View style={styles.button}>
//         <Button
//           title="Admin"
//           onPress={() => navigation.navigate('AdminLogin')}
//           color="#c43"
//         />
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
//   title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40 },
//   button: { width: 200, marginVertical: 12 }
// });

// export default RoleSelectionScreen;
