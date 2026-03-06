import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/presentation/context/AuthContext';
import * as Notifications from 'expo-notifications';

export const navigationRef = createNavigationContainerRef();

const App = () => {
  useEffect(() => {
    // Listener: usuário tocou na notificação
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const eventoId = response.notification.request.content.data?.evento_id;
      if (eventoId && navigationRef.isReady()) {
        (navigationRef.navigate as any)('Main');
        setTimeout(() => {
          (navigationRef.navigate as any)('Agenda', { eventoId });
        }, 100);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;