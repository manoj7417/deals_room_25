import HomePage from '@/components/HomePage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth } from '@/lib';
import { sessionStorage } from '@/lib/sessionStorage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

export default function HomeTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking authentication status...');
      
      // First check for persistent session
      const persistentSession = await sessionStorage.getSession();
      
      if (persistentSession) {
        console.log('Found persistent session for:', persistentSession.email);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      
      // Check if we have a stored user session from our bypass login (fallback)
      if (global.currentUserEmail) {
        console.log('Found global session for:', global.currentUserEmail);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      
      // Fallback to Supabase session check
      const { data } = await auth.getCurrentSession();
      
      if (data.session) {
        console.log('Found Supabase session');
        setIsAuthenticated(true);
      } else {
        console.log('No session found, redirecting to login');
        // User is not logged in, redirect to login page
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // Error checking session, redirect to login page
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Navigate back to login page after logout
    router.replace('/login');
  };

  const handleNavigateToDealsRoom = () => {
    // Navigate to deals room tab
    console.log('🚀 Navigating to deals room from home tab...');
    console.log('🔍 Router object:', router);
    
    try {
      router.push('/deals-room');
      console.log('✅ Navigation to deals room executed');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <HomePage 
      onLogout={handleLogout}
      onNavigateToDealsRoom={handleNavigateToDealsRoom}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
