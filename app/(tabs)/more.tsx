import RealtimeTest from '@/components/RealtimeTest';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, users } from '@/lib';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const MORE_OPTIONS = [
  {
    id: 1,
    title: 'Profile Settings',
    subtitle: 'Update your personal information',
    icon: '👤',
    category: 'account',
    onPress: () => Alert.alert('Coming Soon', 'Profile settings will be available soon!')
  },
  {
    id: 2,
    title: 'Business Verification',
    subtitle: 'Verify your business for more features',
    icon: '✅',
    category: 'account',
    onPress: () => Alert.alert('Coming Soon', 'Business verification will be available soon!')
  },
  {
    id: 3,
    title: 'Payment Methods',
    subtitle: 'Manage your payment options',
    icon: '💳',
    category: 'financial',
    onPress: () => Alert.alert('Coming Soon', 'Payment methods will be available soon!')
  },
  {
    id: 4,
    title: 'Transaction History',
    subtitle: 'View all your transactions',
    icon: '📊',
    category: 'financial',
    onPress: () => Alert.alert('Coming Soon', 'Transaction history will be available soon!')
  },
  {
    id: 5,
    title: 'Calculator',
    subtitle: 'Quick calculations for deals',
    icon: '🔢',
    category: 'tools',
    onPress: () => Alert.alert('Calculator', 'Basic calculator feature coming soon!')
  },
  {
    id: 6,
    title: 'Calendar',
    subtitle: 'Schedule meetings and events',
    icon: '📅',
    category: 'tools',
    onPress: () => Alert.alert('Calendar', 'Calendar feature coming soon!')
  },
  {
    id: 7,
    title: 'Currency Converter',
    subtitle: 'Convert between currencies',
    icon: '💱',
    category: 'tools',
    onPress: () => Alert.alert('Currency Converter', 'Currency converter coming soon!')
  },
  {
    id: 8,
    title: 'Notifications',
    subtitle: 'Manage your notification preferences',
    icon: '🔔',
    category: 'settings',
    onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon!')
  },
  {
    id: 9,
    title: 'Help & Support',
    subtitle: 'Get help and contact support',
    icon: '❓',
    category: 'settings',
    onPress: () => Alert.alert('Help & Support', 'Contact support at support@dealsroom.com')
  },
  {
    id: 10,
    title: 'About',
    subtitle: 'App version and information',
    icon: 'ℹ️',
    category: 'settings',
    onPress: () => Alert.alert('About', 'Deals Room v1.0.0\nBuilt for construction professionals')
  }
];

const CATEGORIES = [
  { key: 'account', title: 'Account' },
  { key: 'financial', title: 'Financial' },
  { key: 'tools', title: 'Tools' },
  { key: 'settings', title: 'Settings' }
];

export default function MoreTab() {
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showRealtimeTest, setShowRealtimeTest] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    loadCurrentUser();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (!global.currentUserEmail) {
        const { data } = await auth.getCurrentSession();
        if (!data.session) {
          router.replace('/login');
          return;
        }
      }
    } catch (error) {
      router.replace('/login');
    }
  };

  const loadCurrentUser = async () => {
    try {
      if (global.currentUserEmail) {
        const { data: userData } = await users.getByEmail(global.currentUserEmail);
        setCurrentUser(userData || { name: global.currentUserEmail.split('@')[0] });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setCurrentUser({ name: 'User' });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCurrentUser();
    setRefreshing(false);
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
            global.currentUserEmail = undefined;
            await auth.signOut();
            router.replace('/login');
          }
        }
      ]
    );
  };

  // Show realtime test if requested
  if (showRealtimeTest) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity 
            onPress={() => setShowRealtimeTest(false)}
            style={styles.backButton}
          >
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        <RealtimeTest />
      </ThemedView>
    );
  }

  const renderCategorySection = (category: any) => {
    const categoryOptions = MORE_OPTIONS.filter(option => option.category === category.key);
    
    return (
      <ThemedView key={category.key} style={styles.categorySection}>
        <ThemedText style={styles.categoryTitle}>{category.title}</ThemedText>
        <ThemedView style={styles.optionsContainer}>
          {categoryOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <ThemedView style={styles.optionLeft}>
                <ThemedView style={styles.optionIcon}>
                  <ThemedText style={styles.optionIconText}>{option.icon}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.optionInfo}>
                  <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                  <ThemedText style={styles.optionSubtitle}>{option.subtitle}</ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedText style={styles.chevron}>›</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView>
          <ThemedText style={styles.headerTitle}>More</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Settings and tools</ThemedText>
        </ThemedView>
        {/* <TouchableOpacity
          onPress={() => setShowRealtimeTest(true)}
          style={styles.debugButton}
        >
          <ThemedText style={styles.debugButtonText}>🧪 RT Test</ThemedText>
        </TouchableOpacity> */}
      </ThemedView>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <ThemedView style={styles.userCard}>
          <ThemedView style={styles.userAvatar}>
            <ThemedText style={styles.userAvatarText}>
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.userInfo}>
            <ThemedText style={styles.userName}>
              {currentUser?.name || 'User'}
            </ThemedText>
            <ThemedText style={styles.userEmail}>
              {global.currentUserEmail || 'user@example.com'}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Options by Category */}
        {CATEGORIES.map(renderCategorySection)}

        {/* Logout Button */}
        <ThemedView style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <ThemedText style={styles.logoutText}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Footer Space */}
        <ThemedView style={styles.footer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  editProfileButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editProfileText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginBottom: 12,
  },
  optionsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconText: {
    fontSize: 18,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  chevron: {
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  logoutSection: {
    margin: 20,
    marginTop: 0,
  },
  logoutButton: {
    // backgroundColor: '#ef4444',
    backgroundColor : 'rgba(99, 102, 241, 1.00)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    color : 'white',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  versionSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    height: 20,
  },
  debugButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    position: 'absolute',
    top: 20,
    right: 20,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    position: 'absolute',
    top: 20,
    left: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 