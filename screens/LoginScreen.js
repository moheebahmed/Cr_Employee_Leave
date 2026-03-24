import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Clear old tokens on component mount
    React.useEffect(() => {
        const clearOldTokens = async () => {
            try {
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userData');
                console.log('Old tokens cleared');
            } catch (error) {
                console.error('Error clearing tokens:', error);
            }
        };
        clearOldTokens();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }

        try {
            console.log('Attempting login with:', email, password);

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('Response status:', response.status);

            const data = await response.json();

            if (response.ok) {
                const { token, user } = data.data;
                console.log('Login success:', data);

                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('userData', JSON.stringify(user));

                console.log('Token saved to AsyncStorage successfully');

                // Navigate to MainTabs
                navigation.navigate('MainTabs', {
                    screen: 'Dashboard',
                    params: {
                        screen: 'DashboardMain',
                        params: {
                            user: user,
                            token: token
                        }
                    }
                });
            } else {
                alert(data.message || 'Login failed');
            }

        } catch (error) {
            console.error(error);
            alert('An error occurred. Please try again.');
        }
    };


    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={[
                        styles.container,
                        isDarkMode && styles.darkContainer
                    ]}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* Dark mode toggle */}
                    <TouchableOpacity
                        style={styles.darkModeToggle}
                        onPress={() => setIsDarkMode(!isDarkMode)}
                    >
                        <Feather name="moon" size={24} color={isDarkMode ? '#fff' : '#94a3b8'} />
                    </TouchableOpacity>

                    {/* Logo */}
                    <Image source={require('../assets/logo.png')} style={styles.logo} />

                    {/* Logo Text */}
                    <View style={styles.logoTextContainer}>
                        <Text style={[styles.logoTextBlack, isDarkMode && { color: '#FFF' }]}>
                            Concept
                        </Text>
                        <Text style={styles.logoTextOrange}>Recall</Text>
                    </View>

                    <Pressable>
                        <Text style={[styles.portalText, isDarkMode && { color: '#999' }]}>
                            INTERNAL PORTAL
                        </Text>
                    </Pressable>

                    {/* Welcome text */}
                    <View style={styles.welcomeContainer}>
                        <Pressable>
                            <Text style={[styles.welcome, isDarkMode && { color: '#FFF' }]}>
                                Welcome back
                            </Text>
                        </Pressable>

                        <Pressable>
                            <Text style={[styles.subtitle, isDarkMode && { color: '#AAA' }]}>
                                Enter your credentials to manage your leaves.
                            </Text>
                        </Pressable>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isDarkMode && { color: '#CCC' }]}>
                            Email Address
                        </Text>
                        <View style={[styles.inputContainer, isDarkMode && styles.darkInput]}>
                            <MaterialIcons name="email" size={20} color="#94a3b8" style={styles.icon} />
                            <TextInput
                                placeholder="name@conceptrecall.com"
                                placeholderTextColor="#94a3b8"
                                style={[styles.input, isDarkMode && { color: '#FFF' }]}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, isDarkMode && { color: '#CCC' }]}>
                                Password
                            </Text>
                            <Pressable>
                                <Text style={styles.forgot}>Forgot?</Text>
                            </Pressable>
                        </View>

                        <View style={[styles.inputContainer, isDarkMode && styles.darkInput]}>
                            <Feather name="lock" size={20} color="#94a3b8" style={styles.icon} />
                            <TextInput
                                placeholder="••••••••"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry={!showPassword}
                                style={[styles.input, { color: isDarkMode ? '#FFF' : '#1e293b' }]}
                                value={password}
                                onChangeText={setPassword}
                                autoCorrect={false}
                                autoCapitalize="none"
                                textContentType="password"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Feather
                                    name={showPassword ? 'eye' : 'eye-off'}
                                    size={20}
                                    color="#94a3b8"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Remember */}
                    <Pressable
                        style={styles.rememberContainer}
                        onPress={() => setRemember(!remember)}
                    >
                        <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                            {remember && <Feather name="check" size={14} color="#FFF" />}
                        </View>
                        <Text style={[styles.rememberText, isDarkMode && { color: '#CCC' }]}>
                            Remember this device
                        </Text>
                    </Pressable>

                    {/* Login */}
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginButtonText}>Login to Portal</Text>
                        <Feather name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    {/* Footer */}
                    <Pressable>
                        <Text style={[styles.footer, isDarkMode && { color: '#666' }]}>
                            © 2026 ConceptRecall. All rights reserved.{'\n'}For internal use only.
                        </Text>
                    </Pressable>

                </ScrollView>
            </Pressable>
        </KeyboardAvoidingView>
    );
}



const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    darkModeToggle: {
        position: 'absolute',
        top: 50,
        right: 24,
        zIndex: 10,
    },
    logo: {
        width: 80,
        height: 80,
        alignSelf: 'center',
        borderRadius: 16,
    },
    logoTextContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
    },
    logoTextBlack: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
    },
    logoTextOrange: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ff5722',
    },
    portalText: {
        textAlign: 'center',
        fontSize: 11,
        letterSpacing: 1.5,
        color: '#64748b',
        marginTop: 4,
        marginBottom: 40,
    },
    welcomeContainer: {
        marginBottom: 32,
    },
    welcome: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
        color: '#1e293b',
    },
    subtitle: {
        color: '#64748b',
        fontSize: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        backgroundColor: '#FFF',
        borderColor: '#e2e8f0',
    },
    darkInput: {
        backgroundColor: '#1E1E1E',
        borderColor: '#333',
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
    },
    forgot: {
        color: '#ff5722',
        fontWeight: '600',
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderRadius: 50,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#cbd5e1',
    },
    checkboxChecked: {
        backgroundColor: '#ff5722',
        borderColor: '#ff5722',
    },
    rememberText: {
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: '#ff5722',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    loginButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    footer: {
        textAlign: 'center',
        fontSize: 11,
    },
});
