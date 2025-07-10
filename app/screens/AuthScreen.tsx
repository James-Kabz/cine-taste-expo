
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '@/hooks/useSession';
import LoadingSpinner from '@/components/LoadingSpinner';
import { COLORS } from '@/utils/constants';

// const { width, height } = Dimensions.get('window');

const AuthScreen = () => {
  const { signIn } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn();
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert(
        "Sign In Failed",
        "Unable to sign in with Google. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Signing in..." />;
  }

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.card, COLORS.background]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <MaterialIcons name="movie" size={60} color={COLORS.primary} />
          </View>
        </View>

        {/* Title and Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome to CineTaste</Text>
          <Text style={styles.subtitle}>
            Discover, track, and enjoy your favorite movies and TV shows
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <MaterialIcons name="search" size={24} color={COLORS.accent} />
            <Text style={styles.featureText}>Discover new movies and shows</Text>
          </View>
          
          <View style={styles.feature}>
            <MaterialIcons name="bookmark" size={24} color={COLORS.accent} />
            <Text style={styles.featureText}>Create your personal watchlist</Text>
          </View>
          
          <View style={styles.feature}>
            <MaterialIcons name="star" size={24} color={COLORS.accent} />
            <Text style={styles.featureText}>Rate and review content</Text>
          </View>
          
          <View style={styles.feature}>
            <MaterialIcons name="history" size={24} color={COLORS.accent} />
            <Text style={styles.featureText}>Track your viewing history</Text>
          </View>
        </View>

        {/* Sign In Button */}
        <View style={styles.authContainer}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <MaterialIcons name="login" size={20} color={COLORS.background} />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
          
          <Text style={styles.termsText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    marginLeft: 16,
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  authContainer: {
    alignItems: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 16,
  },
  googleButtonText: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.background,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});

export default AuthScreen;
