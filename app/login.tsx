import LoginScreen from '@/components/LoginScreen';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginPage() {
  const handleLoginSuccess = () => {
    console.log('handleLoginSuccess called, navigating to /(tabs)');
    // Navigate to tabs (home tab) after successful login
    router.replace('/(tabs)');
  };

  const handleNavigateToRegister = () => {
    // Navigate to register page
    router.push('/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.container}>
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={handleNavigateToRegister}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 