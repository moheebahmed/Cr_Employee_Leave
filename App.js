import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/Dashboardscreen';
import LeaveHistoryScreen from './screens/Leavehistoryscreen';
import Notificationscreen from './screens/Notificationscreen';
import ApplyLeaveScreen from './screens/Applyleavescreen';
import SelectDateScreen from './screens/SelectDateScreen';
import LeaveDetailScreen from './screens/LeaveDetailScreen';
import SettingsScreen from './screens/Settingsscreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Dashboard Stack
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="ApplyLeave" component={ApplyLeaveScreen} />
      <Stack.Screen name="SelectDate" component={SelectDateScreen} />
      <Stack.Screen name="LeaveDetail" component={LeaveDetailScreen} />
    </Stack.Navigator>
  );
}

// LeaveHistory Stack
function LeaveHistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LeaveHistoryMain" component={LeaveHistoryScreen} />
      <Stack.Screen name="ApplyLeave" component={ApplyLeaveScreen} />
      <Stack.Screen name="SelectDate" component={SelectDateScreen} />
      <Stack.Screen name="LeaveDetail" component={LeaveDetailScreen} />
    </Stack.Navigator>
  );
}

// Notifications Stack
function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationsMain" component={Notificationscreen} />
    </Stack.Navigator>
  );
}

// Settings Stack
function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#ff5722',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { display: 'none' },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = 'grid';
          } else if (route.name === 'LeaveHistory') {
            iconName = 'event-note';
          } else if (route.name === 'Notifications') {
            iconName = 'notifications';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }
          return route.name === 'LeaveHistory' ?
            <MaterialIcons name={iconName} size={24} color={color} /> :
            <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ tabBarLabel: 'HOME' }}
      />
      <Tab.Screen
        name="LeaveHistory"
        component={LeaveHistoryStack}
        options={{ tabBarLabel: 'LEAVES' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{ tabBarLabel: 'ALERTS' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{ tabBarLabel: 'PROFILE' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}