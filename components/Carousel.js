import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import slides from './buttons/slides'
import SliderItem from './buttons/SliderItem';

const Carousel = ({ navigation }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const Pagination = ({ data }) => {
        return (
            <View style={styles.container}>
                {data.map((_, index) => {
                    return <View key={index.toString()} style={[
                        styles.dot,
                        (currentIndex === index) ? styles.selectedDot : {} 
                    ]}></View>;
                })}
            </View>
        )
    }

    const handleOnScroll = (e) => {
        const totalWidth = e.nativeEvent.layoutMeasurement.width;
        
    }

    return (
        <ScrollView style={{ flex: 1, width: '100%' }} >
            <FlatList
                data={slides}
                renderItem={({ item }) => <SliderItem navigation={navigation} item={item} />}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                snapToAlignment='center'
                onScroll={handleOnScroll}
            />
            <Pagination data={slides} />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0, 
        flexDirection: 'row',
        alignSelf: 'center',
    }, 

    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        margin: 6,
        backgroundColor: 'white'
    },

    selectedDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#82b9f5ff'
    }
})

export default Carousel;