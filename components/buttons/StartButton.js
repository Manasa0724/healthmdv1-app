import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const StartButton = ({ navigation }) => {
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Onboarding')}>
      <View style={styles.buttonContainer}>
        <Text style={styles.buttonText}>Get Started</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 100,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
})

export default StartButton;