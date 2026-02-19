import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../constants/config';

export default function LeaveHistoryScreen({ navigation, route }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);

  // ✅ Stats State: Entitled, Taken, Balance
  const [stats, setStats] = useState({ entitled: 0, taken: 0, balance: 0 });

  const formatDateShort = (isoDate) => {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  //   1. Initialization
  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const paramsToken = route.params?.token;
        const finalToken = storedToken || paramsToken;

        if (!finalToken) {
          Alert.alert('Session Expired', 'Please login again', [
            { text: 'OK', onPress: () => navigation.replace('Login') }
          ]);
          return;
        }
        setToken(finalToken);

        await Promise.all([
          fetchLeaveBalances(finalToken),
          fetchLeaveHistory(finalToken)
        ]);

      } catch (error) {
        console.error('Error initializing screen:', error);
        setLoading(false);
      }
    };

    init();
  }, [route.params]);

  // Refresh data when screen comes into focus (e.g., after submitting leave)
  useFocusEffect(
    useCallback(() => {
      if (token && route.params?.refresh) {
        console.log('🔄 Refreshing leave history after submission...');
        handleRefresh();
      }
    }, [token, route.params?.refresh])
  );

  const fetchLeaveBalances = async (authToken) => {
    try {
      console.log('🔄 Fetching Leave Balances...');
      const response = await fetch(`${API_BASE_URL}/employee/me/balances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const balances = data.data.balances || [];

        console.log('📊 Leave Balances Data:', balances);

        // Calculate Totals
        let totalEntitled = 0;
        let totalUsed = 0;
        let totalRemaining = 0;

        balances.forEach(b => {
          console.log(`  ${b.LeaveType?.name}: Entitled=${b.total_allowed}, Used=${b.used}, Remaining=${b.remaining}`);
          totalEntitled += (b.total_allowed || 0);
          totalUsed += (b.used || 0);
          totalRemaining += (b.remaining || 0);
        });

        console.log('📈 Totals: Entitled=' + totalEntitled + ', Taken=' + totalUsed + ', Balance=' + totalRemaining);
        console.log('✅ Verification: ' + totalEntitled + ' - ' + totalUsed + ' = ' + (totalEntitled - totalUsed) + ' (should equal ' + totalRemaining + ')');

        setStats({
          entitled: totalEntitled,
          taken: totalUsed,
          balance: totalRemaining
});
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const fetchLeaveHistory = async (authToken) => {
    try {
      console.log('🔄 Fetching Leave History...');
      const response = await fetch(`${API_BASE_URL}/employee/leave/requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const rawApps = data.data.requests || [];

        const formattedApps = rawApps.map((item) => {
          let statusColor = '#f59e0b';
          if (item.status === 'APPROVED') statusColor = '#10b981';
          if (item.status === 'REJECTED') statusColor = '#ef4444';

          let displayComment = 'Waiting for HR department review.';
          if (item.status === 'REJECTED') {
            displayComment = item.rejection_reason || 'Request rejected by management.';
          } else if (item.status === 'APPROVED') {
            displayComment = 'Request approved. Enjoy your leave!';
          }

          return {
            id: item.id,
            type: item.LeaveType?.name || item.leave_type_name || 'Leave',
            dates: `${formatDateShort(item.start_date)} - ${formatDateShort(item.end_date)} (${item.total_days} Days)`,
            status: item.status,
            comment: displayComment,
            statusColor: statusColor
          };
        });

        setApplications(formattedApps);
      } else {
        // Alert.alert('Error', 'Failed to load history');  
      }
    } catch (error) {
      console.error('Network Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (token) {
      setLoading(true);
      await Promise.all([fetchLeaveBalances(token), fetchLeaveHistory(token)]);
    }
  }, [token]);

  const handleApplyLeave = useCallback(() => {
    navigation.navigate('ApplyLeave', { token });
  }, [navigation, token]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ff5722" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ marginRight: 15 }} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Leave History</Text>
          </View>
        </View>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={handleRefresh}>
            <Feather name="refresh-cw" size={24} color="#ff5722" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/*   3 Stats Cards (Entitled, Taken, Balance) */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ENTITLED</Text>
            <Text style={styles.statValue}>{stats.entitled}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TAKEN</Text>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.taken}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>BALANCE</Text>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.balance}</Text>
          </View>
        </View>

        {/* Recent Applications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT APPLICATIONS</Text>

          {applications.length > 0 ? (
            applications.map((app) => (
              <View key={app.id} style={styles.applicationCard}>
                <View style={styles.applicationHeader}>
                  <Text style={styles.applicationType}>{app.type}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: app.statusColor },
                    ]}
                  >
                    <Text style={styles.statusText}>{app.status}</Text>
                  </View>
                </View>

                <Text style={styles.applicationDates}>{app.dates}</Text>

                <View style={styles.commentBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color="#71717a"
                    style={styles.commentIcon}
                  />
                  <Text style={styles.commentText}>{app.comment}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#666' }}>No leave history found.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleApplyLeave}
      >
        <Feather name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <BottomNav navigation={navigation} active="LeaveHistory" />
    </SafeAreaView>
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
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },

  profileContainer: {
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 16,
  },
  applicationCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  applicationType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  applicationDates: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  commentBox: {
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  commentIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  commentText: {
    flex: 1,
    fontSize: 12,
    color: '#d4d4d8',
    lineHeight: 18,
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