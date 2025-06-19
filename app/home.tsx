import HomePage from '@/components/HomePage';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  const handleLogout = () => {
    // Navigate back to login page after logout
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.container}>
        <HomePage onLogout={handleLogout} />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 