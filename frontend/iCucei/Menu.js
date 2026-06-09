import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PRINCIPAL from "./Principal";
import DIRECTORIO from "./Directorio";
import VIDEO from "./Video";
import MAPA from "./Mapa";
import INTROAPP from "./IntroApp";
import LOGINN from "./Loginn";
import STUDENT from "./Student";


export default class Menu extends Component {
  render() {
    const Stack = createNativeStackNavigator();

    return (
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="IntroApp"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="IntroApp" component={INTROAPP} />
          <Stack.Screen name="Inicio" component={PRINCIPAL} />
          <Stack.Screen name="Directorio" component={DIRECTORIO} />
          <Stack.Screen name="Video" component={VIDEO} />
          <Stack.Screen name="Mapa" component={MAPA} />
          <Stack.Screen name="Loginn" component={LOGINN} />
          <Stack.Screen name="Student" component={STUDENT} />
        

        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}
