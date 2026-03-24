import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
} from 'react-native';
import { Feather, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/config';

export default function ApplyLeaveScreen({ navigation, route }) {
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = route?.params?.token;

    console.log('=== ApplyLeave Screen ===');
    console.log('Token received:', token ? 'Yes ✓' : 'No ✗');

    useEffect(() => {
        if (!token) {
            Alert.alert('Session Expired', 'Please login again', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
            setLoading(false);
            return;
        }

        fetchLeaveTypes();
    }, [token]);

    //   API Call
    const fetchLeaveTypes = async () => {
        try {
            console.log('🔄 Calling API...');
            console.log('URL:', `${API_BASE_URL}/employee/me/balances`);

            const response = await fetch(`${API_BASE_URL}/employee/me/balances`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 Response Status:', response.status);
            const data = await response.json();
            console.log('Response Data:', JSON.stringify(data, null, 2));

            if (response.ok && data.success) {
                const balances = data.data.balances || [];

                if (balances.length === 0) {
                    Alert.alert('Info', 'No leave types available');
                    setLeaveTypes([]);
                    return;
                }

                const formatted = balances.map((item) => {
                    const lt = item.LeaveType;
                    const code = lt.code;

                    return {
                        id: lt.id,
                        title: lt.name,
                        description: getDescription(code),
                        available: String(Math.floor(item.remaining)).padStart(2, '0'),
                        color: getColor(code),
                        icon: getIcon(code),
                        iconLibrary: getIconLibrary(code),
                        balance: item.remaining,
                        disabled: item.remaining <= 0,
                        leaveTypeCode: code,
                        min_notice_days: lt.min_notice_days ?? 0,
                    };
                });

                console.log(' Formatted Data:', formatted);
                setLeaveTypes(formatted);

            } else {
                // console.log('API Error:', data.message);
                Alert.alert('Error', data.message || 'Failed to load leave types');
            }

        } catch (error) {
            // console.error('Network Error:', error);
            Alert.alert('Network Error', 'Could not connect to server.');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Helper functions
    const getDescription = (code) => {
        const map = {
            'CL': 'For short term personal needs',
            'SL': 'For medical & health emergencies',
            'AL': 'Plan your holidays and vacations',
            'HAJJ': 'NO BALANCE AVAILABLE',
            'PL': 'For eligible employees',  // Changed
        };
        return map[code] || 'Leave type';
    };

    const getColor = (code) => {
        const map = {
            'CL': '#ff5722',
            'SL': '#3b82f6',
            'AL': '#10b981',
            'HAJJ': '#6b7280',
            'PL': '#8b5cf6',
        };
        return map[code] || '#6b7280';
    };

    const getIcon = (code) => {
        const map = {
            'CL': 'calendar',
            'SL': 'medical-services',
            'AL': 'airplane',
            'HAJJ': 'kaaba',
            'PL': 'star',
        };
        return map[code] || 'calendar';
    };

    const getIconLibrary = (code) => {
        const map = {
            'CL': 'Feather',
            'SL': 'MaterialIcons',
            'AL': 'Ionicons',
            'HAJJ': 'FontAwesome5',
            'PL': 'Feather',
        };
        return map[code] || 'Feather';
    };

    const handleNext = () => {
        if (selectedLeave) {
            console.log('✓ Selected leave:', selectedLeave.title);
            navigation.navigate('SelectDate', {
                leaveType: selectedLeave,
                token: token
            });
        }
    };

    const renderIcon = (item) => {
        const props = { size: 22, color: item.color };

        switch (item.iconLibrary) {
            case 'Feather':
                return <Feather name={item.icon} {...props} />;
            case 'MaterialIcons':
                return <MaterialIcons name={item.icon} {...props} />;
            case 'Ionicons':
                return <Ionicons name={item.icon} {...props} />;
            case 'FontAwesome5':
                return <FontAwesome5 name={item.icon} size={18} color={item.color} />;
            default:
                return <Feather name="calendar" {...props} />;
        }
    };

    // Loading screen
    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#ff5722" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading leave types...</Text>
            </View>
        );
    }

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
                    <View style={[styles.stepCircle, selectedLeave && styles.stepActive]}>
                        <Text style={styles.stepNumber}>1</Text>
                    </View>
                    <Text style={[styles.stepLabel, selectedLeave && styles.stepLabelActive]}>
                        TYPE
                    </Text>
                </View>

                <View style={[styles.stepLine, selectedLeave && styles.stepLineActive]} />

                <View style={styles.stepWrapper}>
                    <View style={[styles.stepCircle]}>
                        <Text style={styles.stepNumber}>2</Text>
                    </View>
                    <Text style={styles.stepLabel}>
                        DATE
                    </Text>
                </View>

                <View style={[styles.stepLine]} />

                <View style={styles.stepWrapper}>
                    <View style={[styles.stepCircle]}>
                        <Text style={styles.stepNumber}>3</Text>
                    </View>
                    <Text style={styles.stepLabel}>
                        DETAILS
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Select Leave Type</Text>
                    <Text style={styles.subtitle}>
                        Choose the type of leave you wish to apply for today.
                    </Text>
                </View>

                {/* Leave Cards */}
                <View style={styles.leaveTypesContainer}>
                    {leaveTypes.length > 0 ? (
                        leaveTypes.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.leaveCard,
                                    selectedLeave?.id === item.id && styles.leaveCardSelected,
                                    selectedLeave?.id === item.id && { borderColor: item.color },
                                    item.disabled && styles.leaveCardDisabled,
                                ]}
                                onPress={() => !item.disabled && setSelectedLeave(item)}
                                disabled={item.disabled}
                            >
                                <View style={styles.leaveCardContent}>
                                    <View style={[styles.iconCircle, { backgroundColor: `${item.color}20` }]}>
                                        {renderIcon(item)}
                                    </View>

                                    <View style={styles.leaveInfo}>
                                        <Text style={[
                                            styles.leaveTitle,
                                            item.disabled && styles.leaveDisabled
                                        ]}>
                                            {item.title}
                                        </Text>
                                        <Text style={[
                                            styles.leaveDescription,
                                            item.disabled && styles.leaveDescriptionDisabled
                                        ]}>
                                            {item.description}
                                        </Text>
                                    </View>

                                    <View style={styles.availableContainer}>
                                        {selectedLeave?.id === item.id && (
                                            <View style={[styles.checkmarkBadge, { backgroundColor: item.color }]}>
                                                <Ionicons name="checkmark" size={12} color="#FFF" />
                                            </View>
                                        )}
                                        <Text style={[styles.availableNumber, { color: item.color }]}>
                                            {item.available}
                                        </Text>
                                        <Text style={styles.availableLabel}>AVAILABLE</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#666', fontSize: 16 }}>
                                No leave types available
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.bottomButtons}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation?.goBack()}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        !selectedLeave && styles.nextButtonDisabled
                    ]}
                    onPress={handleNext}
                    disabled={!selectedLeave}
                >
                    <Text style={styles.nextButtonText}>Next Step</Text>
                    <Feather name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
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
    },
    titleSection: {
        marginTop: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: '#9ca3af',
        lineHeight: 18,
    },
    leaveTypesContainer: {
        gap: 10,
    },
    leaveCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    leaveCardSelected: {
        borderWidth: 1.5,
        backgroundColor: '#1a1a1a',
    },
    leaveCardDisabled: {
        opacity: 0.6,
    },
    leaveCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    leaveInfo: {
        flex: 1,
    },
    leaveTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 3,
    },
    leaveDisabled: {
        color: '#6b7280',
    },
    leaveDescription: {
        fontSize: 11,
        color: '#9ca3af',
    },
    leaveDescriptionDisabled: {
        color: '#ff5722',
        fontWeight: '600',
        fontSize: 10,
    },
    availableContainer: {
        alignItems: 'flex-end',
        position: 'relative',
    },
    checkmarkBadge: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 17,
        height: 17,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderWidth: 2,
        borderColor: '#0f0f0f',
    },
    availableNumber: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 0,
    },
    availableLabel: {
        fontSize: 8,
        fontWeight: '600',
        color: '#6b7280',
        letterSpacing: 0.5,
    },
    bottomButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 14,
        paddingBottom: 20,
        backgroundColor: '#0f0f0f',
        gap: 10,
    },
    cancelButton: {
        flex: 0.8,
        paddingVertical: 15,
        borderRadius: 10,
        backgroundColor: '#2d2d2d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
    nextButton: {
        flex: 1,
        // paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#ff5722',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff5722',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    nextButtonDisabled: {
        backgroundColor: '#2d2d2d',
        opacity: 0.5,
    },
    nextButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
});