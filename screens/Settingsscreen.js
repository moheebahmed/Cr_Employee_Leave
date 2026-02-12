import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../constants/config';

export default function SettingsScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
          navigation.replace('Login');
          return;
        }

        console.log('🔄 Fetching Profile...');

        const response = await fetch(`${API_BASE_URL}/employee/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        console.log('📦 API Response:', data);

        if (response.ok) {
          let profileData = data.data?.profile || data.data || data.user || data.profile || data;

          console.log(' Final Profile Object:', profileData);
          setProfile(profileData);
        } else {
          Alert.alert('Error', data.message || 'Failed to load profile');
        }
      } catch (error) {
        console.error(' Profile Error:', error);
        Alert.alert('Error', 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ff5722" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account settings</Text>
        </View>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={() => Alert.alert('Info', 'Edit Profile coming soon!')}>
            <Ionicons name="create-outline" size={24} color="#ff5722" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={require('../assets/pix.png')}
            style={styles.profileImage}
          />
           <Text style={styles.profileName}>
            {profile?.full_name || profile?.name || profile?.User?.name || 'Unknown User'}
          </Text>

          <Text style={styles.employeeId}>
            Employee ID: {profile?.employee_code || 'N/A'}
          </Text>
          <Text style={styles.company}>ConceptRecall</Text>
        </View>

        {/* Employee Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Employee Information</Text>

          {/* Row 1 */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Department</Text>
              <Text style={styles.value}>{profile?.department || 'N/A'}</Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Designation</Text>
              <Text style={styles.value}>{profile?.designation || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.line} />

          {/* Row 2 */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Joining Date</Text>
              <Text style={styles.value}>{formatDate(profile?.joining_date)}</Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Confirmation Date</Text>
              <Text style={styles.value}>{formatDate(profile?.confirmation_date)}</Text>
            </View>
          </View>
        </View>

        {/* Account Details */}
        {/* <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <View style={styles.row}>
                <View style={[styles.col, { flex: 1 }]}>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>{profile?.User?.email || profile?.email || 'N/A'}</Text>
                </View>
            </View>
        </View> */}

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNav navigation={navigation} active="Settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#1a1a1a',
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },

  profileContainer: {
    position: 'relative',
  },

  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#ff5722',
    marginBottom: 16,
  },

  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },

  employeeId: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },

  company: {
    fontSize: 14,
    color: '#9ca3af',
  },

  infoSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },

  col: {
    width: '50%',
  },

  label: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 6,
  },

  value: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },

  line: {
    height: 1,
    backgroundColor: '#2d2d2d',
  },

  logoutBtn: {
    backgroundColor: '#ff5722',
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#ff5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
