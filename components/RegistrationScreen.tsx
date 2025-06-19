import type { InsertUser } from '@/lib';
import { auth, users } from '@/lib';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

const { width } = Dimensions.get('window');

interface ResourceCategory {
  name: string;
  color: string;
  icon: string;
}

interface ResourceCategories {
  [key: string]: ResourceCategory[];
}

const RESOURCE_CATEGORIES: ResourceCategories = {
  'PROJECT & CONSTRUCTION RESOURCES': [
    { name: 'Land', color: '#64b5f6', icon: '🌍' },
    { name: 'Machines', color: '#64b5f6', icon: '🚛' },
    { name: 'Material', color: '#64b5f6', icon: '🏗️' },
    { name: 'Equipment', color: '#64b5f6', icon: '⚡' },
    { name: 'Tools', color: '#64b5f6', icon: '🔧' },
    { name: 'Manpower', color: '#64b5f6', icon: '👥' }
  ],
  'BUSINESS RESOURCES': [
    { name: 'Finance', color: '#64b5f6', icon: '💰' },
    { name: 'Tenders', color: '#64b5f6', icon: '📋' },
    { name: 'Showcase', color: '#64b5f6', icon: '🎯' },
    { name: 'Auction', color: '#64b5f6', icon: '🔨' }
  ],
  'STUDENT RESOURCES': [
    { name: 'Jobs', color: '#64b5f6', icon: '💼' },
    { name: 'E-Stores', color: '#64b5f6', icon: '🛍️' }
  ]
};

// Create display names for better dropdown experience
const CATEGORY_DISPLAY_NAMES: { [key: string]: string } = {
  'PROJECT & CONSTRUCTION RESOURCES': 'Project & Construction',
  'BUSINESS RESOURCES': 'Business Resources',
  'STUDENT RESOURCES': 'Student Resources'
};

interface RegistrationScreenProps {
  onComplete?: () => void;
  onNavigateToLogin?: () => void;
}

