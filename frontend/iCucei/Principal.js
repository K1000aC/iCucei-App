import React, { Component } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, FlatList, Alert } from 'react-native';

const BUTTONS = [
  {
    key: 'Directorio',
    title: 'Directorio',
    image: require('./Imagenes/Icons/DirectoryIcon.png'),
    route: 'Directorio',
  },
  {
    key: 'Video',
    title: 'Video',
    image: require('./Imagenes/Icons/VideoIconn.png'),
    route: 'Video',
  },
  {
    key: 'Mapa',
    title: 'Mapa',
    image: require('./Imagenes/Icons/MapIcon.png'),
    route: 'Mapa',
  },
  {
    key: 'Login',
    title: 'Log In',
    image: require('./Imagenes/Icons/StudentIcon.png'),
    route: 'Loginn',
  },
];

export default class Principal extends Component {
  handlePress = (item) => {
    if (item.route) {
      this.props.navigation.navigate(item.route);
    } else {
      Alert.alert('Próximamente', `Sección "${item.title}" en construcción.`);
    }
  };

  renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => this.handlePress(item)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.85}
    >
      <View style={styles.buttonContainer}>
        {/* Contenedor de la imagen */}
        <View style={styles.buttonImageContainer}>
          <Image
            source={item.image}
            style={styles.buttonImage}
            resizeMode="contain"
          />
        </View>

        {/* Contenedor del texto */}
        <View style={styles.buttonTextContainer}>
          <Text style={styles.buttonText} allowFontScaling={false}>
            {item.title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  keyExtractor = (item) => item.key;

  render() {
    return (
      <ImageBackground
        source={require('./Imagenes/Backgrounds/PrincipalBackgApp.jpg')}
        style={styles.backgroundImage}
      >
        <View style={styles.overlay} />
        <SafeAreaView style={styles.safe}>
          <Text style={styles.headerText} allowFontScaling={false}>
            Campus CUCEI
          </Text>

          <FlatList
            data={BUTTONS}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.imageContainer}>
            <Image
              source={require('./Imagenes/Backgrounds/WatermarkCucei.png')}
              style={styles.WatermarkImage}
            />
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }
}


const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%'
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  safe: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 16,

  },

  headerText: {
    fontSize: 70,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
    fontFamily: 'MyFontRobotoSlab',

  },

  listContent: {
    paddingBottom: 0.01,
    //borderColor: 'red',
    //borderWidth: 2,
  },

  row: {
    justifyContent: 'space-between',
    marginBottom: 40,
    marginLeft: 20,
    marginRight: 20,

  },

  card: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.20)',

  },

  buttonContainer: {
    flex: 1,
  },

  buttonImageContainer: {
    flex: 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '7',
  },

  buttonImage: {
    width: '65%',
    height: '100%',
    borderRadius: 1,

  },

  buttonTextContainer: {
    flex: 0.22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  buttonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'MyFontArialR',


  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -50 }],
  },

  WatermarkImage: {
    width: 300,
    height: 150,
    resizeMode: 'contain',
  },

});
