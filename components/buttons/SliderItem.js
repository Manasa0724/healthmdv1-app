import React, { Component } from 'react'
import { Text, StyleSheet, View, Image, useWindowDimensions, TouchableOpacity} from 'react-native'

const SliderItem = ({ item, navigation }) => {
    const { width } = useWindowDimensions();

    return (
      <View style={[styles.container, { width }]}>
        <Image source={item.image} style={[styles.image, { width, resizeMode: 'contain' }]} />

        <View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>

        {/* Don't add sign up button for Admin, (admin item id is 3) */}
        {item.id !== '3' && <TouchableOpacity style={styles.signUpButton} onPress = {() => {
            switch (item.id) {
                case '1':
                    navigation.navigate('PatientSignup')
                    break;
                case '2':
                    navigation.navigate('FieldWorkerSignup')
                    break;
                default:
                    break;
            }
        }}>
            <Text style={{fontWeight: 'bold', fontSize: 18}}>Sign Up</Text>
        </TouchableOpacity>}
        <TouchableOpacity style={styles.logInButton} onPress = {() => {
            switch (item.id) {
                case '1':
                    navigation.navigate('PatientLogin')
                    break;
                case '2':
                    navigation.navigate('FieldWorkerLogin')
                    break;
                case '3':
                    navigation.navigate('AdminLogin')
                    break;
                default:
                    break;
            }
        }}>
            <Text style={{color: 'white', fontWeight: 'bold', fontSize: 18}}>Log In</Text>
        </TouchableOpacity>
      </View>
    )
  }

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 30,
        alignItems: 'center',
        padding: 20,
    },

    image: {
        width: '200',
        height: '200',
        justifyContent: 'center',
        padding: 30,
        marginBottom: 10,
    },

    title: {
        fontWeight: '800', 
        fontSize: 28,
        color: 'white',
        textAlign: 'center',
        padding: 10,
    },

    description: {
        fontWeight: '400',
        padding: 10,
        fontSize: 17,
        color: 'white',
        textAlign: 'center',
        marginHorizontal: 20,
        lineHeight: 25,
        marginBottom: 30,
    },

    signUpButton: {
        backgroundColor: 'white',
        width: '60%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 20,
    },

    logInButton: {
        backgroundColor: 'black',
        width: '60%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    }
})

export default SliderItem