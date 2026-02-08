// ============================================================================
// AppNavigator - React Navigation configuration
// ============================================================================

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { PetListScreen } from '../screens/PetListScreen';
import { AddEditPetScreen } from '../screens/AddEditPetScreen';
import { PetDetailScreen } from '../screens/PetDetailScreen';
import { RootStackParamList } from '../types/pet';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="PetList"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#F9FAFB' },
        }}
      >
        <Stack.Screen name="PetList" component={PetListScreen} />
        <Stack.Screen name="AddEditPet" component={AddEditPetScreen} />
        <Stack.Screen name="PetDetail" component={PetDetailScreen} />
        <Stack.Screen 
          name="Scan" 
          component={() => null} // Placeholder - will connect to existing PhotoCaptureScreen
          options={{
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
