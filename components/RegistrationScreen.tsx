import type { InsertUser } from '@/lib';
import { auth, users } from '@/lib';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
    { name: 'Land', color: 'rgba(99, 102, 241, 1.00)', icon: '🌍' },
    { name: 'Machines', color: 'rgba(99, 102, 241, 1.00)', icon: '🚛' },
    { name: 'Material', color: 'rgba(99, 102, 241, 1.00)', icon: '🏗️' },
    { name: 'Equipment', color: 'rgba(99, 102, 241, 1.00)', icon: '⚡' },
    { name: 'Tools', color: 'rgba(99, 102, 241, 1.00)', icon: '🔧' },
    { name: 'Manpower', color: 'rgba(99, 102, 241, 1.00)', icon: '👥' }
  ],
  'BUSINESS RESOURCES': [
    { name: 'Finance', color: 'rgba(99, 102, 241, 1.00)', icon: '💰' },
    { name: 'Tenders', color: 'rgba(99, 102, 241, 1.00)', icon: '📋' },
    { name: 'Showcase', color: 'rgba(99, 102, 241, 1.00)', icon: '🎯' },
    { name: 'Auction', color: 'rgba(99, 102, 241, 1.00)', icon: '🔨' }
  ],
  'STUDENT RESOURCES': [
    { name: 'Jobs', color: 'rgba(99, 102, 241, 1.00)', icon: '💼' },
    { name: 'E-Stores', color: 'rgba(99, 102, 241, 1.00)', icon: '🛍️' }
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

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);
  const toastOpacity = useState(new Animated.Value(0))[0];

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
  
  // Modal states for custom dropdowns
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPrimaryResourceModal, setShowPrimaryResourceModal] = useState(false);

  // Custom toast function
  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToastMessage({ type, title, message });
    setToastVisible(true);
    
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide after 4 seconds
    setTimeout(() => {
      hideToast();
    }, 4000);
  };

  const hideToast = () => {
    Animated.timing(toastOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToastVisible(false);
      setToastMessage(null);
    });
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data } = await users.getByEmail(email.trim().toLowerCase());
      return !!data; // Returns true if user exists
    } catch (error) {
      console.error('Error checking email:', error);
      return false; // Assume email doesn't exist if there's an error
    }
  };

  const validateStep1 = async (): Promise<boolean> => {
    if (!formData.fullName.trim()) {
      showToast('error', 'Missing Information', 'Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      showToast('error', 'Missing Information', 'Please enter your email address');
      return false;
    }
    if (!formData.password) {
      showToast('error', 'Missing Information', 'Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      showToast('error', 'Invalid Password', 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast('error', 'Password Mismatch', 'Passwords do not match');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('error', 'Invalid Email', 'Please enter a valid email address');
      return false;
    }
    
    // Check if email already exists
    try {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        showToast('error', 'Email Already Registered', `${formData.email} is already registered. Please use a different email or login.`);
        return false;
      }
    } catch (error) {
      console.error('Error checking email:', error);
      showToast('error', 'Connection Error', 'Unable to verify email. Please check your connection.');
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

  const handleNextStep = async () => {
    if (currentStep === 1) {
      const isValid = await validateStep1();
      if (isValid) {
        setCurrentStep(2);
      }
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
    console.log('🚀 Starting registration process...');
    
    try {
      // Double-check email doesn't exist right before registration
      console.log('🔍 Final email check before registration...');
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setLoading(false);
        showToast('error', 'Email Already Registered', `${formData.email} is already registered. Please use a different email.`);
        setCurrentStep(1); // Go back to step 1 to change email
        return;
      }

      // Step 1: Create auth user (bypass email confirmation)
      console.log('📧 Creating auth user for:', formData.email.trim().toLowerCase());
      const { data: authData, error: authError } = await auth.signUpDirect(
        formData.email.trim().toLowerCase(),
        formData.password
      );

      console.log('Auth result:', { authData, authError });

      if (authError) {
        console.error('❌ Auth error:', authError);
        setLoading(false);
        
        // Handle specific case of email already exists
        if (authError.message === 'User already exists') {
          showToast('error', 'Email Already Registered', `${formData.email} is already registered. Please use a different email.`);
          setCurrentStep(1); // Go back to step 1 to change email
          return;
        }
        
        // Handle other auth errors
        showToast('error', 'Registration Failed', authError.message || 'Failed to create account. Please try again.');
        return;
      }

      if (!authData?.user) {
        console.error('❌ No user data returned from auth');
        setLoading(false);
        showToast('error', 'Registration Failed', 'Failed to create user account. Please try again.');
        return;
      }

      console.log('✅ Auth user created successfully');

      // Step 2: Create user record in database
      const userData: InsertUser = {
        name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password, // Note: In production, password should be hashed
        primary_resource: [selectedPrimaryResource], // Store primary resource as JSON array
      };

      console.log('📝 Creating user record in database:', userData);
      const { data: userRecord, error: userError } = await users.create(userData);

      console.log('User creation result:', { userRecord, userError });

      if (userError) {
        console.error('❌ User creation error:', userError);
        setLoading(false);
        
        // Handle database constraint errors (e.g., unique email constraint)
        if (userError.message?.includes('duplicate key value') || 
            userError.message?.includes('already exists') ||
            userError.code === '23505') {
          showToast('error', 'Email Already Registered', `${formData.email} is already registered. Please use a different email.`);
          setCurrentStep(1); // Go back to step 1 to change email
          return;
        }
        
        showToast('error', 'Registration Failed', 'Failed to create user profile. Please try again.');
        return;
      }

      console.log('✅ User record created successfully');
      console.log('🎉 Registration completed successfully');

      setLoading(false);
      
      // Show success toast
      showToast('success', 'Registration Successful!', `Welcome ${formData.fullName}! Please login to continue.`);

      // Navigate after a short delay to let user see the success message
      setTimeout(() => {
        console.log('🔄 Navigating to login...');
        onComplete?.();
      }, 1500);

    } catch (error) {
      console.error('💥 Registration error:', error);
      setLoading(false);
      showToast('error', 'Registration Failed', 'An unexpected error occurred. Please try again.');
    }
  };

  const renderStep1 = () => (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView style={styles.stepContent}>
        <Image 
          source={require('@/assets/images/upcr-logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
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
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView style={styles.stepContent}>
        <Image 
          source={require('@/assets/images/upcr-logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <ThemedText style={styles.stepTitle}>Complete Registration</ThemedText>
        <ThemedText style={styles.stepSubtitle}>Step 2 of 2: Select your resources</ThemedText>

        <ThemedView style={styles.formContainer}>
        {/* Resource Category Dropdown */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Select Resource Category</ThemedText>
          <TouchableOpacity 
            style={styles.customPickerButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <ThemedText style={[styles.customPickerText, !selectedCategory && styles.placeholderText]}>
              {selectedCategory ? (CATEGORY_DISPLAY_NAMES[selectedCategory] || selectedCategory) : 'Select a resource category'}
            </ThemedText>
            <ThemedText style={styles.dropdownArrow}>▼</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Primary Resource Dropdown */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Select Primary Resource</ThemedText>
          <TouchableOpacity 
            style={[styles.customPickerButton, !selectedCategory && styles.disabledPicker]}
            onPress={() => selectedCategory && setShowPrimaryResourceModal(true)}
            disabled={!selectedCategory}
          >
            <ThemedText style={[styles.customPickerText, !selectedPrimaryResource && styles.placeholderText, !selectedCategory && styles.disabledText]}>
              {selectedPrimaryResource || (!selectedCategory ? 'Select category first' : 'Select a primary resource')}
            </ThemedText>
            <ThemedText style={[styles.dropdownArrow, !selectedCategory && styles.disabledText]}>▼</ThemedText>
          </TouchableOpacity>
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
    </ScrollView>
  );

  // Category Selection Modal
  const renderCategoryModal = () => (
    <Modal visible={showCategoryModal} transparent animationType="slide">
      <ThemedView style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>Select Resource Category</ThemedText>
          
          {Object.keys(RESOURCE_CATEGORIES).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.modalOptionButton,
                selectedCategory === category && styles.selectedModalOption,
              ]}
              onPress={() => {
                handleCategoryChange(category);
                setShowCategoryModal(false);
              }}
            >
              <ThemedText style={[
                styles.modalOptionText,
                selectedCategory === category && styles.selectedModalOptionText,
              ]}>
                {CATEGORY_DISPLAY_NAMES[category] || category}
              </ThemedText>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowCategoryModal(false)}
          >
            <ThemedText style={styles.modalCloseText}>Cancel</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </Modal>
  );

  // Primary Resource Selection Modal
  const renderPrimaryResourceModal = () => (
    <Modal visible={showPrimaryResourceModal} transparent animationType="slide">
      <ThemedView style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>Select Primary Resource</ThemedText>
          
          {getAvailablePrimaryResources().map((resource) => (
            <TouchableOpacity
              key={resource.name}
              style={[
                styles.modalOptionButton,
                selectedPrimaryResource === resource.name && styles.selectedModalOption,
              ]}
              onPress={() => {
                setSelectedPrimaryResource(resource.name);
                setShowPrimaryResourceModal(false);
              }}
            >
              <ThemedText style={[
                styles.modalOptionText,
                selectedPrimaryResource === resource.name && styles.selectedModalOptionText,
              ]}>
                {resource.icon} {resource.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowPrimaryResourceModal(false)}
          >
            <ThemedText style={styles.modalCloseText}>Cancel</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </Modal>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.contentContainer}>
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
        
        {/* Modals */}
        {renderCategoryModal()}
        {renderPrimaryResourceModal()}
      </ThemedView>
      
      {/* Toast Messages */}
      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <View style={[
            styles.toastContent,
            toastMessage?.type === 'error' && styles.toastError,
            toastMessage?.type === 'success' && styles.toastSuccess
          ]}>
            <Text style={styles.toastTitle}>{toastMessage?.title}</Text>
            <Text style={styles.toastMessage}>{toastMessage?.message}</Text>
          </View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
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
    backgroundColor: 'rgba(99, 102, 241, 1.00)',
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
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
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
  logoImage: {
    width: 120,
    height: 80,
    alignSelf: 'center',
    marginBottom: 20,
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
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
    width: '100%',
  },
  pickerItem: {
    fontSize: 14,
    height: 50,
    color: '#333',
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
    backgroundColor: 'rgba(99, 102, 241, 1.00)',
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
    backgroundColor: 'rgba(99, 102, 241, 1.00)',
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
    color: 'rgba(99, 102, 241, 1.00)',
    fontWeight: '500',
  },
  customPickerButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  customPickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  disabledPicker: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  disabledText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  modalOptionButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedModalOption: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  selectedModalOptionText: {
    color: 'rgba(99, 102, 241, 1.00)',
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    elevation: 1000,
  },
  toastContent: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  toastMessage: {
    fontSize: 14,
    color: '#666',
  },
  toastError: {
    borderLeftColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  toastSuccess: {
    borderLeftColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
}); 