import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    View
} from 'react-native';
import { ThemedText } from './ThemedText';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export default function SplashScreen({ onFinish, duration = 3000 }: SplashScreenProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateSequence = () => {
      // Logo animation - fade in and scale up
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Text animation - fade in after logo
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          // Wait a bit, then fade out everything
          setTimeout(() => {
            Animated.timing(backgroundOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              onFinish?.();
            });
          }, duration - 2100); // Subtract animation times
        });
      });
    };

    animateSequence();
  }, [logoOpacity, logoScale, textOpacity, backgroundOpacity, duration, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: backgroundOpacity }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/upcr-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
        
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <ThemedText style={styles.appName}>Deals Room</ThemedText>
          <ThemedText style={styles.tagline}>Connect • Collaborate • Construct</ThemedText>
        </Animated.View>
      </View>
      
      {/* Loading indicator */}
      <Animated.View style={[styles.loadingContainer, { opacity: textOpacity }]}>
        <View style={styles.loadingBar}>
          <Animated.View style={styles.loadingProgress} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgba(99, 102, 241, 1.00)',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    letterSpacing: 1,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    left: 40,
    right: 40,
  },
  loadingBar: {
    height: 3,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: 'rgba(99, 102, 241, 1.00)',
    borderRadius: 2,
    width: '100%',
  },
}); 