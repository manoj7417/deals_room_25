import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'rgba(99, 102, 241, 1.00)', // Indigo color for active tabs
        tabBarInactiveTintColor: 'rgba(99, 102, 241, 0.3)', // Light indigo for inactive tabs
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            height: 80,
            paddingBottom: 20,
            paddingTop: 10,
          },
          default: {
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          color: 'rgba(99, 102, 241, 0.8)', // Ensure text visibility
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        headerTintColor: 'rgba(99, 102, 241, 1.00)', // Indigo color for header text
        headerStyle: {
          backgroundColor: '#ffffff', // White background
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 28 : 25} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deals-room"
        options={{
          title: 'Deals Room',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 28 : 25} name="suitcase.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 28 : 25} name="line.3.horizontal" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
