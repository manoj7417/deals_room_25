import { auth, users } from '@/lib';
import { sessionStorage } from '@/lib/sessionStorage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

const { width } = Dimensions.get('window');

// Mock data for ads carousel
const ADS_DATA = [
  {
    id: 1,
    title: "Premium Construction Materials",
    subtitle: "Get 20% off on bulk orders",
    image: "🏗️",
    backgroundColor: "#ff6b6b"
  },
  {
    id: 2,
    title: "Heavy Machinery Rental",
    subtitle: "Professional equipment for your projects",
    image: "🚛",
    backgroundColor: "#4ecdc4"
  },
  {
    id: 3,
    title: "Skilled Workforce Available",
    subtitle: "Connect with certified professionals",
    image: "👷",
    backgroundColor: "#45b7d1"
  },
  {
    id: 4,
    title: "Land Opportunities",
    subtitle: "Prime locations for development",
    image: "🌍",
    backgroundColor: "#96ceb4"
  }
];

// Core features data
const CORE_FEATURES = [
  {
    id: 1,
    title: "Deals Room",
    subtitle: "Explore business opportunities",
    icon: "💼",
    color: "#ff6b6b",
    onPress: () => Alert.alert("Deals Room", "Coming soon!")
  },
  {
    id: 2,
    title: "Announcements",
    subtitle: "Latest updates and news",
    icon: "📢",
    color: "#4ecdc4",
    onPress: () => Alert.alert("Announcements", "Coming soon!")
  }
];

// Additional features data
const ADDITIONAL_FEATURES = [
  {
    id: 1,
    title: "Calculator",
    subtitle: "Quick calculations",
    icon: "🔢",
    color: "#45b7d1",
    onPress: () => Alert.alert("Calculator", "Coming soon!")
  },
  {
    id: 2,
    title: "Calendar",
    subtitle: "Schedule & events",
    icon: "📅",
    color: "#96ceb4",
    onPress: () => Alert.alert("Calendar", "Coming soon!")
  },
  {
    id: 3,
    title: "Time Converter",
    subtitle: "Global time zones",
    icon: "⏰",
    color: "#feca57",
    onPress: () => Alert.alert("Time Converter", "Coming soon!")
  },
  {
    id: 4,
    title: "Currency Converter",
    subtitle: "Exchange rates",
    icon: "💱",
    color: "#ff9ff3",
    onPress: () => Alert.alert("Currency Converter", "Coming soon!")
  }
];

interface HomePageProps {
  onLogout?: () => void;
}

