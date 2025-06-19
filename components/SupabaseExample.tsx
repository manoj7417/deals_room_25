import { auth, database } from '@/lib';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface SupabaseExampleProps {
  tableName?: string;
}

export default function SupabaseExample({ tableName = 'your_table_name' }: SupabaseExampleProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check current user session
    checkUser();
    
    // Listen to auth changes
    const { data: authListener } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await auth.getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: fetchedData, error } = await database.getAllRecords(tableName);
      
      if (error) {
        Alert.alert('Error', error.message);
        console.error('Error fetching data:', error);
      } else {
        setData(fetchedData || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data from database');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInAnonymously = async () => {
    try {
      // This is just an example - replace with your preferred authentication method
      const { data, error } = await auth.signIn('test@example.com', 'password');
      
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
        setData([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
      console.error('Error:', error);
    }
  };

  const renderDataItem = ({ item, index }: { item: any; index: number }) => (
    <ThemedView style={styles.dataItem}>
      <ThemedText type="defaultSemiBold">Item {index + 1}</ThemedText>
      <ThemedText>{JSON.stringify(item, null, 2)}</ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Supabase Integration</ThemedText>
      
      {/* Authentication Status */}
      <ThemedView style={styles.authSection}>
        <ThemedText type="defaultSemiBold">
          Authentication Status: {user ? 'Signed In' : 'Not Signed In'}
        </ThemedText>
        {user && (
          <ThemedText>User ID: {user.id}</ThemedText>
        )}
      </ThemedView>

      {/* Action Buttons */}
      <ThemedView style={styles.buttonContainer}>
        {!user ? (
          <TouchableOpacity style={styles.button} onPress={signInAnonymously}>
            <ThemedText style={styles.buttonText}>Sign In (Test)</ThemedText>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={fetchData} disabled={loading}>
              <ThemedText style={styles.buttonText}>
                {loading ? 'Loading...' : `Fetch Data from ${tableName}`}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.signOutButton]} onPress={signOut}>
              <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>

      {/* Loading Indicator */}
      {loading && <ActivityIndicator size="large" style={styles.loader} />}

      {/* Data Display */}
      {data.length > 0 && (
        <ThemedView style={styles.dataContainer}>
          <ThemedText type="defaultSemiBold">Data from {tableName}:</ThemedText>
          <FlatList
            data={data}
            renderItem={renderDataItem}
            keyExtractor={(item, index) => `${index}`}
            style={styles.dataList}
          />
        </ThemedView>
      )}

      {/* Instructions */}
      <ThemedView style={styles.instructions}>
        <ThemedText type="defaultSemiBold">Instructions:</ThemedText>
        <ThemedText>1. Update your .env file with Supabase credentials</ThemedText>
        <ThemedText>2. Replace 'your_table_name' with your actual table name</ThemedText>
        <ThemedText>3. Update authentication method as needed</ThemedText>
        <ThemedText>4. Customize the data display for your use case</ThemedText>
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
  dataContainer: {
    gap: 8,
  },
  dataList: {
    maxHeight: 200,
  },
  dataItem: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginVertical: 2,
  },
  instructions: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    gap: 4,
  },
}); 