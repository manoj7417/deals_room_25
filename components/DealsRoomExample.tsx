import type { Announcement, Deal, Notification, Product, Tender } from '@/lib';
import { announcements, auth, deals, products, tenders } from '@/lib';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export default function DealsRoomExample() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'deals' | 'announcements' | 'products' | 'tenders' | 'notifications'>('deals');
  
  // Data states
  const [dealsData, setDealsData] = useState<Deal[]>([]);
  const [announcementsData, setAnnouncementsData] = useState<Announcement[]>([]);
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [tendersData, setTendersData] = useState<Tender[]>([]);
  const [notificationsData, setNotificationsData] = useState<Notification[]>([]);

  useEffect(() => {
    checkUser();
    
    // Listen to auth changes
    const { data: authListener } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadData();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await auth.getCurrentUser();
      setUser(user);
      if (user) {
        loadData();
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [dealsResult, announcementsResult, productsResult, tendersResult] = await Promise.all([
        deals.getActive(),
        announcements.getActive(),
        products.getActive(),
        tenders.getActive(),
      ]);

      if (dealsResult.data) setDealsData(dealsResult.data);
      if (announcementsResult.data) setAnnouncementsData(announcementsResult.data);
      if (productsResult.data) setProductsData(productsResult.data);
      if (tendersResult.data) setTendersData(tendersResult.data);

    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithTest = async () => {
    try {
      // Replace with your test credentials or implement proper auth
      const { data, error } = await auth.signIn('test@dealsroom.com', 'password123');
      
      if (error) {
        Alert.alert('Authentication Error', error.message);
      } else {
        Alert.alert('Success', 'Signed in successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in');
      console.error('Error:', error);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await auth.signOut();
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Signed out successfully!');
        // Clear data
        setDealsData([]);
        setAnnouncementsData([]);
        setProductsData([]);
        setTendersData([]);
        setNotificationsData([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
      console.error('Error:', error);
    }
  };

  const renderTabButton = (tabName: typeof activeTab, title: string, count: number) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabName && styles.activeTab]}
      onPress={() => setActiveTab(tabName)}
    >
      <ThemedText style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
        {title} ({count})
      </ThemedText>
    </TouchableOpacity>
  );

  const renderDeals = () => (
    <ThemedView style={styles.dataContainer}>
      <ThemedText type="defaultSemiBold">Active Deals</ThemedText>
      {dealsData.length === 0 ? (
        <ThemedText>No active deals found</ThemedText>
      ) : (
        dealsData.slice(0, 5).map((deal) => (
          <ThemedView key={deal.id} style={styles.dataItem}>
            <ThemedText type="defaultSemiBold">{deal.title}</ThemedText>
            <ThemedText>{deal.description}</ThemedText>
            <ThemedText style={styles.metaText}>Category: {deal.category}</ThemedText>
            <ThemedText style={styles.metaText}>Status: {deal.status}</ThemedText>
          </ThemedView>
        ))
      )}
    </ThemedView>
  );

  const renderAnnouncements = () => (
    <ThemedView style={styles.dataContainer}>
      <ThemedText type="defaultSemiBold">Active Announcements</ThemedText>
      {announcementsData.length === 0 ? (
        <ThemedText>No active announcements found</ThemedText>
      ) : (
        announcementsData.slice(0, 5).map((announcement) => (
          <ThemedView key={announcement.id} style={styles.dataItem}>
            <ThemedText type="defaultSemiBold">{announcement.title}</ThemedText>
            <ThemedText>{announcement.description}</ThemedText>
            <ThemedText style={styles.metaText}>Category: {announcement.category}</ThemedText>
            <ThemedText style={styles.metaText}>Type: {announcement.ad_type}</ThemedText>
          </ThemedView>
        ))
      )}
    </ThemedView>
  );

  const renderProducts = () => (
    <ThemedView style={styles.dataContainer}>
      <ThemedText type="defaultSemiBold">Available Products</ThemedText>
      {productsData.length === 0 ? (
        <ThemedText>No products found</ThemedText>
      ) : (
        productsData.slice(0, 5).map((product) => (
          <ThemedView key={product.id} style={styles.dataItem}>
            <ThemedText type="defaultSemiBold">{product.name}</ThemedText>
            <ThemedText>{product.description}</ThemedText>
            <ThemedText style={styles.metaText}>Price: ₹{product.price}</ThemedText>
            <ThemedText style={styles.metaText}>Category: {product.category}</ThemedText>
            {product.brand_name && (
              <ThemedText style={styles.metaText}>Brand: {product.brand_name}</ThemedText>
            )}
          </ThemedView>
        ))
      )}
    </ThemedView>
  );

  const renderTenders = () => (
    <ThemedView style={styles.dataContainer}>
      <ThemedText type="defaultSemiBold">Active Tenders</ThemedText>
      {tendersData.length === 0 ? (
        <ThemedText>No active tenders found</ThemedText>
      ) : (
        tendersData.slice(0, 5).map((tender) => (
          <ThemedView key={tender.id} style={styles.dataItem}>
            <ThemedText type="defaultSemiBold">{tender.tender_name}</ThemedText>
            <ThemedText>{tender.scope}</ThemedText>
            <ThemedText style={styles.metaText}>Value: ₹{tender.estimated_value}</ThemedText>
            <ThemedText style={styles.metaText}>Category: {tender.engineering_category}</ThemedText>
            <ThemedText style={styles.metaText}>Location: {tender.location}</ThemedText>
          </ThemedView>
        ))
      )}
    </ThemedView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'deals':
        return renderDeals();
      case 'announcements':
        return renderAnnouncements();
      case 'products':
        return renderProducts();
      case 'tenders':
        return renderTenders();
      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Deals Room - Database Integration</ThemedText>
      
      {/* Authentication Status */}
      <ThemedView style={styles.authSection}>
        <ThemedText type="defaultSemiBold">
          Status: {user ? 'Connected to Database' : 'Not Connected'}
        </ThemedText>
        {user && (
          <ThemedText>User: {user.email}</ThemedText>
        )}
      </ThemedView>

      {/* Action Buttons */}
      <ThemedView style={styles.buttonContainer}>
        {!user ? (
          <TouchableOpacity style={styles.button} onPress={signInWithTest}>
            <ThemedText style={styles.buttonText}>Connect to Database</ThemedText>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={loadData} disabled={loading}>
              <ThemedText style={styles.buttonText}>
                {loading ? 'Loading...' : 'Refresh Data'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.signOutButton]} onPress={signOut}>
              <ThemedText style={styles.buttonText}>Disconnect</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>

      {/* Loading Indicator */}
      {loading && <ActivityIndicator size="large" style={styles.loader} />}

      {/* Data Tabs */}
      {user && !loading && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
            {renderTabButton('deals', 'Deals', dealsData.length)}
            {renderTabButton('announcements', 'Announcements', announcementsData.length)}
            {renderTabButton('products', 'Products', productsData.length)}
            {renderTabButton('tenders', 'Tenders', tendersData.length)}
          </ScrollView>

          <ScrollView style={styles.contentContainer}>
            {renderContent()}
          </ScrollView>
        </>
      )}

      {/* Instructions */}
      <ThemedView style={styles.instructions}>
        <ThemedText type="defaultSemiBold">Your Database Schema Includes:</ThemedText>
        <ThemedText>• Users & Sellers management</ThemedText>
        <ThemedText>• Deals & Direct Messages</ThemedText>
        <ThemedText>• Announcements & Products</ThemedText>
        <ThemedText>• Tenders & Land Listings</ThemedText>
        <ThemedText>• Machines, Materials & Jobs</ThemedText>
        <ThemedText>• Notifications & Audit Logs</ThemedText>
        <ThemedText style={styles.noteText}>
          Configure your .env file with Supabase credentials to connect.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  authSection: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  tabButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
  },
  contentContainer: {
    maxHeight: 300,
  },
  dataContainer: {
    gap: 8,
  },
  dataItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginVertical: 4,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.7,
  },
  instructions: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    gap: 4,
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
}); 