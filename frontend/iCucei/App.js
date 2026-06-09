import React, { useState, useEffect } from 'react';
import { View, StatusBar, Image, StyleSheet } from 'react-native';
import * as Font from 'expo-font';
import MENU from './Menu';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        MyFontArialR: require('./Fonts/ArialR.ttf'),
        MyFontRobotoSlab: require('./Fonts/RobotoSlab.ttf'),
        MyFontSourceSansPro: require('./Fonts/SourceSansPro.ttf'),
      });
      setFontsLoaded(true);
    })();
  }, []);


  if (!fontsLoaded) {
    return (
      <View style={styles.splashWrap}>
        <Image
          source={require('./assets/icon.png')}
          style={styles.splashImg}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <MENU />
    </View>
  );
}

const styles = StyleSheet.create({
  splashWrap: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImg: {
    width: 220,  
    height: 220,
  },
});
