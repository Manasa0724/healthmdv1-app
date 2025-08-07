import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native';
import slides from './buttons/slides'
import SliderItem from './buttons/SliderItem';

const Carousel = ({ navigation }) => {
    return (
        <View>
            <FlatList 
            data={slides}   
            renderItem={({ item }) => <SliderItem navigation={navigation} item={item} />}
            horizontal
            showsHorizontalScrollIndicator
            pagingEnabled
            />
        </View>
    )
}

export default Carousel