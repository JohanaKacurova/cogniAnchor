import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Alert,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Eye, EyeOff, Mail, Lock, User, Heart, ChevronDown, Check, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SignUpScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: '',
    signingUpForSomeoneElse: false,
    agreedToTerms: false,
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const roleOptions = [
    { id: 'caregiver', name: 'Caregiver', description: 'I care for someone with memory challenges' },
    { id: 'patient', name: 'Patient', description: 'I am managing my own memory care' },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Please enter a password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }
    
    if (!formData.agreedToTerms) {
      newErrors.terms = 'Please agree to the Privacy Policy and Terms of Use';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    // Simulate sign up process
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Account Created!',
        'Welcome to CogniAnchor. Your account has been created successfully.',
        [
          { 
            text: 'Get Started', 
            onPress: () => router.replace('/')
          }
        ]
      );
    }, 2000);
  };

  const handleLogin = () => {
    router.push('/(auth)/login' as any);
  };

  const getSelectedRoleName = () => {
    const role = roleOptions.find(r => r.id === formData.role);
    return role ? role.name : 'Select your role';
  };

  const handleConsentModalOpen = () => {
    setShowConsentModal(true);
  };

  const handleConsentAgree = () => {
    setShowConsentModal(false);
    handleInputChange('agreedToTerms', true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View 
          style={[
            styles.headerSection,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Heart size={50} color="#4682B4" strokeWidth={2} />
          </View>
          <Text style={styles.welcomeTitle}>Create Your</Text>
          <Text style={styles.appTitle}>CogniAnchor Account</Text>
          <Text style={styles.subtitle}>Join our caring community for memory support</Text>
        </Animated.View>

        {/* Sign Up Form */}
        <View style={styles.formSection}>
          {/* Full Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={[
              styles.inputContainer,
              errors.fullName && styles.inputError
            ]}>
              <User size={24} color="#4682B4" strokeWidth={2} />
              <TextInput
                style={styles.textInput}
                value={formData.fullName}
                onChangeText={(text) => handleInputChange('fullName', text)}
                placeholder="Enter your full name"
                placeholderTextColor="#A0A0A0"
                autoCapitalize="words"
              />
            </View>
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          {/* Email Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[
              styles.inputContainer,
              errors.email && styles.inputError
            ]}>
              <Mail size={24} color="#4682B4" strokeWidth={2} />
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder="Enter your email"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[
              styles.inputContainer,
              errors.password && styles.inputError
            ]}>
              <Lock size={24} color="#4682B4" strokeWidth={2} />
              <TextInput
                style={styles.textInput}
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                placeholder="Enter your password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={24} color="#A0A0A0" strokeWidth={2} />
                ) : (
                  <Eye size={24} color="#A0A0A0" strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Role Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Your Role</Text>
            <TouchableOpacity 
              style={[
                styles.dropdownButton,
                errors.role && styles.inputError
              ]}
              onPress={() => setShowRoleDropdown(!showRoleDropdown)}
            >
              <Text style={styles.dropdownText}>{getSelectedRoleName()}</Text>
              <ChevronDown size={24} color="#4682B4" strokeWidth={2} />
            </TouchableOpacity>
            
            {showRoleDropdown && (
              <View style={styles.dropdownMenu}>
                {roleOptions.map((role) => (
                  <TouchableOpacity 
                    key={role.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('role', role.id);
                      setShowRoleDropdown(false);
                    }}
                  >
                    <View style={styles.roleContent}>
                      <Text style={styles.roleName}>{role.name}</Text>
                      <Text style={styles.roleDescription}>{role.description}</Text>
                    </View>
                    {formData.role === role.id && (
                      <Check size={20} color="#4682B4" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.role && (
              <Text style={styles.errorText}>{errors.role}</Text>
            )}
          </View>

          {/* Someone Else Toggle */}
          <View style={styles.toggleSection}>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => handleInputChange('signingUpForSomeoneElse', !formData.signingUpForSomeoneElse)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                formData.signingUpForSomeoneElse && styles.checkboxChecked
              ]}>
                {formData.signingUpForSomeoneElse && (
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
              <Text style={styles.toggleText}>I am signing up for someone else</Text>
            </TouchableOpacity>
          </View>

          {/* Terms Agreement */}
          <View style={styles.toggleSection}>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => handleInputChange('agreedToTerms', !formData.agreedToTerms)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                formData.agreedToTerms && styles.checkboxChecked,
                errors.terms && styles.checkboxError
              ]}>
                {formData.agreedToTerms && (
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.toggleText}>I agree to the </Text>
                <TouchableOpacity onPress={handleConsentModalOpen}>
                  <Text style={styles.termsLink}>Privacy Policy and Terms of Use</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            {errors.terms && (
              <Text style={styles.errorText}>{errors.terms}</Text>
            )}
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity 
            style={[
              styles.signUpButton,
              isLoading && styles.signUpButtonDisabled
            ]}
            onPress={handleSignUp}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={styles.signUpButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>
            <TouchableOpacity 
              onPress={handleLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Consent Modal */}
      <Modal
        visible={showConsentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConsentModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy & Data Protection</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowConsentModal(false)}
            >
              <X size={24} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
            <View style={styles.consentSection}>
              <Text style={styles.consentTitle}>What Data We Collect</Text>
              <Text style={styles.consentText}>
                • Personal information (name, email, contact details){'\n'}
                • Health and medication reminders you create{'\n'}
                • Contact information for your care network{'\n'}
                • Usage patterns to improve your experience
              </Text>
            </View>

            <View style={styles.consentSection}>
              <Text style={styles.consentTitle}>Why We Collect This Information</Text>
              <Text style={styles.consentText}>
                • To provide personalized reminders and support{'\n'}
                • To connect you with your care network{'\n'}
                • To ensure your safety and well-being{'\n'}
                • To improve our services for memory care
              </Text>
            </View>

            <View style={styles.consentSection}>
              <Text style={styles.consentTitle}>Your Privacy Rights</Text>
              <Text style={styles.consentText}>
                • Your data is encrypted and securely stored{'\n'}
                • We never sell your personal information{'\n'}
                • You can request data deletion at any time{'\n'}
                • You control who has access to your information
              </Text>
            </View>

            <View style={styles.consentHighlight}>
              <Text style={styles.consentHighlightText}>
                <Text style={styles.consentBold}>Informed Consent:</Text> By using CogniAnchor, you understand and consent to the collection and use of your information as described. This consent is especially important for individuals with memory challenges, and we encourage family involvement in this decision.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.agreeButton}
              onPress={handleConsentAgree}
            >
              <Text style={styles.agreeButtonText}>I Understand & Agree</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  headerSection: ViewStyle;
  logoContainer: ViewStyle;
  welcomeTitle: TextStyle;
  appTitle: TextStyle;
  subtitle: TextStyle;
  formSection: ViewStyle;
  inputSection: ViewStyle;
  inputLabel: TextStyle;
  inputContainer: ViewStyle;
  inputError: ViewStyle;
  textInput: TextStyle;
  eyeButton: ViewStyle;
  errorText: TextStyle;
  dropdownButton: ViewStyle;
  dropdownText: TextStyle;
  placeholderText: TextStyle;
  dropdownMenu: ViewStyle;
  dropdownItem: ViewStyle;
  roleContent: ViewStyle;
  roleName: TextStyle;
  roleDescription: TextStyle;
  toggleSection: ViewStyle;
  toggleButton: ViewStyle;
  checkbox: ViewStyle;
  checkboxChecked: ViewStyle;
  checkboxError: ViewStyle;
  toggleText: TextStyle;
  termsTextContainer: ViewStyle;
  termsLink: TextStyle;
  signUpButton: ViewStyle;
  signUpButtonDisabled: ViewStyle;
  signUpButtonText: TextStyle;
  loginSection: ViewStyle;
  loginPrompt: TextStyle;
  loginLink: TextStyle;
  modalContainer: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  closeButton: ViewStyle;
  modalContent: ViewStyle;
  consentSection: ViewStyle;
  consentTitle: TextStyle;
  consentText: TextStyle;
  consentHighlight: ViewStyle;
  consentHighlightText: TextStyle;
  consentBold: TextStyle;
  modalActions: ViewStyle;
  agreeButton: ViewStyle;
  agreeButtonText: TextStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 28,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4682B4',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  formSection: {
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E6E6FA',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
    minHeight: 65,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#FF4444',
    borderWidth: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '500',
    color: '#2C3E50',
    lineHeight: 26,
  },
  eyeButton: {
    padding: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E6E6FA',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 65,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#2C3E50',
    lineHeight: 26,
    flex: 1,
  },
  placeholderText: {
    color: '#A0A0A0',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6FA',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 70,
  },
  roleContent: {
    flex: 1,
    paddingRight: 12,
  },
  roleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    lineHeight: 24,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },
  toggleSection: {
    marginBottom: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E6E6FA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  checkboxError: {
    borderColor: '#FF4444',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    lineHeight: 22,
    flex: 1,
  },
  termsTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  termsLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4682B4',
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF4444',
    marginTop: 6,
    lineHeight: 18,
  },
  signUpButton: {
    backgroundColor: '#4682B4',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 65,
  },
  signUpButtonDisabled: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0.05,
  },
  signUpButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  loginSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  loginPrompt: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 22,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4682B4',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6FA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    lineHeight: 26,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  consentSection: {
    marginBottom: 24,
  },
  consentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
    lineHeight: 24,
  },
  consentText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 24,
  },
  consentHighlight: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4682B4',
    marginBottom: 20,
  },
  consentHighlightText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#2C3E50',
    lineHeight: 24,
  },
  consentBold: {
    fontWeight: '700',
  },
  modalActions: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E6E6FA',
  },
  agreeButton: {
    backgroundColor: '#4682B4',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
});