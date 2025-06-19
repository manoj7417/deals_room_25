import RegistrationScreen from '@/components/RegistrationScreen';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterPage() {
  const handleRegistrationComplete = () => {
    // Navigate to login page after successful registration
    router.replace('/login');
  };

  const handleNavigateToLogin = () => {
    // Navigate to login page
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.container}>
        <RegistrationScreen 
          onComplete={handleRegistrationComplete}
          onNavigateToLogin={handleNavigateToLogin}
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