import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle:        { backgroundColor: '#0A0F1E' },
        headerTintColor:    '#FFD700',
        headerTitleStyle:   { fontWeight: '800' },
        tabBarStyle: {
          backgroundColor:    '#0A0F1E',
          borderTopColor:     '#1A2540',
          borderTopWidth:     1,
          height:             Platform.OS === 'android' ? 90 : 80,
          paddingBottom:      Platform.OS === 'android' ? 34 : 20,
          paddingTop:         8,
        },
        tabBarActiveTintColor:   '#FFD700',
        tabBarInactiveTintColor: '#3A4A6B',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: () => (
            <Text style={{ fontSize: 22 }}>⚡</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: () => (
            <Text style={{ fontSize: 22 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: () => (
            <Text style={{ fontSize: 22 }}>🔔</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          href:        null,
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}