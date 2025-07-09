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
import { Eye, EyeOff, Mail, Lock, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Please enter your password';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      // Navigate directly to My Day screen
      router.replace('/(tabs)/' as any);
    }, 1500);
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password' as any);
  };

  const handleSignUp = () => {
    router.push('/(auth)/signup' as any);
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
            <Heart size={60} color="#4682B4" strokeWidth={2} />
          </View>
          <Text style={styles.welcomeTitle}>Welcome Back to</Text>
          <Text style={styles.appTitle}>CogniAnchor</Text>
          <Text style={styles.subtitle}>Your trusted companion for daily care and connection</Text>
        </Animated.View>

        {/* Login Form */}
        <View style={styles.formSection}>
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
            <View style={styles.passwordLabelContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
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

          {/* Login Button */}
          <TouchableOpacity 
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Log In'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpSection}>
            <Text style={styles.signUpPrompt}>Don't have an account?</Text>
            <TouchableOpacity 
              onPress={handleSignUp}
              activeOpacity={0.7}
            >
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust Message */}
        <View style={styles.trustSection}>
          <Text style={styles.trustText}>
            Your privacy and security are our top priority. We protect your personal information with the highest standards of care.
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
  logoContainer: ViewStyle;
  welcomeTitle: TextStyle;
  appTitle: TextStyle;
  subtitle: TextStyle;
  formSection: ViewStyle;
  inputSection: ViewStyle;
  inputLabel: TextStyle;
  passwordLabelContainer: ViewStyle;
  forgotPasswordButton: ViewStyle;
  forgotPasswordText: TextStyle;
  inputContainer: ViewStyle;
  inputError: ViewStyle;
  textInput: TextStyle;
  eyeButton: ViewStyle;
  errorText: TextStyle;
  loginButton: ViewStyle;
  loginButtonDisabled: ViewStyle;
  loginButtonText: TextStyle;
  signUpSection: ViewStyle;
  signUpPrompt: TextStyle;
  signUpLink: TextStyle;
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerSection: {
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
    marginBottom: 24,
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
    fontSize: 24,
    fontWeight: '500',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 30,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4682B4',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  formSection: {
    marginBottom: 32,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
    lineHeight: 24,
  },
  passwordLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  forgotPasswordButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4682B4',
    lineHeight: 20,
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
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF4444',
    marginTop: 8,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#4682B4',
    borderRadius: 20,
    paddingVertical: 20,
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
    minHeight: 70,
  },
  loginButtonDisabled: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0.05,
  },
  loginButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  signUpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  signUpPrompt: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 24,
  },
  signUpLink: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4682B4',
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