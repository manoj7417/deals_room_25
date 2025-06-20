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

  const handleNavigateToDealsRoom = () => {
    // Navigate to deals room page
    console.log('🚀 Navigating to deals room from home page...');
    console.log('🔍 Router object:', router);
    
    try {
      router.push('/(tabs)/deals-room');
      console.log('✅ Navigation command executed');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Fallback navigation methods
      try {
        router.replace('/(tabs)/deals-room');
        console.log('✅ Fallback replace navigation executed');
      } catch (replaceError) {
        console.error('❌ Replace navigation error:', replaceError);
        // Try direct navigation without tabs
        try {
          router.push('/deals-room');
          console.log('✅ Direct navigation executed');
        } catch (directError) {
          console.error('❌ Direct navigation error:', directError);
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.container}>
        <HomePage 
          onLogout={handleLogout}
          onNavigateToDealsRoom={handleNavigateToDealsRoom}
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