export default function RegistrationScreen({ onComplete, onNavigateToLogin }: RegistrationScreenProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 - Basic Info
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Step 2 - Resources (simplified)
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPrimaryResource, setSelectedPrimaryResource] = useState<string>('');

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a resource category');
      return false;
    }
    if (!selectedPrimaryResource) {
      Alert.alert('Error', 'Please select a primary resource');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedPrimaryResource(''); // Reset primary resource when category changes
  };

  const getAvailablePrimaryResources = () => {
    if (!selectedCategory || !RESOURCE_CATEGORIES[selectedCategory]) {
      return [];
    }
    return RESOURCE_CATEGORIES[selectedCategory];
  };

  const handleRegistration = async () => {
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create auth user (bypass email confirmation)
      const { data: authData, error: authError } = await auth.signUpDirect(
        formData.email.trim().toLowerCase(),
        formData.password
      );

      if (authError) {
        Alert.alert('Registration Error', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Registration Error', 'Failed to create user account');
        return;
      }

      // Note: User might not be confirmed yet, but we'll create the profile anyway

      // Step 2: Create user record in database
      const userData: InsertUser = {
        name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password, // Note: In production, password should be hashed
        verified: false,
        is_admin: false,
        resources: [selectedCategory], // Store selected category as JSON array
        primary_resource: [selectedPrimaryResource], // Store primary resource as JSON array
      };

      const { data: userRecord, error: userError } = await users.create(userData);

      if (userError) {
        Alert.alert('Registration Error', 'Failed to create user profile');
        console.error('User creation error:', userError);
        return;
      }

      Alert.alert(
        'Registration Successful!',
        `Welcome ${formData.fullName}! Your account has been created successfully. Please login to continue.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onComplete?.();
            },
          },
        ]
      );

    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <ThemedView style={styles.stepContainer}>
      <ThemedText type="title" style={styles.stepTitle}>
        Create Your Account
      </ThemedText>
      <ThemedText style={styles.stepSubtitle}>
        Enter your basic information to get started
      </ThemedText>

      <ThemedView style={styles.formContainer}>
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Full Name</ThemedText>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your full name"
            value={formData.fullName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
            autoCapitalize="words"
          />
        </ThemedView>

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
          />
        </ThemedView>

        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Password</ThemedText>
          <TextInput
            style={styles.textInput}
            placeholder="Create a password (min 6 characters)"
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
            autoCapitalize="none"
          />
        </ThemedView>

        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Confirm Password</ThemedText>
          <TextInput
            style={styles.textInput}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
            secureTextEntry
            autoCapitalize="none"
          />
        </ThemedView>
      </ThemedView>

      <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
        <ThemedText style={styles.buttonText}>Next Step →</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  const renderStep2 = () => (
    <ThemedView style={styles.stepContainer}>
      {/* Header */}
      <ThemedView style={styles.headerContainer}>
        <ThemedText style={styles.signUpTitle}>Sign Up</ThemedText>
        <ThemedText style={styles.logoText}>🏗️ UPC</ThemedText>
      </ThemedView>

      <ThemedView style={styles.formContainer}>
        {/* Resource Category Dropdown */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Select Resource Category</ThemedText>
          <ThemedView style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCategory}
              style={styles.picker}
              onValueChange={handleCategoryChange}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Select a resource category" value="" />
              {Object.keys(RESOURCE_CATEGORIES).map((category) => (
                <Picker.Item 
                  key={category} 
                  label={CATEGORY_DISPLAY_NAMES[category] || category} 
                  value={category} 
                />
              ))}
            </Picker>
          </ThemedView>
        </ThemedView>

        {/* Primary Resource Dropdown */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Select Primary Resource</ThemedText>
          <ThemedView style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedPrimaryResource}
              style={styles.picker}
              onValueChange={setSelectedPrimaryResource}
              enabled={!!selectedCategory}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Select a primary resource" value="" />
              {getAvailablePrimaryResources().map((resource) => (
                <Picker.Item key={resource.name} label={resource.name} value={resource.name} />
              ))}
            </Picker>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Show selected category for confirmation */}
      {selectedCategory && (
        <ThemedView style={styles.selectedCategoryContainer}>
          <ThemedText style={styles.selectedCategoryLabel}>Selected Category:</ThemedText>
          <ThemedText style={styles.selectedCategoryText}>
            {CATEGORY_DISPLAY_NAMES[selectedCategory] || selectedCategory}
          </ThemedText>
        </ThemedView>
      )}

      {/* Buttons */}
      <ThemedView style={styles.step2ButtonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep}>
          <ThemedText style={styles.backButtonText}>Previous</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.createButton, loading && styles.disabledButton]} 
          onPress={handleRegistration}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <ThemedText style={styles.createButtonText}>Create Account</ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>

      {/* Login Link */}
      <ThemedView style={styles.loginLinkContainer}>
        <TouchableOpacity onPress={onNavigateToLogin}>
          <ThemedText style={styles.loginText}>
            Already have an account? 
            <ThemedText style={styles.loginLink}> Login</ThemedText>
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Progress Indicator - only show for step 1 */}
      {currentStep === 1 && (
        <ThemedView style={styles.progressContainer}>
          <ThemedView style={styles.progressBar}>
            <ThemedView style={[styles.progressFill, { width: `${(currentStep / 2) * 100}%` }]} />
          </ThemedView>
          <ThemedText style={styles.progressText}>Step {currentStep} of 2</ThemedText>
        </ThemedView>
      )}

      {currentStep === 1 ? renderStep1() : renderStep2()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  progressContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#dc3545',
    borderRadius: 2,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  signUpTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  stepSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    fontSize: 14,
  },
  formContainer: {
    gap: 24,
    marginBottom: 20,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  pickerItem: {
    fontSize: 16,
    height: 50,
  },
  selectedCategoryContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategoryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedCategoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  step2ButtonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginLinkContainer: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    color: '#dc3545',
    fontWeight: '500',
  },
}); 