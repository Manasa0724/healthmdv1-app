import React from 'react';
import { View, Text, StyleSheet, Image, Button } from 'react-native';
import StartButton from '../components/buttons/StartButton';

const LandingScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Image style={styles.logo} source={require('../assets/healthlogo.png')} />
            <Text style={styles.title}>Welcome to HealthMD</Text>
            <StartButton navigation={navigation} />
        </View>
    )
}

const styles = StyleSheet.create({
    logo: {
        width: 180,
        height: 180,
    },
    container: {
        flex: 1,
        paddingTop: 200,
        alignItems: 'center',
        backgroundColor: '#2a9df4'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 40,
        color: '#ffff',
    }
});

export default LandingScreen;