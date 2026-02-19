import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Image,
    ActivityIndicator,
    SafeAreaView,
    Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../constants/config';

export default function LeaveDetailScreen({ navigation, route }) {
    //   Route params se data lo
    const leaveType = route?.params?.leaveType || {
        id: null,
        title: 'Sick Leave',
        color: '#3b82f6',
    };
    const startDate = route?.params?.startDate || null;
    const endDate = route?.params?.endDate || null;
    const duration = route?.params?.duration || 0;
    const token = route?.params?.token;

    console.log('=== LeaveDetail Screen ===');
    console.log('Token:', token ? 'Yes ✓' : 'No ✗');
    console.log('Leave Type:', leaveType.title);
    console.log('Leave Type ID:', leaveType.id);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    console.log('Duration:', duration);

    // States
    const [reason, setReason] = useState('');
    const [uploadedDoc, setUploadedDoc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(''); // 'submitting', 'success', 'error'
    const [statusMessage, setStatusMessage] = useState('');

    //   Check token
    useEffect(() => {
        if (!token) {
            Alert.alert('Session Expired', 'Please login again', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        }
    }, [token]);

    // Helper: Format date for display
    const formatDateDisplay = (isoDate) => {
        if (!isoDate) return 'N/A';
        const d = new Date(isoDate + 'T00:00:00');
        return d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    // Image Picker
    const handlePickImage = async () => {
        // Permission check (required for newer expo versions)
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setUploadedDoc(result.assets[0]);
            console.log('  Image selected:', result.assets[0].uri);
        }
    };

    const handleRemoveDoc = () => {
        setUploadedDoc(null);
        console.log(' Image removed');
    };

    //   API Call - Submit Leave Application
    const handleSubmit = async () => {
        // Prevent multiple submissions
        if (isSubmitting) {
            return;
        }

        // Validation
        if (!reason.trim()) {
            Alert.alert('Required', 'Please provide a reason for leave');
            return;
        }

        if (!leaveType.id) {
            Alert.alert('Error', 'Leave type is missing');
            return;
        }

        if (!startDate || !endDate) {
            Alert.alert('Error', 'Please select dates');
            return;
        }

        if (duration <= 0) {
            Alert.alert('Error', 'Invalid leave duration');
            return;
        }

        setIsSubmitting(true);
        setLoading(true);
        setSubmissionStatus('submitting');
        setStatusMessage('Submitting your leave application...');

        try {
            console.log('🔄 Submitting leave application...');
            console.log('URL:', `${API_BASE_URL}/employee/leave/apply`);
            
            const payload = {
                leave_type_id: leaveType.id,
                start_date: startDate,
                end_date: endDate,
                total_days: duration,
                reason: reason.trim(),
                attachment_url: uploadedDoc?.uri || null
            };
            
            console.log('Payload:', JSON.stringify(payload, null, 2));

            const response = await fetch(`${API_BASE_URL}/employee/leave/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            console.log('📡 Response Status:', response.status);
            const data = await response.json();
            console.log('📦 Response Data:', JSON.stringify(data, null, 2));

            if (response.ok && data.success) {
                console.log(' Leave applied successfully!');
                setSubmissionStatus('success');
                setStatusMessage('Leave application submitted successfully!');
                
                // Wait 2 seconds to show success message, then navigate
                setTimeout(() => {
                    setSubmissionStatus('');
                    // Reset the entire navigation stack to clear all previous form data
                    navigation.reset({
                        index: 0,
                        routes: [
                            {
                                name: 'LeaveHistory',
                                state: {
                                    routes: [
                                        {
                                            name: 'LeaveHistoryMain',
                                            params: { token: token, refresh: true }
                                        }
                                    ]
                                }
                            }
                        ]
                    });
                }, 2000);
            } else {
                console.log(' Submit failed:', data.message);
                setSubmissionStatus('error');
                setStatusMessage(data.message || 'Failed to submit leave application');
                setTimeout(() => {
                    setSubmissionStatus('');
                }, 2000);
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('  Network Error:', error);
            setSubmissionStatus('error');
            setStatusMessage('Network connection failed. Please try again.');
            setTimeout(() => {
                setSubmissionStatus('');
            }, 2000);
            setIsSubmitting(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Status Overlay Modal */}
            <Modal
                transparent={true}
                visible={submissionStatus !== ''}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.statusCard}>
                        {submissionStatus === 'submitting' && (
                            <>
                                <ActivityIndicator size="large" color="#ff5722" />
                                <Text style={styles.statusTitle}>Submitting...</Text>
                                <Text style={styles.statusMessage}>{statusMessage}</Text>
                            </>
                        )}
                        {submissionStatus === 'success' && (
                            <>
                                <View style={styles.successIcon}>
                                    <Ionicons name="checkmark-circle" size={64} color="#10b981" />
                                </View>
                                <Text style={styles.statusTitle}>Success!</Text>
                                <Text style={styles.statusMessage}>{statusMessage}</Text>
                            </>
                        )}
                        {submissionStatus === 'error' && (
                            <>
                                <View style={styles.errorIcon}>
                                    <Ionicons name="close-circle" size={64} color="#ef4444" />
                                </View>
                                <Text style={styles.statusTitle}>Error</Text>
                                <Text style={styles.statusMessage}>{statusMessage}</Text>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation?.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Apply Leave</Text>

                <View style={styles.placeholder} />
            </View>

            {/* Progress Stepper */}
            <View style={styles.stepperContainer}>
                <View style={styles.stepWrapper}>
                    <View style={[styles.stepCircle, styles.stepCompleted]}>
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                    </View>
                    <Text style={[styles.stepLabel, styles.stepLabelActive]}>TYPE</Text>
                </View>

                <View style={[styles.stepLine, styles.stepLineActive]} />

                <View style={styles.stepWrapper}>
                    <View style={[styles.stepCircle, styles.stepCompleted]}>
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                    </View>
                    <Text style={[styles.stepLabel, styles.stepLabelActive]}>DATES</Text>
                </View>

                <View style={[styles.stepLine, reason.trim() && styles.stepLineActive]} />

                <View style={styles.stepWrapper}>
                    <View style={[styles.stepCircle, reason.trim() && styles.stepActive]}>
                        <Text style={styles.stepNumber}>3</Text>
                    </View>
                    <Text style={[styles.stepLabel, reason.trim() && styles.stepLabelActive]}>CONFIRM</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Reason Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="create-outline" size={18} color="#ff5722" />
                        <Text style={styles.sectionTitle}>Reason for Leave</Text>
                    </View>

                    <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Please provide a brief explanation for your leave request..."
                            placeholderTextColor="#6b7280"
                            multiline
                            numberOfLines={6}
                            maxLength={500}
                            value={reason}
                            onChangeText={setReason}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>{reason.length} / 500</Text>
                    </View>
                </View>

                {/* Upload Documents Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cloud-upload-outline" size={18} color="#ff5722" />
                        <Text style={styles.sectionTitle}>Upload Supporting Documents</Text>
                    </View>

                    <View style={styles.uploadContainer}>
                        {uploadedDoc && (
                            <View style={styles.uploadedDoc}>
                                <Image 
                                    source={{ uri: uploadedDoc.uri }} 
                                    style={styles.docImage}
                                />
                                <TouchableOpacity 
                                    style={styles.removeButton}
                                    onPress={handleRemoveDoc}
                                >
                                    <Ionicons name="close-circle" size={24} color="#ff5722" />
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity 
                            style={styles.uploadBox}
                            onPress={handlePickImage}
                        >
                            <Ionicons name="camera-outline" size={40} color="#6b7280" />
                            <Text style={styles.uploadText}>ADD PHOTO</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.uploadNote}>
                        Optional: Upload medical certificates or relevant proof (JPG, PNG)
                    </Text>
                </View>

                {/* Quick Summary Section */}
                <View style={styles.summarySection}>
                    <Text style={styles.summaryTitle}>QUICK SUMMARY</Text>

                    <View style={styles.summaryCard}>
                        <View style={styles.summaryTopRow}>
                            <View style={styles.summaryColumn}>
                                <Text style={styles.summaryLabel}>TYPE</Text>
                                <Text style={styles.summaryValue}>{leaveType.title}</Text>
                            </View>
                            <View style={styles.summaryColumn}>
                                <Text style={styles.summaryLabel}>DURATION</Text>
                                <Text style={styles.summaryValue}>{duration} Days</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.summaryDates}>
                            <Text style={styles.summaryLabel}>DATES</Text>
                            <Text style={styles.summaryDateValue}>
                                {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (isSubmitting || !reason.trim()) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting || !reason.trim()}
                >
                    {isSubmitting ? (
                        <>
                            <ActivityIndicator size="small" color="#FFF" />
                            <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Submitting...</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.submitButtonText}>Submit Application</Text>
                            <MaterialIcons name="send" size={20} color="#FFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#0a0a0a',
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
    placeholder: {
        width: 40,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 30,
        backgroundColor: '#0a0a0a',
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
    section: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
    textInputContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    textInput: {
        color: '#FFF',
        fontSize: 14,
        lineHeight: 20,
        minHeight: 100,
    },
    charCount: {
        fontSize: 11,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 8,
    },
    uploadContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    uploadedDoc: {
        width: 100,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#1a1a1a',
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    docImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    removeButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
    },
    uploadBox: {
        width: 100,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#1a1a1a',
        borderWidth: 2,
        borderColor: '#333',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    uploadText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 0.5,
    },
    uploadNote: {
        fontSize: 11,
        color: '#6b7280',
        fontStyle: 'italic',
        lineHeight: 16,
    },
    summarySection: {
        marginTop: 32,
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ff5722',
        letterSpacing: 1,
        marginBottom: 12,
    },
    summaryCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    summaryTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    summaryColumn: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9ca3af',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 16,
    },
    summaryDates: {
        gap: 6,
    },
    summaryDateValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    bottomContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 30,
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#ff5722',
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#ff5722',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    submitButtonDisabled: {
        backgroundColor: '#2d2d2d',
        opacity: 0.5,
        shadowOpacity: 0,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        minWidth: 280,
        borderWidth: 1,
        borderColor: '#333',
    },
    successIcon: {
        marginBottom: 16,
    },
    errorIcon: {
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFF',
        marginTop: 16,
        marginBottom: 8,
    },
    statusMessage: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 20,
    },
});