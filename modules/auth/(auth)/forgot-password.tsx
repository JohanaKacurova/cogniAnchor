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
  Alert,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { ArrowLeft, Mail, Send, CircleCheck as CheckCircle, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validateEmail = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendResetLink = async () => {
    if (!validateEmail()) {
      return;
    }
    
    setIsLoading(true);
    
    // Simulate sending reset email
    setTimeout(() => {
      setIsLoading(false);
      setEmailSent(true);
    }, 1500);
  };

  const handleBackToLogin = () => {
    router.push('/(auth)/login' as any);
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleSendResetLink();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.headerSection}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToLogin}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#4682B4" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <Animated.View 
          style={[
            styles.mainSection,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {!emailSent ? (
            <>
              {/* Logo and Title */}
              <View style={styles.logoContainer}>
                <Heart size={60} color="#4682B4" strokeWidth={2} />
              </View>
              
              <Text style={styles.title}>Reset Your Password</Text>
              
              <Text style={styles.description}>
                No worries. Just enter your email and we'll help you reset your password.
              </Text>

              {/* Email Input Form */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Your Email Address</Text>
                <View style={[
                  styles.inputContainer,
                  errors.email && styles.inputError
                ]}>
                  <Mail size={24} color="#4682B4" strokeWidth={2} />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder="Enter your email address"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}

                {/* Send Reset Link Button */}
                <TouchableOpacity 
                  style={[
                    styles.resetButton,
                    isLoading && styles.resetButtonDisabled
                  ]}
                  onPress={handleSendResetLink}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <Send size={24} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.resetButtonText}>
                    {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Success State */}
              <View style={styles.successContainer}>
                <CheckCircle size={80} color="#4CAF50" strokeWidth={2} />
              </View>
              
              <Text style={styles.successTitle}>Check Your Email</Text>
              
              <Text style={styles.successDescription}>
                If an account exists for that email, a reset link has been sent.
              </Text>
              
              <Text style={styles.emailSentTo}>
                We sent instructions to:
              </Text>
              <Text style={styles.emailAddress}>{email}</Text>

              {/* Resend Button */}
              <TouchableOpacity 
                style={styles.resendButton}
                onPress={handleResendEmail}
                activeOpacity={0.8}
              >
                <Text style={styles.resendButtonText}>Didn't receive it? Send again</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Back to Login Link */}
          <TouchableOpacity 
            style={styles.backToLoginButton}
            onPress={handleBackToLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Trust Message */}
        <View style={styles.trustSection}>
          <Text style={styles.trustText}>
            Your account security is important to us. We'll never share your email or send unwanted messages.
          </Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  headerSection: ViewStyle;
  backButton: ViewStyle;
  mainSection: ViewStyle;
  logoContainer: ViewStyle;
  title: TextStyle;
  description: TextStyle;
  formSection: ViewStyle;
  inputLabel: TextStyle;
  inputContainer: ViewStyle;
  inputError: ViewStyle;
  textInput: TextStyle;
  errorText: TextStyle;
  resetButton: ViewStyle;
  resetButtonDisabled: ViewStyle;
  resetButtonText: TextStyle;
  successContainer: ViewStyle;
  successTitle: TextStyle;
  successDescription: TextStyle;
  emailSentTo: TextStyle;
  emailAddress: TextStyle;
  resendButton: ViewStyle;
  resendButtonText: TextStyle;
  backToLoginButton: ViewStyle;
  backToLoginText: TextStyle;
  trustSection: ViewStyle;
  trustText: TextStyle;
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E6E6FA',
  },
  mainSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  description: {
    fontSize: 18,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    maxWidth: 320,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E6E6FA',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
    minHeight: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
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
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF4444',
    marginBottom: 16,
    lineHeight: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 70,
  },
  resetButtonDisabled: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0.05,
  },
  resetButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  // Success State Styles
  successContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  successDescription: {
    fontSize: 18,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    maxWidth: 320,
  },
  emailSentTo: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  emailAddress: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4682B4',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  resendButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4682B4',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4682B4',
    textAlign: 'center',
    lineHeight: 22,
  },
  backToLoginButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  backToLoginText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4682B4',
    textAlign: 'center',
    lineHeight: 24,
  },
  trustSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E6E6FA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trustText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});