export default function HomePage({ onLogout }: HomePageProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  useEffect(() => {
    loadCurrentUser();
    startAutoSlide();
  }, []);

  const loadCurrentUser = async () => {
    try {
      // First check for persistent session
      const persistentSession = await sessionStorage.getSession();
      
      if (persistentSession) {
        console.log('Found persistent session for:', persistentSession.email);
        // Get user details from our database using persistent session
        const { data: userData } = await users.getByEmail(persistentSession.email);
        setCurrentUser(userData || { 
          name: persistentSession.name || persistentSession.email.split('@')[0],
          email: persistentSession.email 
        });
        return;
      }
      
      // Check if we have a stored user from our bypass login (fallback)
      const storedUserEmail = global.currentUserEmail;
      
      if (storedUserEmail) {
        console.log('Found global session for:', storedUserEmail);
        // Get user details from our database
        const { data: userData } = await users.getByEmail(storedUserEmail);
        setCurrentUser(userData || { name: storedUserEmail.split('@')[0] });
        return;
      }
      
      // Fallback to Supabase auth
      const { data } = await auth.getCurrentUser();
      if (data.user) {
        console.log('Found Supabase session for:', data.user.email);
        const { data: userData } = await users.getByEmail(data.user.email || '');
        setCurrentUser(userData || { name: data.user.email?.split('@')[0] });
      } else {
        console.log('No session found, setting default user');
        setCurrentUser({ name: 'User' });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setCurrentUser({ name: 'User' });
    }
  };

  const startAutoSlide = () => {
    setInterval(() => {
      setCurrentAdIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % ADS_DATA.length;
        carouselRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 3000); // Change slide every 3 seconds
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Clear stored session
            global.currentUserEmail = undefined;
            await auth.signOut();
            onLogout?.();
          }
        }
      ]
    );
  };

  const renderAdItem = ({ item }: { item: typeof ADS_DATA[0] }) => (
    <ThemedView style={[styles.adCard, { backgroundColor: item.backgroundColor }]}>
      <ThemedText style={styles.adIcon}>{item.image}</ThemedText>
      <ThemedText style={styles.adTitle}>{item.title}</ThemedText>
      <ThemedText style={styles.adSubtitle}>{item.subtitle}</ThemedText>
    </ThemedView>
  );

  const renderCoreFeature = ({ item }: { item: typeof CORE_FEATURES[0] }) => (
    <TouchableOpacity 
      style={[styles.featureCard, { backgroundColor: item.color + '20' }]} 
      onPress={item.onPress}
    >
      <ThemedView style={[styles.featureIconContainer, { backgroundColor: item.color }]}>
        <ThemedText style={styles.featureIcon}>{item.icon}</ThemedText>
      </ThemedView>
      <ThemedText style={styles.featureTitle}>{item.title}</ThemedText>
      <ThemedText style={styles.featureSubtitle}>{item.subtitle}</ThemedText>
    </TouchableOpacity>
  );

  const renderAdditionalFeature = ({ item }: { item: typeof ADDITIONAL_FEATURES[0] }) => (
    <TouchableOpacity 
      style={[styles.additionalFeatureCard, { backgroundColor: item.color + '20' }]} 
      onPress={item.onPress}
    >
      <ThemedView style={[styles.additionalFeatureIconContainer, { backgroundColor: item.color }]}>
        <ThemedText style={styles.additionalFeatureIcon}>{item.icon}</ThemedText>
      </ThemedView>
      <ThemedText style={styles.additionalFeatureTitle}>{item.title}</ThemedText>
      <ThemedText style={styles.additionalFeatureSubtitle}>{item.subtitle}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerLeft}>
          <ThemedView style={styles.avatarContainer}>
            <ThemedText style={styles.avatarText}>
              {(currentUser?.name?.charAt(0) || 'U').toUpperCase()}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.greetingContainer}>
            <ThemedText style={styles.greetingText}>
              Hello, {currentUser?.name || 'User'}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        <TouchableOpacity 
          style={styles.notificationButton} 
          onPress={() => Alert.alert('Notifications', 'No new notifications')}
        >
          <ThemedText style={styles.notificationIcon}>🔔</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Hero Section - Ads Carousel */}
      <ThemedView style={styles.heroSection}>
        <ThemedText style={styles.sectionTitle}>Featured Opportunities</ThemedText>
        <FlatList
          ref={carouselRef}
          data={ADS_DATA}
          renderItem={renderAdItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentAdIndex(index);
          }}
        />
        
        {/* Pagination Dots */}
        <ThemedView style={styles.paginationContainer}>
          {ADS_DATA.map((_, index) => (
            <ThemedView
              key={index}
              style={[
                styles.paginationDot,
                index === currentAdIndex && styles.paginationDotActive
              ]}
            />
          ))}
        </ThemedView>
      </ThemedView>

      {/* Core Features Section */}
      <ThemedView style={styles.coreSection}>
        <ThemedText style={styles.sectionTitle}>Core Features</ThemedText>
        <ThemedView style={styles.coreGrid}>
          {CORE_FEATURES.map((feature) => (
            <TouchableOpacity 
              key={feature.id}
              style={[styles.featureCard, { backgroundColor: feature.color + '20' }]} 
              onPress={feature.onPress}
            >
              <ThemedView style={[styles.featureIconContainer, { backgroundColor: feature.color }]}>
                <ThemedText style={styles.featureIcon}>{feature.icon}</ThemedText>
              </ThemedView>
              <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
              <ThemedText style={styles.featureSubtitle}>{feature.subtitle}</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ThemedView>

      {/* Additional Features Section */}
      <ThemedView style={styles.additionalSection}>
        <ThemedText style={styles.sectionTitle}>Additional Tools</ThemedText>
        <ThemedView style={styles.additionalGrid}>
          {ADDITIONAL_FEATURES.map((feature) => (
            <TouchableOpacity 
              key={feature.id}
              style={[styles.additionalFeatureCard, { backgroundColor: feature.color + '20' }]} 
              onPress={feature.onPress}
            >
              <ThemedView style={[styles.additionalFeatureIconContainer, { backgroundColor: feature.color }]}>
                <ThemedText style={styles.additionalFeatureIcon}>{feature.icon}</ThemedText>
              </ThemedView>
              <ThemedText style={styles.additionalFeatureTitle}>{feature.title}</ThemedText>
              <ThemedText style={styles.additionalFeatureSubtitle}>{feature.subtitle}</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 18,
  },
  heroSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  adCard: {
    width: width - 40,
    height: 200,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  adIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  adSubtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#dc3545',
    width: 24,
  },
  coreSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  coreGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 5,
    minHeight: 140,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  additionalSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
    marginBottom: 20,
  },
  additionalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  additionalFeatureCard: {
    width: (width - 50) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 120,
  },
  additionalFeatureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  additionalFeatureIcon: {
    fontSize: 20,
  },
  additionalFeatureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  additionalFeatureSubtitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
}); 