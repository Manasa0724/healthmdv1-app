import React from 'react'
import { SafeAreaView, Text, StyleSheet, Image} from 'react-native';
import Carousel from '../components/Carousel';

const OnboardingScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Who Are You?</Text>
            <Carousel navigation={navigation}/>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#2a9df4',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 30,
        marginTop: 90,
        width: '100%',
        textAlign: 'center',
        fontWeight: '800',
        color: 'white',
    }
})

export default OnboardingScreen