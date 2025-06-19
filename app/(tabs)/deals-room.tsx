import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, deals, dms, users } from '@/lib';
import { sessionStorage } from '@/lib/sessionStorage';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';

const { width } = Dimensions.get('window');

export default function DealsRoomTab() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'public' | 'dm'>('public');
  const [refreshing, setRefreshing] = useState(false);
  
  // Public Chat State
  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageCategory, setMessageCategory] = useState('general');
  
  // DM State
  const [dmConversations, setDmConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [newDmMessage, setNewDmMessage] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // User mapping for quick lookup
  const [userMap, setUserMap] = useState<{[key: number]: any}>({});
  
  // Refs
  const publicChatRef = useRef<FlatList>(null);
  const dmChatRef = useRef<FlatList>(null);
  
  // Channel refs for cleanup
  const publicChannelRef = useRef<any>(null);
  const dmChannelRef = useRef<any>(null);

  useEffect(() => {
    checkAuthStatus();
    loadCurrentUser();
    loadAllUsers();
    
    return () => {
      // Cleanup subscriptions properly
      console.log('🧹 Cleaning up subscriptions on unmount');
      if (publicChannelRef.current) {
        console.log('Removing public channel on unmount');
        supabase.removeChannel(publicChannelRef.current);
        publicChannelRef.current = null;
      }
      if (dmChannelRef.current) {
        console.log('Removing DM channel on unmount');
        supabase.removeChannel(dmChannelRef.current);
        dmChannelRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log('🔄 Dependencies changed:', { 
      hasCurrentUser: !!currentUser, 
      usersCount: allUsers.length,
      currentUserName: currentUser?.name 
    });
    
    if (currentUser && allUsers.length > 0) {
      console.log('✅ All dependencies ready, loading data and setting up realtime...');
      loadPublicMessages();
      loadDMConversations();
      
      // Add a small delay to ensure everything is loaded
      setTimeout(() => {
        setupRealtimeSubscriptions();
      }, 1000);
    } else {
      console.log('⏳ Waiting for dependencies...', {
        currentUser: currentUser?.name || 'none',
        usersCount: allUsers.length
      });
    }
  }, [currentUser, allUsers]);

  // Test function to verify connectivity
  const testRealtimeConnection = async () => {
    console.log('=== TESTING REALTIME CONNECTION ===');
    console.log('Current state:', {
      currentUser: currentUser?.name,
      publicChannelExists: !!publicChannelRef.current,
      dmChannelExists: !!dmChannelRef.current,
      publicMessagesCount: publicMessages.length
    });
    
    // Test basic database connection
    try {
      console.log('Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('deals')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('❌ Database connection failed:', testError);
        Alert.alert('Database Error', JSON.stringify(testError));
        return;
      }
      
      console.log('✅ Database connection successful, sample data:', testData);
    } catch (error) {
      console.error('❌ Database connection error:', error);
      Alert.alert('Connection Error', error.message);
      return;
    }
    
    // Test Supabase realtime status
    console.log('Checking Supabase realtime status...');
    const channels = supabase.getChannels();
    console.log('Active channels:', channels.map(ch => ch.topic));
    
    // Force reload subscriptions
    console.log('🔄 Forcing subscription reload...');
    setupRealtimeSubscriptions();
    
    // Test creating a sample message
    if (!currentUser) {
      Alert.alert('Error', 'No current user found');
      return;
    }
    
    try {
      const testMessage = {
        title: `🧪 Test message from ${currentUser.name}`,
        description: `Realtime test at ${new Date().toLocaleTimeString()} - If you see this instantly, realtime works!`,
        category: 'general',
        status: 'active',
        sender_id: currentUser.id
      };
      
      console.log('Creating test message:', testMessage);
      
      const { data, error } = await deals.create(testMessage);
      
      if (error) {
        console.error('❌ Test message creation failed:', error);
        Alert.alert('Message Creation Error', JSON.stringify(error));
        return;
      }
      
      console.log('✅ Test message created successfully:', data);
      Alert.alert('Success', 'Test message created! Watch for real-time update...');
      
    } catch (error) {
      console.error('❌ Test message error:', error);
      Alert.alert('Test Error', error.message);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const persistentSession = await sessionStorage.getSession();
      if (!persistentSession && !global.currentUserEmail) {
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
      const persistentSession = await sessionStorage.getSession();
      if (persistentSession) {
        const { data: userData } = await users.getByEmail(persistentSession.email);
        setCurrentUser(userData);
      } else if (global.currentUserEmail) {
        const { data: userData } = await users.getByEmail(global.currentUserEmail);
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data: usersData } = await users.getAll();
      if (usersData) {
        setAllUsers(usersData);
        
        // Create user mapping for quick lookup
        const mapping: {[key: number]: any} = {};
        usersData.forEach(user => {
          mapping[user.id] = user;
        });
        setUserMap(mapping);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadPublicMessages = async () => {
    try {
      const { data: messagesData } = await deals.getAll();
      if (messagesData) {
        const sortedMessages = messagesData.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setPublicMessages(sortedMessages);
      }
    } catch (error) {
      console.error('Error loading public messages:', error);
    }
  };

  const loadDMConversations = async () => {
    try {
      if (!currentUser) return;
      
      const { data: dmData } = await dms.getAll();
      if (dmData) {
        const userDMs = dmData.filter(dm => 
          dm.sender_id === currentUser.id || dm.receiver_id === currentUser.id
        );
        
        const conversations = {};
        userDMs.forEach(dm => {
          const partnerId = dm.sender_id === currentUser.id ? dm.receiver_id : dm.sender_id;
          if (!conversations[partnerId]) {
            conversations[partnerId] = {
              partnerId,
              partnerName: 'Unknown User',
              lastMessage: dm.message,
              lastMessageTime: dm.created_at,
              unreadCount: 0,
              messages: []
            };
          }
          conversations[partnerId].messages.push(dm);
          
          if (!dm.is_read && dm.receiver_id === currentUser.id) {
            conversations[partnerId].unreadCount++;
          }
          
          if (new Date(dm.created_at) > new Date(conversations[partnerId].lastMessageTime)) {
            conversations[partnerId].lastMessage = dm.message;
            conversations[partnerId].lastMessageTime = dm.created_at;
          }
        });
        
        const conversationList = await Promise.all(
          Object.values(conversations).map(async (conv: any) => {
            const { data: partnerData } = await users.getById(conv.partnerId);
            return {
              ...conv,
              partnerName: partnerData?.name || 'Unknown User'
            };
          })
        );
        
        setDmConversations(conversationList.sort((a, b) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading DM conversations:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    console.log('🚀 Setting up realtime subscriptions...');
    console.log('Current user:', currentUser?.name);
    console.log('User map size:', Object.keys(userMap).length);
    
    // Clean up existing subscriptions first
    if (publicChannelRef.current) {
      console.log('🧹 Removing existing public channel');
      try {
        supabase.removeChannel(publicChannelRef.current);
      } catch (error) {
        console.error('Error removing public channel:', error);
      }
      publicChannelRef.current = null;
    }
    
    if (dmChannelRef.current) {
      console.log('🧹 Removing existing DM channel');
      try {
        supabase.removeChannel(dmChannelRef.current);
      } catch (error) {
        console.error('Error removing DM channel:', error);
      }
      dmChannelRef.current = null;
    }

    // Create unique channel name
    const timestamp = Date.now();
    const publicChannelName = `public-messages-${currentUser?.id}-${timestamp}`;
    const dmChannelName = `direct-messages-${currentUser?.id}-${timestamp}`;

    console.log(`📡 Creating public channel: ${publicChannelName}`);
    
    // Subscribe to public messages (deals table)
    publicChannelRef.current = supabase
      .channel(publicChannelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'deals' 
        },
        (payload) => {
          console.log('🎉 === PUBLIC MESSAGE RECEIVED ===');
          console.log('Event type:', payload.eventType);
          console.log('Table:', payload.table);
          console.log('Full payload:', JSON.stringify(payload, null, 2));
          
          const newMessage = payload.new;
          console.log('New message data:', newMessage);
          
          // Add user info to the message
          const senderName = userMap[newMessage.sender_id]?.name || 'Unknown User';
          const messageWithUser = {
            ...newMessage,
            senderName
          };
          
          console.log('Message with user info:', messageWithUser);
          console.log('Sender name resolved to:', senderName);
          
          setPublicMessages(prev => {
            console.log('📝 Current messages count:', prev.length);
            
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            console.log('Message already exists?', exists);
            
            if (exists) {
              console.log('⚠️ Duplicate message detected, skipping');
              return prev;
            }
            
            const newMessages = [...prev, messageWithUser];
            console.log('📈 New messages count:', newMessages.length);
            console.log('📋 Updated messages list:', newMessages.map(m => ({ id: m.id, desc: m.description.substring(0, 30) })));
            
            return newMessages;
          });
          
          // Scroll to bottom when new message arrives
          setTimeout(() => {
            console.log('📜 Scrolling to end...');
            publicChatRef.current?.scrollToEnd({ animated: true });
          }, 200);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Public channel (${publicChannelName}) status:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to public messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to public messages');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Timeout subscribing to public messages');
        } else if (status === 'CLOSED') {
          console.log('🔒 Public channel subscription closed');
        }
      });

    console.log(`📱 Creating DM channel: ${dmChannelName}`);
    
    // Subscribe to DMs
    dmChannelRef.current = supabase
      .channel(dmChannelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'dms' 
        },
        (payload) => {
          console.log('💬 === DM RECEIVED ===');
          console.log('DM payload:', JSON.stringify(payload, null, 2));
          const newDM = payload.new;
          
          // If it's for current conversation, add to messages
          if (selectedConversation && 
              ((newDM.sender_id === currentUser?.id && newDM.receiver_id === selectedConversation.partnerId) ||
               (newDM.sender_id === selectedConversation.partnerId && newDM.receiver_id === currentUser?.id))) {
            
            console.log('💬 DM is for current conversation, adding to messages');
            setDmMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === newDM.id);
              if (exists) return prev;
              
              return [...prev, newDM];
            });
            
            // Scroll to bottom when new message arrives
            setTimeout(() => {
              dmChatRef.current?.scrollToEnd({ animated: true });
            }, 100);
          } else {
            console.log('💬 DM not for current conversation or no conversation selected');
          }
          
          // Reload conversations to update counts and last messages
          loadDMConversations();
        }
      )
      .subscribe((status) => {
        console.log(`📱 DM channel (${dmChannelName}) status:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to DMs');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to DMs');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Timeout subscribing to DMs');
        } else if (status === 'CLOSED') {
          console.log('🔒 DM channel subscription closed');
        }
      });
      
    // Log final state
    setTimeout(() => {
      const channels = supabase.getChannels();
      console.log('🏁 Final subscription state:');
      console.log('Active channels:', channels.map(ch => ({ topic: ch.topic, state: ch.state })));
      console.log('Public channel ref exists:', !!publicChannelRef.current);
      console.log('DM channel ref exists:', !!dmChannelRef.current);
    }, 2000);
  };

  const sendPublicMessage = async () => {
    if (!newMessage.trim() || !currentUser) {
      console.log('Cannot send message - missing message or user:', { 
        messageLength: newMessage.trim().length, 
        hasUser: !!currentUser 
      });
      return;
    }
    
    console.log('Sending public message:', {
      message: newMessage,
      user: currentUser.name,
      userId: currentUser.id
    });
    
    try {
      const messageData = {
        title: `${currentUser.name}: ${newMessage.substring(0, 50)}...`,
        description: newMessage,
        category: 'general',
        status: 'active',
        sender_id: currentUser.id
      };
      
      console.log('Message data to send:', messageData);
      
      const { data, error } = await deals.create(messageData);
      
      if (error) {
        console.error('Error creating deal:', error);
        Alert.alert('Error', 'Failed to send message: ' + JSON.stringify(error));
        return;
      }
      
      console.log('✅ Message sent successfully:', data);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending public message:', error);
      Alert.alert('Error', 'Failed to send message: ' + error.message);
    }
  };

  const sendDirectMessage = async () => {
    if (!newDmMessage.trim() || !currentUser || !selectedConversation) return;
    
    try {
      const { data, error } = await dms.create({
        message: newDmMessage,
        sender_id: currentUser.id,
        receiver_id: selectedConversation.partnerId,
        is_read: false
      });
      
      if (error) {
        console.error('Error creating DM:', error);
        Alert.alert('Error', 'Failed to send message');
        return;
      }
      
      console.log('DM sent successfully:', data);
      setNewDmMessage('');
    } catch (error) {
      console.error('Error sending DM:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const startNewConversation = (user: any) => {
    setSelectedConversation({
      partnerId: user.id,
      partnerName: user.name,
      messages: []
    });
    setDmMessages([]);
    setActiveTab('dm');
  };

  const openConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    
    try {
      const { data: dmData } = await dms.getAll();
      if (dmData) {
        const conversationMessages = dmData.filter(dm =>
          (dm.sender_id === currentUser.id && dm.receiver_id === conversation.partnerId) ||
          (dm.sender_id === conversation.partnerId && dm.receiver_id === currentUser.id)
        ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        setDmMessages(conversationMessages);
        
        for (const message of conversationMessages) {
          if (!message.is_read && message.receiver_id === currentUser.id) {
            await dms.update(message.id, { is_read: true });
          }
        }
        
        loadDMConversations();
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadPublicMessages(),
      loadDMConversations(),
      loadAllUsers()
    ]);
    setRefreshing(false);
  };

  const getSenderName = (senderId: number) => {
    return userMap[senderId]?.name || 'Unknown User';
  };

  const renderPublicMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.sender_id === currentUser?.id;
    const senderName = isOwnMessage ? 'You' : getSenderName(item.sender_id);
    
    return (
      <ThemedView style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}>
        <ThemedView style={styles.messageHeader}>
          <ThemedText style={styles.senderName}>
            {senderName}
          </ThemedText>
          <ThemedText style={styles.messageTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </ThemedView>
        <ThemedText style={styles.messageText}>{item.description}</ThemedText>
        <ThemedView style={styles.categoryBadge}>
          <ThemedText style={styles.categoryText}>{item.category}</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  };

  const renderDMMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.sender_id === currentUser?.id;
    
    return (
      <ThemedView style={[styles.dmMessageContainer, isOwnMessage && styles.ownDmMessage]}>
        <ThemedText style={[styles.dmMessageText, isOwnMessage && styles.ownDmMessageText]}>
          {item.message}
        </ThemedText>
        <ThemedText style={[styles.dmMessageTime, isOwnMessage && styles.ownDmMessageTime]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </ThemedView>
    );
  };

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => openConversation(item)}
    >
      <ThemedView style={styles.conversationLeft}>
        <ThemedView style={styles.conversationAvatar}>
          <ThemedText style={styles.conversationAvatarText}>
            {item.partnerName.charAt(0).toUpperCase()}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.conversationInfo}>
          <ThemedText style={styles.conversationName}>{item.partnerName}</ThemedText>
          <ThemedText style={styles.conversationLastMessage} numberOfLines={1}>
            {item.lastMessage}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView style={styles.conversationRight}>
        <ThemedText style={styles.conversationTime}>
          {new Date(item.lastMessageTime).toLocaleDateString()}
        </ThemedText>
        {item.unreadCount > 0 && (
          <ThemedView style={styles.unreadBadge}>
            <ThemedText style={styles.unreadText}>{item.unreadCount}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </TouchableOpacity>
  );

  const renderUser = ({ item }: { item: any }) => {
    if (item.id === currentUser?.id) return null;
    
    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => startNewConversation(item)}
      >
        <ThemedView style={styles.userAvatar}>
          <ThemedText style={styles.userAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </ThemedText>
        </ThemedView>
        <ThemedText style={styles.userName}>{item.name}</ThemedText>
      </TouchableOpacity>
    );
  };

  // DM Chat View
  if (selectedConversation && activeTab === 'dm') {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={styles.dmHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <ThemedText style={styles.backButtonText}>←</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.dmHeaderTitle}>{selectedConversation.partnerName}</ThemedText>
        </ThemedView>

        <FlatList
          ref={dmChatRef}
          data={dmMessages}
          renderItem={renderDMMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.dmMessagesList}
          onContentSizeChange={() => dmChatRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => dmChatRef.current?.scrollToEnd({ animated: false })}
        />

        <ThemedView style={styles.dmInputContainer}>
          <TextInput
            style={styles.dmInput}
            value={newDmMessage}
            onChangeText={setNewDmMessage}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity style={styles.dmSendButton} onPress={sendDirectMessage}>
            <ThemedText style={styles.dmSendButtonText}>Send</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerTop}>
          <ThemedText style={styles.headerTitle}>Deals Room</ThemedText>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={testRealtimeConnection}
          >
            <ThemedText style={styles.testButtonText}>Test RT</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        <ThemedView style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'public' && styles.activeTab]}
            onPress={() => setActiveTab('public')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>
              Public Chat
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dm' && styles.activeTab]}
            onPress={() => setActiveTab('dm')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'dm' && styles.activeTabText]}>
              Direct Messages
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {activeTab === 'public' ? (
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <FlatList
            ref={publicChatRef}
            data={publicMessages}
            renderItem={renderPublicMessage}
            keyExtractor={(item) => item.id.toString()}
            style={styles.messagesList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onContentSizeChange={() => publicChatRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => publicChatRef.current?.scrollToEnd({ animated: false })}
          />

          <ThemedView style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Share a deal or announcement..."
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendPublicMessage}>
              <ThemedText style={styles.sendButtonText}>Send</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </KeyboardAvoidingView>
      ) : (
        <ThemedView style={styles.dmContainer}>
          {dmConversations.length > 0 ? (
            <FlatList
              data={dmConversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.partnerId.toString()}
              style={styles.conversationsList}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          ) : (
            <ThemedView style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>No conversations yet</ThemedText>
            </ThemedView>
          )}

          <ThemedView style={styles.newConversationSection}>
            <ThemedText style={styles.sectionTitle}>Start New Conversation</ThemedText>
            <FlatList
              data={allUsers}
              renderItem={renderUser}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.usersList}
            />
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  testButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ownMessage: {
    backgroundColor: '#e0e7ff',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dmContainer: {
    flex: 1,
  },
  conversationsList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  conversationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#666',
  },
  conversationRight: {
    alignItems: 'flex-end',
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newConversationSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  usersList: {
    flexGrow: 0,
  },
  userItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  dmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#6366f1',
  },
  dmHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  dmMessagesList: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  dmMessageContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    maxWidth: '75%',
    alignSelf: 'flex-start',
  },
  ownDmMessage: {
    backgroundColor: '#6366f1',
    alignSelf: 'flex-end',
  },
  dmMessageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  ownDmMessageText: {
    color: 'white',
  },
  dmMessageTime: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
  },
  ownDmMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  dmInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    alignItems: 'flex-end',
  },
  dmInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 12,
  },
  dmSendButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  dmSendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 