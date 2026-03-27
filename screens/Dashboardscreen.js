import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/config';
import BottomNav from '../components/BottomNav';
export default function DashboardScreen({ navigation, route }) {
  // 1. State management
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const initialUser = route.params?.user || route.params?.params?.user;

  // 2. Initialize token from AsyncStorage or route params
  useEffect(() => {
    const initToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const paramsToken = route.params?.token || route.params?.params?.token;
        const finalToken = storedToken || paramsToken;

        if (!finalToken) {
          Alert.alert('Error', 'Session expired. Please login again.', [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]);
          setLoading(false);
          return;
        }

        setToken(finalToken);
      } catch (error) {
        console.error('Error retrieving token:', error);
        setLoading(false);
      }
    };

    initToken();
  }, [route.params]);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [dashRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/employee/dashboard`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/employee/leave/requests`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        })
      ]);

      const data = await dashRes.json();
      const requestsData = await requestsRes.json();

      if (dashRes.ok) {
        console.log('📊 Dashboard balances raw:', JSON.stringify(data.data?.balances, null, 2));
        const requests = (requestsData.success && requestsData.data.requests) || [];

        // Fix used count: sum total_days from APPROVED requests per leave type
        const usedByType = {};
        requests
          .filter(r => r.status === 'APPROVED')
          .forEach(r => {
            const id = r.leave_type_id;
            usedByType[id] = (usedByType[id] || 0) + (r.total_days || 0);
          });

        // Use backend remaining directly, only patch used from APPROVED requests
        const patchedBalances = (data.data?.balances || []).map(b => ({
          ...b,
          used: usedByType[b.leave_type_id] || 0,
        }));

        setDashboardData({ ...data.data, balances: patchedBalances });
      } else {
        console.log('Dashboard fetch failed:', JSON.stringify(data, null, 2));
        Alert.alert('Error', data.message || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('Network Error:', error);
      Alert.alert('Error', 'Network connection failed');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 3. Fetch Data when token is available
  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, fetchDashboardData]);

  // 4. Auto-refresh when screen comes into focus (e.g. after applying leave)
  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchDashboardData();
      }
    }, [token, fetchDashboardData])
  );
  // Optimized navigation handler
  const handleApplyLeave = useCallback(() => {
    navigation.navigate('ApplyLeave', { token: token });
  }, [navigation, token]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#ff5722" />
      </View>
    );
  }

  const profile = dashboardData?.profile || {};
  const user = profile?.User || initialUser || {};
  const balances = dashboardData?.balances || [];
  const upcomingHolidays = dashboardData?.upcoming_holidays || [];
  const hasAnyBalance = balances.some(b => (b.remaining || 0) > 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back, {user?.email?.split('@')[0] || 'Employee'}</Text>
        </View>
        <View style={styles.profileContainer}>
          <Image
            source={require('../assets/pix.png')}
            style={styles.profileImage}
          />
          <View style={styles.onlineDot} />
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userCardHeader}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="work" size={24} color="#ff5722" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.email || 'N/A'}</Text>
              <Text style={styles.userDesignation}>{profile?.designation || 'Employee'}</Text>
            </View>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>DESIGNATION</Text>
              <Text style={styles.detailValue}>{profile?.designation || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>JOINING DATE</Text>
              <Text style={styles.detailValue}>
                {profile?.joining_date ? new Date(profile.joining_date).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.userDetails}>
            {/* You can add more fields here if your API returns them */}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>CONFIRMATION</Text>
              <Text style={styles.detailValue}>
                {profile?.confirmation_date ? new Date(profile.confirmation_date).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>EMPLOYEE ID</Text>
              <Text style={styles.detailValue}>{profile?.employee_code || 'N/A'}</Text>
            </View>
          </View>
        </View>
        {/* Leave Overview Card */}
        <View style={styles.leaveCard}>
          <View style={styles.leaveCardHeader}>
            <View style={styles.leaveHeaderLeft}>
              <MaterialIcons name="event-note" size={20} color="#ff5722" />
              <Text style={styles.leaveTitle}>Leave Overview</Text>
            </View>
            <TouchableOpacity onPress={fetchDashboardData}>
              {/* Added Retry/Refresh logic */}
              <Text style={styles.viewDetails}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.leaveTableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>TYPE</Text>
            <Text style={styles.tableHeaderText}>TOTAL</Text>
            <Text style={styles.tableHeaderText}>USED</Text>
            <Text style={styles.tableHeaderText}>REM.</Text>
          </View>
          {/* Dynamic balances - Show ALL leave types */}
          {balances.length > 0 ? (
            balances.map((balance, index) => (
              <View
                key={balance.id || index}
                style={[
                  styles.leaveRow,
                  index === balances.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <Text style={[styles.leaveType, { flex: 2 }]}>
                  {balance.LeaveType?.name || 'Leave'}
                </Text>
                <Text style={styles.leaveTotal}>{balance.total_allowed || 0}</Text>
                <Text style={styles.leaveUsed}>{balance.used || 0}</Text>
                <Text style={styles.leaveRemaining}>{balance.remaining || 0}</Text>
              </View>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#666', fontSize: 14 }}>No leave types available</Text>
            </View>
          )}
        </View>
        {/* Upcoming Holidays */}
        <View style={styles.holidaysSection}>
          <Text style={styles.sectionTitle}>Upcoming Holidays</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.holidaysScroll}
          >
            {upcomingHolidays.length > 0 ? (
              upcomingHolidays.map((holiday, index) => (
                <View key={index} style={styles.holidayCard}>
                  <Text style={styles.holidayDate}>
                    {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.holidayName} numberOfLines={1}>{holiday.name}</Text>
                  <Text style={styles.holidayDay}>
                    {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: '#666', fontStyle: 'italic' }}>No upcoming holidays</Text>
            )}
          </ScrollView>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      {/* Floating Action Button */}
      {hasAnyBalance && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('ApplyLeave', { token: token })}
        >
          <Feather name="plus" size={28} color="#FFF" />
        </TouchableOpacity>
      )}
      {/* Bottom Navigation */}

      <BottomNav navigation={navigation} active="Dashboard" token={token} />
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
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#ff5722',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    marginBottom: 16,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2d2d2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  userDesignation: {
    fontSize: 13,
    color: '#9ca3af',
  },
  userDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  leaveCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  leaveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leaveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
  viewDetails: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff5722',
  },
  leaveTableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
    marginBottom: 12,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  leaveRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
    alignItems: 'center',
  },
  leaveType: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
  },
  leaveTotal: {
    fontSize: 15,
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  leaveUsed: {
    fontSize: 15,
    color: '#ff5722',
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  leaveRemaining: {
    fontSize: 15,
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  holidaysSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  holidaysScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  holidayCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  holidayDate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ff5722',
    marginBottom: 10,
  },
  holidayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 6,
  },
  holidayDay: {
    fontSize: 12,
    color: '#9ca3af',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff5722',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
