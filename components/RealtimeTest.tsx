import { deals } from '@/lib';
import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function RealtimeTest() {
  const [messages, setMessages] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Load initial messages
    loadMessages();
    
    // Setup realtime subscription
    setupRealtime();
    
    return () => {
      if (subscription) {
        console.log('Cleaning up subscription');
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await deals.getAll();
      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      console.log('Loaded messages:', data?.length);
      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const setupRealtime = () => {
    console.log('🚀 Setting up realtime test subscription...');
    
    const channel = supabase
      .channel('realtime-test-' + Date.now())
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'deals' 
        },
        (payload) => {
          console.log('🎉 REALTIME EVENT RECEIVED:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('New message via realtime:', payload.new);
            setMessages(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully connected to realtime');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to connect to realtime');
        }
      });

    setSubscription(channel);
  };

  const sendTestMessage = async () => {
    const testMessage = {
      title: 'Test Message',
      description: `Realtime test at ${new Date().toLocaleTimeString()}`,
      category: 'general',
      status: 'active',
      sender_id: 1 // Use a test sender ID
    };

    console.log('Sending test message:', testMessage);

    try {
      const { data, error } = await deals.create(testMessage);
      
      if (error) {
        console.error('Error creating message:', error);
        Alert.alert('Error', JSON.stringify(error));
        return;
      }

      console.log('Message created:', data);
      Alert.alert('Success', 'Message sent! Check if it appears in realtime.');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const refreshMessages = () => {
    console.log('Refreshing messages...');
    loadMessages();
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: 'white' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Realtime Test
      </Text>
      
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <View style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: isConnected ? 'green' : 'red',
          marginRight: 8,
          marginTop: 4
        }} />
        <Text>{isConnected ? 'Connected to Realtime' : 'Not Connected'}</Text>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <TouchableOpacity
          onPress={sendTestMessage}
          style={{
            backgroundColor: '#6366f1',
            padding: 12,
            borderRadius: 8,
            marginRight: 10
          }}
        >
          <Text style={{ color: 'white' }}>Send Test Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={refreshMessages}
          style={{
            backgroundColor: '#10b981',
            padding: 12,
            borderRadius: 8
          }}
        >
          <Text style={{ color: 'white' }}>Refresh ({messages.length})</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
        Messages ({messages.length}):
      </Text>

      <ScrollView style={{ flex: 1 }}>
        {messages.slice(-10).reverse().map((message, index) => (
          <View key={message.id || index} style={{
            padding: 12,
            backgroundColor: '#f3f4f6',
            marginBottom: 8,
            borderRadius: 8
          }}>
            <Text style={{ fontSize: 12, color: '#666' }}>
              ID: {message.id} | Sender: {message.sender_id}
            </Text>
            <Text style={{ fontWeight: 'bold' }}>{message.title}</Text>
            <Text>{message.description}</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {new Date(message.created_at).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
} 