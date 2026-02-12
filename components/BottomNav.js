import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

function BottomNav({ navigation, active, token }) {  
 
  const go = useCallback((route) => {
    navigation.navigate(route, { token });  
  }, [navigation, token]);  

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => go('Dashboard')}>
        <Ionicons name="grid" size={24} color={active === 'Dashboard' ? '#ff5722' : '#6b7280'} />
        <Text style={[styles.navLabel, active === 'Dashboard' && styles.activeLabel]}>HOME</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => go('LeaveHistory')}>
        <MaterialIcons name="event-note" size={24} color={active === 'LeaveHistory' ? '#ff5722' : '#6b7280'} />
        <Text style={[styles.navLabel, active === 'LeaveHistory' && styles.activeLabel]}>LEAVES</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => go('Notifications')}>
        <Ionicons name="notifications-outline" size={24} color={active === 'Notifications' ? '#ff5722' : '#6b7280'} />
        <Text style={[styles.navLabel, active === 'Notifications' && styles.activeLabel]}>ALERTS</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => go('Settings')}>
        <Ionicons name="settings-outline" size={24} color={active === 'Settings' ? '#ff5722' : '#6b7280'} />
        <Text style={[styles.navLabel, active === 'Settings' && styles.activeLabel]}>SETTINGS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#2d2d2d',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
    color: '#6b7280',
    fontWeight: '600',
  },
  activeLabel: {
    color: '#ff5722',
  },
});

export default BottomNav;