import { auth } from '@/lib';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  onNavigateToRegister?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login with:', formData.email.trim().toLowerCase());
      
      const { data, error } = await auth.signInBypass(
        formData.email.trim().toLowerCase(),
        formData.password
      );

      console.log('Login response:', { data, error });

      if (error) {
        console.error('Login error:', error);
        Alert.alert('Login Error', error.message);
        setLoading(false);
        return;
      }

      if (!data || !data.user) {
        console.error('No user data returned');
        Alert.alert('Login Error', 'Failed to sign in - no user data');
        setLoading(false);
        return;
      }

      console.log('Login successful, user:', data.user);
      
      // Store the current user email globally for session management
      global.currentUserEmail = data.user.email;
      
      console.log('Stored user email:', global.currentUserEmail);
      console.log('Calling onLoginSuccess...');

      // Reset loading state first
      setLoading(false);
      
      // Call the success callback immediately
      onLoginSuccess?.();

    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Welcome Message */}
      <ThemedView style={styles.welcomeContainer}>
        <ThemedText style={styles.logoText}>🏗️ UPC</ThemedText>
        <ThemedText style={styles.welcomeTitle}>Welcome Back!</ThemedText>
        <ThemedText style={styles.welcomeSubtitle}>
          Please sign in to your account
        </ThemedText>
      </ThemedView>

      {/* Login Form */}
      <ThemedView style={styles.formContainer}>
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </ThemedView>

        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Password</ThemedText>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your password"
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />
        </ThemedView>

        {/* Forgot Password Link */}
        <TouchableOpacity style={styles.forgotPasswordContainer}>
          <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Login Button */}
      <TouchableOpacity 
        style={[styles.loginButton, loading && styles.disabledButton]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <ThemedText style={styles.loginButtonText}>Login</ThemedText>
        )}
      </TouchableOpacity>

      {/* Register Link */}
      <ThemedView style={styles.registerLinkContainer}>
        <TouchableOpacity onPress={onNavigateToRegister}>
          <ThemedText style={styles.registerText}>
            Don't have an account? 
            <ThemedText style={styles.registerLink}> Sign Up</ThemedText>
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgba(99, 102, 241, 1.00)',
    textAlign: 'center',
    marginBottom: 20,
  },
  welcomeContainer: {
    marginBottom: 50,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    gap: 24,
    marginBottom: 30,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#333',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    color: 'rgba(99, 102, 241, 1.00)',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: 'rgba(99, 102, 241, 1.00)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerLinkContainer: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    color: 'rgba(99, 102, 241, 1.00)',
    fontWeight: '500',
  },
}); 