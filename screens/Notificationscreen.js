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
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../constants/config';

export default function NotificationsScreen({ navigation, route }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  //    Initialize
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
        await fetchNotifications(finalToken);
      } catch (error) {
        console.error('Init Error:', error);
        setLoading(false);
      }
    };

    init();
  }, [route.params]);

  //   Fetch Notifications from API
  const fetchNotifications = async (authToken) => {
    try {
      console.log('🔄 Fetching Notifications...');

      const response = await fetch(`${API_BASE_URL}/employee/notifications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const rawNotifications = data.data.notifications || [];

        // Format notifications by date
        const formatted = formatNotificationsByDate(rawNotifications);
        setNotifications(formatted);
      } else {
        Alert.alert('Error', data.message || 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Network Error:', error);
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatNotificationsByDate = (rawNotifs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sections = {};

    rawNotifs.forEach((notif) => {
      const notifDate = new Date(notif.created_at);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      let sectionKey = 'OLDER';
      if (notifDay.getTime() === today.getTime()) {
        sectionKey = 'TODAY';
      } else if (notifDay.getTime() === yesterday.getTime()) {
        sectionKey = 'YESTERDAY';
      }

      if (!sections[sectionKey]) {
        sections[sectionKey] = [];
      }

      let icon = 'information-circle';
      let iconColor = '#3b82f6';
      let borderColor = '#3b82f6';

      if (notif.title.includes('Approved')) {
        icon = 'checkmark-circle';
        iconColor = '#10b981';
        borderColor = '#10b981';
      } else if (notif.title.includes('Rejected')) {
        icon = 'close-circle';
        iconColor = '#ef4444';
        borderColor = '#ef4444';
      } else if (notif.title.includes('Pending')) {
        icon = 'document-text';
        iconColor = '#f59e0b';
        borderColor = '#f59e0b';
      }

      // Calculate time ago
      const diffMs = now - notifDate;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let timeAgo = '';
      if (diffDays > 0) {
        timeAgo = `${diffDays}d ago`;
      } else if (diffHours > 0) {
        timeAgo = `${diffHours}h ago`;
      } else {
        timeAgo = 'Just now';
      }

      sections[sectionKey].push({
        id: notif.id,
        title: notif.title,
        description: notif.message,
        time: timeAgo,
        icon: icon,
        iconColor: iconColor,
        borderColor: borderColor,
        is_read: notif.is_read
      });
    });

    // Convert to array format
    const result = [];
    if (sections.TODAY && sections.TODAY.length > 0) {
      result.push({ section: 'TODAY', items: sections.TODAY });
    }
    if (sections.YESTERDAY && sections.YESTERDAY.length > 0) {
      result.push({ section: 'YESTERDAY', items: sections.YESTERDAY });
    }
    if (sections.OLDER && sections.OLDER.length > 0) {
      result.push({ section: 'OLDER', items: sections.OLDER });
    }

    return result;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (token) {
      await fetchNotifications(token);
    }
  }, [token]);

  const handleMarkAllRead = async () => {
    Alert.alert('Info', 'Mark all read feature coming soon!');
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ff5722" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ marginRight: 15 }} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {/* <Text style={styles.headerSubtitle}>Stay updated with alerts</Text> */}
          </View>
        </View>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff5722" />
        }
      >
        {notifications.length > 0 ? (
          notifications.map((section, idx) => (
            <View key={idx} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.section}</Text>

              {section.items.map((notif) => (
                <View
                  key={notif.id}
                  style={[
                    styles.notificationCard,
                    { borderLeftColor: notif.borderColor },
                    !notif.is_read && styles.unreadCard
                  ]}
                >
                  <View style={styles.notificationContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: notif.iconColor },
                      ]}
                    >
                      <Ionicons name={notif.icon} size={24} color="#ffffff" />
                    </View>

                    <View style={styles.notificationText}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>
                          {notif.title}
                        </Text>
                        <Text style={styles.notificationTime}>{notif.time}</Text>
                      </View>

                      <Text style={styles.notificationDescription}>
                        {notif.description}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
        ) : (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="notifications-off-outline" size={60} color="#666" />
            <Text style={{ color: '#666', marginTop: 16, fontSize: 16 }}>
              No notifications yet
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav navigation={navigation} active="Notifications" token={token} />
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
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  // headerSubtitle: {
  //   fontSize: 14,
  //   color: '#9ca3af',
  // },
  profileContainer: {
    position: 'relative',
  },
  markAllRead: {
    fontSize: 14,
    color: '#ff5722',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 16,
  },
  notificationCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  notificationContent: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 8,
  },
  detailBox: {
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  detailText: {
    fontSize: 12,
    color: '#d4d4d8',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f59e0b',
  },
  notificationBadgeContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
});