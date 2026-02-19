import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { API_BASE_URL } from '../constants/config';

export default function SelectDateScreen({ navigation, route }) {
    const leaveType = route?.params?.leaveType || {
        id: null,
        title: 'Annual Leave (AL)',
        color: '#10b981',
        balance: 12,
        min_notice_days: 0,
    };
    const token = route?.params?.token;

    console.log('=== SelectDate Screen ===');
    console.log('Token:', token ? 'Yes ✓' : 'No ✗');
    console.log('Leave Type:', leaveType.title);
    console.log('API Data (min_notice_days):', leaveType.min_notice_days);

    // States
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [markedDates, setMarkedDates] = useState({});
    const [totalDuration, setTotalDuration] = useState(0);
    const [calculating, setCalculating] = useState(false);
    const [actualAvailableBalance, setActualAvailableBalance] = useState(leaveType.balance); // NEW: Real available balance
    const [hasPendingLeaves, setHasPendingLeaves] = useState(false); // NEW: Track pending leaves
    const [pendingLeaveDetails, setPendingLeaveDetails] = useState(null); // NEW: Store pending leave info

    const getMinDateBasedOnNotice = () => {
        let daysToAdd = 0;

        if (leaveType.min_notice_days !== undefined && leaveType.min_notice_days !== null) {
            daysToAdd = leaveType.min_notice_days;
        } else {
            const title = (leaveType.title || '').toLowerCase();

            if (title.includes('annual')) {
                daysToAdd = 15;
            } else if (title.includes('hajj')) {
                daysToAdd = 30;
            } else if (title.includes('casual')) {
                daysToAdd = 1;
            } else if (title.includes('paternity')) {
                daysToAdd = 7;
            } else {
                daysToAdd = 0; // Default (Sick Leave etc.)
            }

            // console.log('⚠️ API Data Missing. Using Fallback Logic ->', daysToAdd, 'days');
        }

        const date = new Date();
        date.setDate(date.getDate() + daysToAdd);
        console.log('📅 Min Date Set to:', date.toISOString().split('T')[0]);
        return date.toISOString().split('T')[0];
    };

    // ✅ Check token
    useEffect(() => {
        if (!token) {
            Alert.alert('Session Expired', 'Please login again', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        }
    }, [token]);

    // ✅ Fetch actual available balance (considering APPROVED + PENDING leaves)
    useEffect(() => {
        const fetchActualBalance = async () => {
            if (!token || !leaveType.id) return;

            try {
                console.log('🔄 Fetching actual available balance...');
                const response = await fetch(`${API_BASE_URL}/employee/me/balances`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const balances = data.data.balances || [];
                    const currentLeaveBalance = balances.find(b => b.leave_type_id === leaveType.id);

                    if (currentLeaveBalance) {
                        // Backend already calculates: remaining = total_allowed - APPROVED leaves
                        // But we need to also subtract PENDING leaves
                        // So we fetch all leave requests and calculate
                        const requestsResponse = await fetch(`${API_BASE_URL}/employee/leave/requests`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        const requestsData = await requestsResponse.json();

                        if (requestsResponse.ok && requestsData.success) {
                            const allRequests = requestsData.data.requests || [];
                            
                            // Check for ANY pending leaves (across all leave types)
                            const pendingLeaves = allRequests.filter(req => req.status === 'PENDING');
                            
                            if (pendingLeaves.length > 0) {
                                setHasPendingLeaves(true);
                                // Get the first pending leave for display
                                const firstPending = pendingLeaves[0];
                                setPendingLeaveDetails({
                                    leaveType: firstPending.LeaveType?.name || 'Leave',
                                    startDate: new Date(firstPending.start_date).toDateString(),
                                    endDate: new Date(firstPending.end_date).toDateString(),
                                    totalPending: pendingLeaves.length
                                });
                            } else {
                                setHasPendingLeaves(false);
                                setPendingLeaveDetails(null);
                            }
                            
                            // Calculate APPROVED + PENDING for this leave type
                            const approvedAndPending = allRequests
                                .filter(req => req.leave_type_id === leaveType.id && (req.status === 'APPROVED' || req.status === 'PENDING'))
                                .reduce((sum, req) => sum + req.total_days, 0);

                            const actualAvailable = currentLeaveBalance.total_allowed - approvedAndPending;

                            console.log(`📊 Balance Calculation for ${leaveType.title}:`);
                            console.log(`   Total Allowed: ${currentLeaveBalance.total_allowed}`);
                            console.log(`   APPROVED + PENDING: ${approvedAndPending}`);
                            console.log(`   Actually Available: ${actualAvailable}`);
                            console.log(`   Has Pending Leaves: ${pendingLeaves.length > 0}`);

                            setActualAvailableBalance(actualAvailable);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching balance:', error);
                // Keep the original balance if fetch fails
                setActualAvailableBalance(leaveType.balance);
            }
        };

        fetchActualBalance();
    }, [token, leaveType.id]);

    useEffect(() => {
        if (startDate && endDate && leaveType.id && token) {
            calculateLeaveDays();
        } else {
            setTotalDuration(0);
        }
    }, [startDate, endDate, leaveType.id, token]);

    // ✅ API Call - Calculate Leave Days

  // ✅ API Call - Calculate Leave Days (FIXED)
  const calculateLeaveDays = async () => {
    setCalculating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employee/leave/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leave_type_id: leaveType.id,
          start_date: startDate,
          end_date: endDate
        })
      });

      const data = await response.json();

      if (startDate && endDate) {
        const dayCount = getDatesInRange(startDate, endDate).length;
        console.log('API Days:', data.data.total_days, ' -> Corrected Local Days:', dayCount);
        setTotalDuration(dayCount);
      } else {
        setTotalDuration(0);
      }

      if (!response.ok) {
         console.log('Warning: API failed, using local calculation');
      }

    } catch (error) {
      console.error(' Network Error:', error);
      if (startDate && endDate) {
        const dayCount = getDatesInRange(startDate, endDate).length;
        setTotalDuration(dayCount);
      }
    } finally {
      setCalculating(false);
    }
  };
    const formatDisplay = (isoDate) => {
        if (!isoDate) return 'Select';
        const d = new Date(isoDate + 'T00:00:00');
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDatesInRange = useCallback((startISO, endISO) => {
        const dates = [];
        const start = new Date(startISO + 'T00:00:00');
        const end = new Date(endISO + 'T00:00:00');
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${day}`);
        }
        return dates;
    }, []);

    const buildMarkedDates = useCallback((startISO, endISO) => {
        if (!startISO) return {};
        const markColor = '#ff5722';

        if (!endISO) {
            return {
                [startISO]: { selected: true, startingDay: true, endingDay: true, color: markColor, textColor: '#FFF' }
            };
        }

        const range = getDatesInRange(startISO, endISO);
        const marks = {};
        range.forEach((date, idx) => {
            if (idx === 0) {
                marks[date] = { startingDay: true, color: markColor, textColor: '#FFF' };
            } else if (idx === range.length - 1) {
                marks[date] = { endingDay: true, color: markColor, textColor: '#FFF' };
            } else {
                marks[date] = { color: markColor, textColor: '#FFF' };
            }
        });
        return marks;
    }, [getDatesInRange]);

    // computed values
    const remainingBalance = actualAvailableBalance - totalDuration;

    const handleContinue = async () => {
        // Block if there are pending leaves
        if (hasPendingLeaves) {
            Alert.alert(
                'Cannot Apply Leave',
                `You have ${pendingLeaveDetails.totalPending} pending leave request(s). Please wait for approval or cancel existing requests before applying for new leave.`,
                [{ text: 'OK' }]
            );
            return;
        }

        if (!startDate || !endDate) {
            Alert.alert('Required', 'Please select start and end dates');
            return;
        }

        if (totalDuration <= 0) {
            Alert.alert('Error', 'Invalid leave duration');
            return;
        }

        //  ADD THIS CHECK
        if (totalDuration > actualAvailableBalance) {
            Alert.alert('Insufficient Balance', `You have only ${actualAvailableBalance} days available (including pending leaves) but selected ${totalDuration} days.`);
            return;
        }

        navigation.navigate('LeaveDetail', {
            leaveType: leaveType,
            startDate: startDate,
            endDate: endDate,
            duration: totalDuration,
            token: token
        });
    };


    const handleSaveDraft = () => {
        Alert.alert('Draft Saved', 'Your leave request has been saved as draft');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation?.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Apply Leave</Text>

                <TouchableOpacity style={styles.infoButton}>
                    <Ionicons name="information-circle-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Progress Stepper */}
            <View style={styles.stepperContainer}>
                <View style={styles.stepWrapper}>
                    <View style={[styles.stepCircle, styles.stepCompleted]}>
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                    </View>
                    <Text style={[styles.stepLabel, styles.stepLabelActive]}>
                        TYPE
                    </Text>
                </View>

                <View style={[styles.stepLine, styles.stepLineActive]} />

                <View style={styles.stepWrapper}>
                    <View style={[styles.stepCircle, (startDate && endDate) && styles.stepActive]}>
                        <Text style={styles.stepNumber}>2</Text>
                    </View>
                    <Text style={[styles.stepLabel, (startDate && endDate) && styles.stepLabelActive]}>
                        DATES
                    </Text>
                </View>

                <View style={[styles.stepLine, (startDate && endDate) && styles.stepLineActive]} />

                <View style={styles.stepWrapper}>
                    <View style={[styles.stepCircle]}>
                        <Text style={styles.stepNumber}>3</Text>
                    </View>
                    <Text style={styles.stepLabel}>
                        REVIEW
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Leave Type Badge */}
                <View style={styles.leaveTypeBadge}>
                    <View style={[styles.badgeIconContainer, { backgroundColor: `${leaveType.color}20` }]}>
                        <Ionicons name="airplane" size={18} color={leaveType.color} />
                    </View>
                    <Text style={styles.badgeText}>{leaveType.title}</Text>
                </View>

                {/* Notice Card - Smart Text */}
                <View style={styles.noticeCard}>
                    <Ionicons name="information-circle" size={20} color="#ff9800" />
                    <Text style={styles.noticeText}>
                        Notice: This leave must be applied at least {
                            //  Agar API se value hai to wo dikhao, warna Fallback logic wala text
                            leaveType.min_notice_days !== undefined
                                ? leaveType.min_notice_days
                                : (
                                    (leaveType.title || '').includes('Annual') ? 15 :
                                        (leaveType.title || '').includes('Hajj') ? 30 :
                                            (leaveType.title || '').includes('Casual') ? 1 :
                                                (leaveType.title || '').includes('Paternity') ? 7 : 0
                                )
                        } days in advance
                    </Text>
                </View>

                {/* Date Selection Section */}
                <View style={styles.dateSection}>
                    <View style={styles.dateRow}>
                        <View style={styles.dateColumn}>
                            <Text style={styles.dateLabel}>START DATE</Text>
                            <TouchableOpacity style={styles.dateInput}>
                                <Text style={styles.dateText}>{formatDisplay(startDate)}</Text>
                                <Feather name="calendar" size={18} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateColumn}>
                            <Text style={styles.dateLabel}>END DATE</Text>
                            <TouchableOpacity style={styles.dateInput}>
                                <Text style={styles.dateText}>{formatDisplay(endDate)}</Text>
                                <Feather name="calendar" size={18} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Calendar */}
                <View style={styles.calendarContainer}>
                    <Text style={styles.calendarTitle}>
                        {startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Select Dates'}
                    </Text>

                    {/* Pending Leave Warning */}
                    {hasPendingLeaves && (
                        <View style={styles.pendingWarning}>
                            <Ionicons name="warning" size={20} color="#ff9500" />
                            <Text style={styles.pendingWarningText}>
                                You have {pendingLeaveDetails.totalPending} pending leave request(s). 
                                Cannot apply for new leave until existing requests are processed.
                            </Text>
                        </View>
                    )}

                    <Calendar
                        style={[styles.calendar, hasPendingLeaves && styles.calendarDisabled]}
                        theme={{
                            calendarBackground: hasPendingLeaves ? '#2a2a2a' : '#1a1a1a',
                            textSectionTitleColor: '#6b7280',
                            selectedDayBackgroundColor: '#ff5722',
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: '#ff5722',
                            dayTextColor: hasPendingLeaves ? '#666' : '#FFF',
                            textDisabledColor: '#2d2d2d',
                            monthTextColor: hasPendingLeaves ? '#666' : '#FFF',
                            arrowColor: hasPendingLeaves ? '#666' : '#FFF',
                            textDayFontWeight: '700',
                            textMonthFontWeight: '700',
                            textDayHeaderFontWeight: '600',
                        }}
                        current={startDate || new Date().toISOString().split('T')[0]}
                        markedDates={markedDates}
                        markingType={'period'}


                        minDate={getMinDateBasedOnNotice()}

                        hideExtraDays={true}
                        enableSwipeMonths={true}
                        onDayPress={async (day) => {
                            // Block all date selection if there are pending leaves
                            if (hasPendingLeaves) {
                                Alert.alert(
                                    'Cannot Apply Leave',
                                    `You have ${pendingLeaveDetails.totalPending} pending leave request(s). Please wait for approval or cancel existing requests before applying for new leave.\n\nPending: ${pendingLeaveDetails.leaveType} from ${pendingLeaveDetails.startDate} to ${pendingLeaveDetails.endDate}`,
                                    [{ text: 'OK' }]
                                );
                                return;
                            }

                            const selected = day.dateString;

                            if (!startDate || (startDate && endDate)) {
                                setStartDate(selected);
                                setEndDate(null);
                                setMarkedDates(buildMarkedDates(selected, null));
                                return;
                            }

                            if (startDate && !endDate) {
                                if (new Date(selected) < new Date(startDate)) {
                                    setStartDate(selected);
                                    setMarkedDates(buildMarkedDates(selected, null));
                                    return;
                                }

                                // ADD THIS CHECK BEFORE SETTING END DATE
                                const tempDuration = getDatesInRange(startDate, selected).length;

                                if (tempDuration > actualAvailableBalance) {
                                    Alert.alert(
                                        'Insufficient Balance',
                                        `You can only select ${actualAvailableBalance} days (including pending leaves). Selected range would be ${tempDuration} days.`,
                                        [{ text: 'OK' }]
                                    );
                                    return;
                                }

                                setEndDate(selected);
                                setMarkedDates(buildMarkedDates(startDate, selected));
                                return;
                            }
                        }}

                        renderArrow={(direction) => (
                            <Ionicons
                                name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                                size={20}
                                color="#FFF"
                            />
                        )}
                    />
                </View>

                {/* Duration and Balance Info */}
                <View style={styles.infoSection}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Total Duration</Text>
                        {calculating ? (
                            <ActivityIndicator size="small" color="#ff5722" />
                        ) : (
                            <Text style={styles.infoDuration}>{totalDuration} Days</Text>
                        )}
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Remaining Balance After</Text>
                        {calculating ? (
                            <ActivityIndicator size="small" color="#ff5722" />
                        ) : (
                            <Text style={styles.infoBalance}>
                                {actualAvailableBalance} - {totalDuration} =
                                <Text style={[
                                    remainingBalance >= 0 ? styles.infoBalanceGreen : styles.infoBalanceRed
                                ]}>
                                    {remainingBalance} Days
                                </Text>
                            </Text>

                        )}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.bottomButtons}>
                <TouchableOpacity
                    style={styles.draftButton}
                    onPress={handleSaveDraft}
                >
                    <Text style={styles.draftButtonText}>Save Draft</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        (!startDate || !endDate || calculating || totalDuration > actualAvailableBalance || hasPendingLeaves) && styles.continueButtonDisabled
                    ]}
                    onPress={handleContinue}
                    disabled={!startDate || !endDate || calculating || totalDuration > actualAvailableBalance || hasPendingLeaves}
                >
                    <Text style={styles.continueButtonText}>Continue to Review</Text>
                </TouchableOpacity>
            </View>
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
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#1a1a1a',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        flex: 1,
        textAlign: 'center',
    },
    infoButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 30,
        backgroundColor: '#0f0f0f',
    },
    stepWrapper: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2d2d2d',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    stepActive: {
        backgroundColor: '#ff5722',
    },
    stepCompleted: {
        backgroundColor: '#ff5722',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    stepLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#6b7280',
        letterSpacing: 0.5,
    },
    stepLabelActive: {
        color: '#ff5722',
    },
    stepLine: {
        width: 70,
        height: 2,
        backgroundColor: '#2d2d2d',
        marginHorizontal: 4,
        marginBottom: 0,
    },
    stepLineActive: {
        backgroundColor: '#ff5722',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    }, infoBalanceRed: {
        color: '#ef4444',
        fontWeight: 'bold',
    },

    leaveTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    badgeIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    noticeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#1a1a1a',
        padding: 14,
        marginTop: 12,
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#ff9800',
    },
    noticeText: {
        flex: 1,
        color: '#9ca3af',
        fontSize: 11,
        marginLeft: 10,
        lineHeight: 16,
    },
    dateSection: {
        marginTop: 20,
    },
    dateRow: {
        flexDirection: 'row',
        gap: 10,
    },
    dateColumn: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dateText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    calendarContainer: {
        marginTop: 20,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    calendarTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    calendar: {
        borderRadius: 8,
    },
    calendarDisabled: {
        opacity: 0.5,
    },
    pendingWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a1f0a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ff9500',
    },
    pendingWarningText: {
        color: '#ff9500',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },
    infoSection: {
        marginTop: 20,
    },
    infoCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    infoLabel: {
        fontSize: 11,
        color: '#6b7280',
        marginBottom: 6,
        fontWeight: '600',
    },
    infoDuration: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ff5722',
    },
    infoBalance: {
        fontSize: 15,
        color: '#9ca3af',
        fontWeight: '600',
    },
    infoBalanceGreen: {
        color: '#10b981',
        fontWeight: '700',
    },
    bottomButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 14,
        paddingBottom: 20,
        backgroundColor: '#0f0f0f',
        gap: 10,
    },
    draftButton: {
        flex: 0.8,
        paddingVertical: 15,
        borderRadius: 10,
        backgroundColor: '#2d2d2d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    draftButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
    continueButton: {
        flex: 1,
        borderRadius: 10,
        backgroundColor: '#ff5722',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff5722',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    continueButtonDisabled: {
        backgroundColor: '#2d2d2d',
        opacity: 0.5,
        shadowOpacity: 0,
    },
    continueButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
});