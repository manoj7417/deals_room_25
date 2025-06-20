import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, deals, dms, notifications, users } from '@/lib';
import { sessionStorage } from '@/lib/sessionStorage';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity
} from 'react-native';

const { width } = Dimensions.get('window');

interface ResourceCategory {
  name: string;
  color: string;
  icon: string;
}

interface ResourceCategories {
  [key: string]: ResourceCategory[];
}

const RESOURCE_CATEGORIES: ResourceCategories = {
  'PROJECT & CONSTRUCTION RESOURCES': [
    { name: 'Land', color: '#64b5f6', icon: '🌍' },
    { name: 'Machines', color: '#64b5f6', icon: '🚛' },
    { name: 'Material', color: '#64b5f6', icon: '🏗️' },
    { name: 'Equipment', color: '#64b5f6', icon: '⚡' },
    { name: 'Tools', color: '#64b5f6', icon: '🔧' },
    { name: 'Manpower', color: '#64b5f6', icon: '👥' }
  ],
  'BUSINESS RESOURCES': [
    { name: 'Finance', color: '#64b5f6', icon: '💰' },
    { name: 'Tenders', color: '#64b5f6', icon: '📋' },
    { name: 'Showcase', color: '#64b5f6', icon: '🎯' },
    { name: 'Auction', color: '#64b5f6', icon: '🔨' }
  ],
  'STUDENT RESOURCES': [
    { name: 'Jobs', color: '#64b5f6', icon: '💼' },
    { name: 'E-Stores', color: '#64b5f6', icon: '🛍️' }
  ]
};

// Create display names for better dropdown experience
const CATEGORY_DISPLAY_NAMES: { [key: string]: string } = {
  'PROJECT & CONSTRUCTION RESOURCES': 'Project & Construction',
  'BUSINESS RESOURCES': 'Business Resources',
  'STUDENT RESOURCES': 'Student Resources'
};

export default function DealsRoomTab() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'public' | 'dm'>('public');
  const [refreshing, setRefreshing] = useState(false);
  
  // Public Chat State
  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null); // For reply functionality
  
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
  const notificationChannelRef = useRef<any>(null);

  // Notification state
  const [dmNotifications, setDmNotifications] = useState<any[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Resource filter state
  const [selectedResourceCategory, setSelectedResourceCategory] = useState<string>('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('');
  const [showResourceFilter, setShowResourceFilter] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    loadCurrentUser();
    loadAllUsers();
    
    // Cleanup function to unsubscribe from realtime when component unmounts
    return () => {
      if (publicChannelRef.current) {
        console.log('🧹 Cleaning up public channel subscription');
        supabase.removeChannel(publicChannelRef.current);
      }
      if (dmChannelRef.current) {
        console.log('🧹 Cleaning up DM channel subscription');
        supabase.removeChannel(dmChannelRef.current);
      }
      if (notificationChannelRef.current) {
        console.log('🧹 Cleaning up notification channel subscription');
        supabase.removeChannel(notificationChannelRef.current);
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
      loadDMNotifications(); // Load notifications
      
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

  // Separate effect to handle selectedConversation changes
  useEffect(() => {
    if (currentUser && selectedConversation) {
      console.log('🔄 Selected conversation changed, updating real-time subscription context:', {
        partnerId: selectedConversation.partnerId,
        partnerName: selectedConversation.partnerName
      });
    }
  }, [selectedConversation, currentUser]);

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
    if (!currentUser) return;
    
    try {
      const { data: dmData } = await dms.getAll();
      if (dmData) {
        // Group DMs by conversation partner
        const conversationMap: {[key: number]: any} = {};
        
        dmData.forEach(dm => {
          const partnerId = dm.sender_id === currentUser.id ? dm.receiver_id : dm.sender_id;
          const isUnread = !dm.is_read && dm.receiver_id === currentUser.id;
          
          if (!conversationMap[partnerId]) {
            conversationMap[partnerId] = {
              partnerId,
              partnerName: userMap[partnerId]?.name || 'Unknown User',
              lastMessage: dm.message,
              lastMessageTime: dm.created_at,
              unreadCount: 0,
              messages: []
            };
          }
          
          if (dm.created_at > conversationMap[partnerId].lastMessageTime) {
            conversationMap[partnerId].lastMessage = dm.message;
            conversationMap[partnerId].lastMessageTime = dm.created_at;
          }
          
          if (isUnread) {
            conversationMap[partnerId].unreadCount++;
          }
        });
        
        const conversations = Object.values(conversationMap).sort((a: any, b: any) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
        
        setDmConversations(conversations);
      }
    } catch (error) {
      console.error('Error loading DM conversations:', error);
    }
  };

  // Load DM notifications
  const loadDMNotifications = async () => {
    if (!currentUser) return;
    
    try {
      console.log('📢 Loading DM notifications for user:', currentUser.id);
      const { data: notificationData } = await notifications.getUserNotifications(currentUser.id);
      
      if (notificationData) {
        // Filter for DM notifications only (both requests and messages)
        const dmNotifs = notificationData.filter(notif => 
          (notif.type === 'dm_request' || notif.type === 'dm_message') && !notif.is_read
        );
        console.log(`📢 Found ${dmNotifs.length} unread DM notifications`);
        
        setDmNotifications(dmNotifs);
        setUnreadNotificationCount(dmNotifs.length);
      }
    } catch (error) {
      console.error('❌ Error loading DM notifications:', error);
    }
  };

  // Create DM notification when someone wants to start a chat or sends a message
  const createDMNotification = async (targetUserId: number, senderName: string, messageText?: string) => {
    try {
      console.log('📢 Creating DM notification for user:', targetUserId);
      
      const notification = {
        user_id: targetUserId,
        title: messageText ? 'New Message' : 'New Chat Request',
        message: messageText ? `${senderName}: ${messageText.slice(0, 50)}${messageText.length > 50 ? '...' : ''}` : `${senderName} wants to start a conversation with you`,
        type: messageText ? 'dm_message' : 'dm_request',
        is_read: false,
        related_id: currentUser.id // Store sender's ID as related_id
      };
      
      const { data, error } = await notifications.create(notification);
      
      if (error) {
        console.error('❌ Error creating DM notification:', error);
      } else {
        console.log('✅ DM notification created successfully:', data);
      }
    } catch (error) {
      console.error('❌ Error creating DM notification:', error);
    }
  };

  // Clear DM notifications when user opens the chat
  const clearDMNotification = async (senderId: number) => {
    try {
      console.log('🔄 Clearing DM notifications from sender:', senderId);
      
      // Find all notifications for this sender (both requests and messages)
      const notificationsToMark = dmNotifications.filter(notif => notif.related_id === senderId);
      
      for (const notification of notificationsToMark) {
        await notifications.markAsRead(notification.id);
      }
      
      if (notificationsToMark.length > 0) {
        console.log(`✅ Cleared ${notificationsToMark.length} DM notifications`);
        
        // Reload notifications to update UI
        loadDMNotifications();
      }
    } catch (error) {
      console.error('❌ Error clearing DM notifications:', error);
    }
  };

  // Resource filter helper functions
  const getAvailableResourceTypes = () => {
    if (!selectedResourceCategory || !RESOURCE_CATEGORIES[selectedResourceCategory]) {
      return [];
    }
    return RESOURCE_CATEGORIES[selectedResourceCategory];
  };

  const clearResourceFilter = () => {
    setSelectedResourceCategory('');
    setSelectedResourceType('');
  };

  const toggleResourceFilter = () => {
    setShowResourceFilter(!showResourceFilter);
  };

  const setupRealtimeSubscriptions = async () => {
    console.log('🚀 Setting up realtime subscriptions...');
    console.log('Current user:', currentUser?.name);
    console.log('User map size:', Object.keys(userMap).length);
    
    if (!currentUser) {
      console.error('❌ No current user, cannot setup realtime');
      return;
    }
    
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

    // Test database connection first
    try {
      console.log('🔍 Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('deals')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Database connection failed:', testError);
        return;
      }
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection error:', error);
      return;
    }

    // Create unique channel name
    const timestamp = Date.now();
    const publicChannelName = `public-messages-${currentUser.id}-${timestamp}`;
    const dmChannelName = `direct-messages-${currentUser.id}-${timestamp}`;

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
          console.log('Payload:', payload);
          
          const newMessage = payload.new;
          console.log('New message:', newMessage);
          
          // Add user info to the message
          const senderName = userMap[newMessage.sender_id]?.name || 'Unknown User';
          const messageWithUser = {
            ...newMessage,
            senderName
          };
          
          console.log('Adding message to state...');
          setPublicMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('⚠️ Duplicate message detected, skipping');
              return prev;
            }
            
            console.log('✅ Adding new message to state');
            const newMessages = [...prev, messageWithUser];
            
            // Scroll to bottom when new message arrives
            setTimeout(() => {
              publicChatRef.current?.scrollToEnd({ animated: true });
            }, 100);
            
            return newMessages;
          });
        }
      )
      .subscribe((status, err) => {
        console.log(`📡 Public channel status: ${status}`);
        
        if (err) {
          console.error('❌ Public channel error:', err);
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to public messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to public messages');
          console.error('Make sure Realtime is enabled on the "deals" table in Supabase Dashboard');
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
          console.log('DM payload:', payload);
          const newDM = payload.new;
          
          console.log('DM details:', {
            senderId: newDM.sender_id,
            receiverId: newDM.receiver_id,
            currentUserId: currentUser.id,
            message: newDM.message
          });
          
          // Check if this DM involves the current user
          const isForCurrentUser = newDM.sender_id === currentUser.id || newDM.receiver_id === currentUser.id;
          
          if (!isForCurrentUser) {
            console.log('💬 DM not for current user, ignoring');
            return;
          }
          
          console.log('💬 DM is for current user, processing...');
          
          // Update DM messages only if it's for the currently selected conversation
          setSelectedConversation(prevConversation => {
            if (!prevConversation) {
              console.log('💬 No conversation selected, not adding to current messages');
              return prevConversation;
            }
            
            const isForSelectedConversation = 
              (newDM.sender_id === currentUser.id && newDM.receiver_id === prevConversation.partnerId) ||
              (newDM.sender_id === prevConversation.partnerId && newDM.receiver_id === currentUser.id);
            
            if (isForSelectedConversation) {
              console.log('💬 Message is for current conversation, adding to messages');
              
              // Add message to current conversation messages
              setDmMessages(prevMessages => {
                // Check if message already exists to avoid duplicates
                const exists = prevMessages.some(msg => msg.id === newDM.id);
                if (exists) {
                  console.log('⚠️ Duplicate DM detected, skipping');
                  return prevMessages;
                }
                
                console.log('✅ Adding new DM to current conversation messages');
                const updatedMessages = [...prevMessages, newDM];
                
                // Scroll to bottom when new message arrives
                setTimeout(() => {
                  if (dmChatRef.current) {
                    dmChatRef.current.scrollToEnd({ animated: true });
                  }
                }, 100);
                
                return updatedMessages;
              });
            } else {
              console.log('💬 Message is not for current conversation, will only update conversation list');
            }
            
            return prevConversation;
          });
          
          // Always reload conversations to update counts and last messages
          console.log('🔄 Reloading DM conversations...');
          loadDMConversations();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'dms' 
        },
        (payload) => {
          console.log('💬 === DM UPDATED ===');
          console.log('DM update payload:', payload);
          
          // Handle message read status updates
          const updatedDM = payload.new;
          const isForCurrentUser = updatedDM.sender_id === currentUser.id || updatedDM.receiver_id === currentUser.id;
          
          if (isForCurrentUser) {
            console.log('🔄 Reloading conversations due to DM update...');
            loadDMConversations();
            
            // If it's for current conversation, update the message
            if (selectedConversation) {
              const isForSelectedConversation = 
                (updatedDM.sender_id === currentUser.id && updatedDM.receiver_id === selectedConversation.partnerId) ||
                (updatedDM.sender_id === selectedConversation.partnerId && updatedDM.receiver_id === currentUser.id);
              
              if (isForSelectedConversation) {
                setDmMessages(prev => 
                  prev.map(msg => msg.id === updatedDM.id ? updatedDM : msg)
                );
              }
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`📱 DM channel status: ${status}`);
        
        if (err) {
          console.error('❌ DM channel error:', err);
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to DMs');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to DMs');
          console.error('🔧 SOLUTION: Enable Realtime on the "dms" table in Supabase Dashboard');
          console.error('📋 Steps: Dashboard → Database → Tables → dms → Enable Realtime toggle');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Timeout subscribing to DMs');
          console.error('🔧 Check your internet connection and Supabase status');
        } else if (status === 'CLOSED') {
          console.log('🔒 DM channel subscription closed');
        }
      });
      
    console.log(`📢 Creating notification channel: notifications-${currentUser.id}`);
    
    // Subscribe to notifications for current user
    notificationChannelRef.current = supabase
      .channel(`notifications-${currentUser.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('📢 === NOTIFICATION RECEIVED ===');
          console.log('Notification payload:', payload);
          const newNotification = payload.new;
          
          if (newNotification.type === 'dm_request' || newNotification.type === 'dm_message') {
            console.log('📢 New DM notification received:', newNotification.type);
            setDmNotifications(prev => {
              const exists = prev.some(notif => notif.id === newNotification.id);
              if (exists) return prev;
              
              return [newNotification, ...prev];
            });
            
            setUnreadNotificationCount(prev => prev + 1);
            
            // Show toast/alert for new DM
            const senderName = userMap[newNotification.related_id]?.name || 'Someone';
            if (newNotification.type === 'dm_request') {
              Alert.alert(
                '💬 New Chat Request', 
                `${senderName} wants to start a conversation with you. Check Direct Messages to respond.`,
                [{ text: 'OK' }]
              );
            } else {
              // For new messages, show a more subtle notification
              console.log('📢 New message notification from:', senderName);
              // Only show alert if not currently in DM tab or not in conversation with sender
              if (activeTab !== 'dm' || selectedConversation?.partnerId !== newNotification.related_id) {
                Alert.alert(
                  '💬 New Message', 
                  newNotification.message,
                  [{ text: 'OK' }]
                );
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('📢 === NOTIFICATION UPDATED ===');
          const updatedNotification = payload.new;
          
          if (updatedNotification.is_read && (updatedNotification.type === 'dm_request' || updatedNotification.type === 'dm_message')) {
            console.log('📢 DM notification marked as read');
            setDmNotifications(prev => 
              prev.filter(notif => notif.id !== updatedNotification.id)
            );
            setUnreadNotificationCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`📢 Notification channel status: ${status}`);
        
        if (err) {
          console.error('❌ Notification channel error:', err);
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to notifications');
          console.error('🔧 SOLUTION: Enable Realtime on the "notifications" table in Supabase Dashboard');
        } else if (status === 'CLOSED') {
          console.log('🔒 Notification channel subscription closed');
        }
      });
      
    // Log final state
    setTimeout(() => {
      const channels = supabase.getChannels();
      console.log('🏁 Final subscription state:');
      console.log('Active channels:', channels.length);
      channels.forEach(ch => {
        console.log(`  - ${ch.topic}: ${ch.state}`);
      });
      console.log('Public channel ref exists:', !!publicChannelRef.current);
      console.log('DM channel ref exists:', !!dmChannelRef.current);
      console.log('Notification channel ref exists:', !!notificationChannelRef.current);
      
      // Show setup instructions if no channels are active
      if (channels.length === 0 || channels.every(ch => ch.state !== 'joined')) {
        console.warn('⚠️ No active realtime channels found!');
        console.warn('📋 SETUP INSTRUCTIONS:');
        console.warn('1. Go to Supabase Dashboard → Database → Tables');
        console.warn('2. Click on "deals" table → Enable Realtime');
        console.warn('3. Click on "dms" table → Enable Realtime');
        console.warn('4. Click on "notifications" table → Enable Realtime');
        console.warn('5. Refresh the app');
      }
    }, 3000);
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
      userId: currentUser.id,
      replyingTo: replyingTo?.id
    });
    
    try {
      // Determine the category to display based on selected resource
      let displayCategory = 'general';
      if (selectedResourceType) {
        displayCategory = selectedResourceType.toLowerCase();
      } else if (selectedResourceCategory) {
        // Use a shortened version of the category name
        const categoryShortNames = {
          'PROJECT & CONSTRUCTION RESOURCES': 'construction',
          'BUSINESS RESOURCES': 'business',
          'STUDENT RESOURCES': 'student'
        };
        displayCategory = categoryShortNames[selectedResourceCategory as keyof typeof categoryShortNames] || 'general';
      }

      const messageData = {
        title: `${currentUser.name}: ${newMessage.substring(0, 50)}...`,
        description: newMessage,
        category: displayCategory,
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
      setReplyingTo(null); // Clear reply after sending
    } catch (error) {
      console.error('Error sending public message:', error);
      Alert.alert('Error', 'Failed to send message: ' + error.message);
    }
  };

  const sendDirectMessage = async () => {
    if (!newDmMessage.trim() || !currentUser || !selectedConversation) {
      console.log('Cannot send DM - missing data:', { 
        messageLength: newDmMessage.trim().length, 
        hasUser: !!currentUser,
        hasConversation: !!selectedConversation 
      });
      return;
    }
    
    console.log('Sending DM:', {
      message: newDmMessage,
      senderId: currentUser.id,
      receiverId: selectedConversation.partnerId,
      senderName: currentUser.name,
      receiverName: selectedConversation.partnerName
    });
    
    try {
      const dmData = {
        message: newDmMessage,
        sender_id: currentUser.id,
        receiver_id: selectedConversation.partnerId,
        is_read: false
      };
      
      console.log('DM data to send:', dmData);
      
      const { data, error } = await dms.create(dmData);
      
      if (error) {
        console.error('Error creating DM:', error);
        Alert.alert('Error', 'Failed to send message: ' + error.message);
        return;
      }
      
      console.log('✅ DM sent successfully:', data);
      
      // Create notification for the receiver about the new message
      await createDMNotification(selectedConversation.partnerId, currentUser.name, newDmMessage.trim());
      
      setNewDmMessage('');
      
      // Add message to local state immediately for better UX
      if (data) {
        setDmMessages(prev => [...prev, data]);
        
        // Scroll to bottom
        setTimeout(() => {
          dmChatRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
      
      // Refresh conversation list to update last message
      loadDMConversations();
      
    } catch (error) {
      console.error('Error sending DM:', error);
      Alert.alert('Error', 'Failed to send message: ' + error.message);
    }
  };

  const handleDirectMessageTo = (senderId: number) => {
    console.log('🔄 Starting DM with user:', senderId);
    const user = userMap[senderId];
    
    if (!user) {
      console.error('❌ User not found in userMap for ID:', senderId);
      console.log('Available users:', Object.keys(userMap));
      return;
    }
    
    if (user.id === currentUser?.id) {
      console.log('❌ Cannot DM yourself');
      return;
    }
    
    console.log('✅ Found user:', { id: user.id, name: user.name });
    
    // Create notification for the target user
    createDMNotification(user.id, currentUser.name);
    
    // Find existing conversation or create new one
    const existingConversation = dmConversations.find(conv => conv.partnerId === user.id);
    
    if (existingConversation) {
      console.log('📱 Opening existing conversation with:', user.name);
      openConversation(existingConversation);
    } else {
      console.log('📱 Starting new conversation with:', user.name);
      startNewConversation(user);
    }
  };

  const startNewConversation = (user: any) => {
    console.log('🆕 Creating new conversation:', {
      partnerId: user.id,
      partnerName: user.name,
      currentUserId: currentUser?.id
    });
    
    setSelectedConversation({
      partnerId: user.id,
      partnerName: user.name,
      messages: []
    });
    setDmMessages([]);
    setActiveTab('dm');
    
    console.log('✅ New conversation created and DM tab activated');
  };

  const openConversation = async (conversation: any) => {
    console.log('📂 Opening conversation:', {
      partnerId: conversation.partnerId,
      partnerName: conversation.partnerName,
      currentUserId: currentUser?.id
    });
    
    // Clear any notifications from this sender
    await clearDMNotification(conversation.partnerId);
    
    // Set conversation first
    setSelectedConversation(conversation);
    setActiveTab('dm'); // Make sure we switch to DM tab
    
    try {
      console.log('📥 Loading conversation messages...');
      const { data: dmData } = await dms.getAll();
      
      if (dmData) {
        const conversationMessages = dmData.filter(dm =>
          (dm.sender_id === currentUser.id && dm.receiver_id === conversation.partnerId) ||
          (dm.sender_id === conversation.partnerId && dm.receiver_id === currentUser.id)
        ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        console.log(`📨 Found ${conversationMessages.length} messages in conversation`);
        console.log('📨 Setting DM messages for conversation:', conversationMessages.map(m => ({
          id: m.id,
          message: m.message.substring(0, 30) + '...',
          senderId: m.sender_id,
          receiverId: m.receiver_id
        })));
        
        setDmMessages(conversationMessages);
        
        // Scroll to bottom after setting messages
        setTimeout(() => {
          if (dmChatRef.current) {
            dmChatRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
        
        // Mark messages as read
        let readCount = 0;
        for (const message of conversationMessages) {
          if (!message.is_read && message.receiver_id === currentUser.id) {
            await dms.update(message.id, { is_read: true });
            readCount++;
          }
        }
        
        if (readCount > 0) {
          console.log(`✅ Marked ${readCount} messages as read`);
          loadDMConversations(); // Refresh conversation list to update unread counts
        }
        
        console.log('✅ Conversation loaded successfully');
      }
    } catch (error) {
      console.error('❌ Error loading conversation messages:', error);
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

  // New functions for reply and DM functionality
  const handleReplyToMessage = (message: any) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
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
        <ThemedView style={styles.messageFooter}>
          <ThemedView style={styles.categoryBadge}>
            <ThemedText style={styles.categoryText}>{item.category}</ThemedText>
          </ThemedView>
          {!isOwnMessage && (
            <ThemedView style={styles.messageActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleReplyToMessage(item)}
              >
                <ThemedText style={styles.actionButtonText}>↩️ Reply</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  console.log('🚀 DM Button Clicked! Sender ID:', item.sender_id);
                  handleDirectMessageTo(item.sender_id);
                }}
              >
                <ThemedText style={styles.actionButtonText}>💬 DM</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
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

  // Handle notification click - opens chat and clears notification
  const handleNotificationClick = async (notification: any) => {
    const senderId = notification.related_id;
    const senderUser = userMap[senderId];
    
    if (!senderUser) {
      console.error('❌ Sender user not found for notification');
      return;
    }
    
    console.log('📢 Notification clicked, opening chat with:', senderUser.name);
    
    // Clear the notification
    await clearDMNotification(senderId);
    
    // Find or create conversation
    const existingConversation = dmConversations.find(conv => conv.partnerId === senderId);
    
    if (existingConversation) {
      openConversation(existingConversation);
    } else {
      startNewConversation(senderUser);
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    const senderName = userMap[item.related_id]?.name || 'Unknown User';
    
    return (
      <TouchableOpacity 
        style={styles.notificationItem}
        onPress={() => handleNotificationClick(item)}
      >
        <ThemedView style={styles.notificationLeft}>
          <ThemedView style={styles.notificationIcon}>
            <ThemedText style={styles.notificationIconText}>💬</ThemedText>
          </ThemedView>
          <ThemedView style={styles.notificationContent}>
            <ThemedText style={styles.notificationTitle}>{item.title}</ThemedText>
            <ThemedText style={styles.notificationMessage}>{item.message}</ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView style={styles.notificationRight}>
          <ThemedText style={styles.notificationTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
          <ThemedView style={styles.newBadge}>
            <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>
    );
  };

  const renderResourceFilter = () => {
    if (!showResourceFilter) return null;

    return (
      <ThemedView style={styles.resourceFilterContainer}>
        <ThemedView style={styles.resourceFilterHeader}>
          <ThemedText style={styles.resourceFilterTitle}>Filter by Resources</ThemedText>
          <TouchableOpacity onPress={toggleResourceFilter} style={styles.closeFilterButton}>
            <ThemedText style={styles.closeFilterText}>✕</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Resource Category Dropdown */}
        <ThemedView style={styles.resourceInputContainer}>
          <ThemedText style={styles.resourceInputLabel}>Resource Category</ThemedText>
          <ThemedView style={styles.resourcePickerContainer}>
            <TouchableOpacity
              style={styles.resourcePicker}
              onPress={() => {
                setShowCategoryModal(true);
              }}
            >
              <ThemedText style={styles.resourcePickerText}>
                {selectedResourceCategory ? CATEGORY_DISPLAY_NAMES[selectedResourceCategory] || selectedResourceCategory : 'Select Category'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* Resource Type Dropdown */}
        <ThemedView style={styles.resourceInputContainer}>
          <ThemedText style={styles.resourceInputLabel}>Resource Type</ThemedText>
          <ThemedView style={styles.resourcePickerContainer}>
            <TouchableOpacity
              style={styles.resourcePicker}
              onPress={() => {
                if (selectedResourceCategory) {
                  setShowTypeModal(true);
                }
              }}
            >
              <ThemedText style={styles.resourcePickerText}>
                {selectedResourceType ? getAvailableResourceTypes().find(t => t.name === selectedResourceType)?.name : 'Select Type'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* Filter Actions */}
        <ThemedView style={styles.resourceFilterActions}>
          <TouchableOpacity style={styles.clearFilterButton} onPress={clearResourceFilter}>
            <ThemedText style={styles.clearFilterButtonText}>Clear Filter</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyFilterButton} onPress={toggleResourceFilter}>
            <ThemedText style={styles.applyFilterButtonText}>Apply Filter</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Show active filters */}
        {(selectedResourceCategory || selectedResourceType) && (
          <ThemedView style={styles.activeFiltersContainer}>
            <ThemedText style={styles.activeFiltersLabel}>Active Filters:</ThemedText>
            {selectedResourceCategory && (
              <ThemedView style={styles.activeFilterChip}>
                <ThemedText style={styles.activeFilterText}>
                  {CATEGORY_DISPLAY_NAMES[selectedResourceCategory] || selectedResourceCategory}
                </ThemedText>
              </ThemedView>
            )}
            {selectedResourceType && (
              <ThemedView style={styles.activeFilterChip}>
                <ThemedText style={styles.activeFilterText}>
                  {selectedResourceType}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        )}
      </ThemedView>
    );
  };

  // Category Selection Modal
  const renderCategoryModal = () => (
    <Modal visible={showCategoryModal} transparent animationType="slide">
      <ThemedView style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Select Category</ThemedText>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <ThemedText style={styles.modalCloseText}>✕</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          <TouchableOpacity 
            style={styles.modalOption}
            onPress={() => {
              setSelectedResourceCategory('');
              setSelectedResourceType('');
              setShowCategoryModal(false);
            }}
          >
            <ThemedText style={styles.modalOptionText}>All Categories</ThemedText>
          </TouchableOpacity>
          
          {Object.keys(RESOURCE_CATEGORIES).map((category) => (
            <TouchableOpacity 
              key={category}
              style={[
                styles.modalOption, 
                selectedResourceCategory === category && styles.selectedOption
              ]}
              onPress={() => {
                setSelectedResourceCategory(category);
                setSelectedResourceType(''); // Reset type when category changes
                setShowCategoryModal(false);
              }}
            >
              <ThemedText style={[
                styles.modalOptionText,
                selectedResourceCategory === category && styles.selectedOptionText
              ]}>
                {CATEGORY_DISPLAY_NAMES[category] || category}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ThemedView>
    </Modal>
  );

  // Type Selection Modal
  const renderTypeModal = () => (
    <Modal visible={showTypeModal} transparent animationType="slide">
      <ThemedView style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Select Type</ThemedText>
            <TouchableOpacity onPress={() => setShowTypeModal(false)}>
              <ThemedText style={styles.modalCloseText}>✕</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          <TouchableOpacity 
            style={styles.modalOption}
            onPress={() => {
              setSelectedResourceType('');
              setShowTypeModal(false);
            }}
          >
            <ThemedText style={styles.modalOptionText}>All Types</ThemedText>
          </TouchableOpacity>
          
          {getAvailableResourceTypes().map((resource) => (
            <TouchableOpacity 
              key={resource.name}
              style={[
                styles.modalOption, 
                selectedResourceType === resource.name && styles.selectedOption
              ]}
              onPress={() => {
                setSelectedResourceType(resource.name);
                setShowTypeModal(false);
              }}
            >
              <ThemedText style={[
                styles.modalOptionText,
                selectedResourceType === resource.name && styles.selectedOptionText
              ]}>
                {resource.icon} {resource.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ThemedView>
    </Modal>
  );

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
            style={styles.filterButton}
            onPress={toggleResourceFilter}
          >
            <ThemedText style={styles.filterButtonText}>🔍 Filter</ThemedText>
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
            <ThemedView style={styles.tabWithBadge}>
              <ThemedText style={[styles.tabText, activeTab === 'dm' && styles.activeTabText]}>
                Direct Messages
              </ThemedText>
              {unreadNotificationCount > 0 && (
                <ThemedView style={styles.notificationBadge}>
                  <ThemedText style={styles.notificationBadgeText}>
                    {unreadNotificationCount}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Resource Filter */}
      {renderResourceFilter()}

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

          {/* Reply indicator */}
          {replyingTo && (
            <ThemedView style={styles.replyIndicator}>
              <ThemedView style={styles.replyIndicatorContent}>
                <ThemedText style={styles.replyIndicatorLabel}>Replying to {getSenderName(replyingTo.sender_id)}:</ThemedText>
                <ThemedText style={styles.replyIndicatorText} numberOfLines={1}>
                  {replyingTo.description}
                </ThemedText>
              </ThemedView>
              <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyButton}>
                <ThemedText style={styles.cancelReplyText}>✕</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}

          {/* Resource Type Indicator */}
          {/* {(selectedResourceCategory || selectedResourceType) && (
            <ThemedView style={styles.resourceIndicator}>
              <ThemedText style={styles.resourceIndicatorLabel}>Posting as:</ThemedText>
              <ThemedView style={styles.resourceIndicatorBadge}>
                <ThemedText style={styles.resourceIndicatorText}>
                  {selectedResourceType ? 
                    `${getAvailableResourceTypes().find(t => t.name === selectedResourceType)?.icon} ${selectedResourceType}` : 
                    CATEGORY_DISPLAY_NAMES[selectedResourceCategory] || selectedResourceCategory
                  }
                </ThemedText>
              </ThemedView>
              <TouchableOpacity 
                style={styles.changeResourceButton}
                onPress={() => setShowResourceFilter(true)}
              >
                <ThemedText style={styles.changeResourceText}>Change</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )} */}

          <ThemedView style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={replyingTo ? `Reply to ${getSenderName(replyingTo.sender_id)}...` : "Share a deal or announcement..."}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendPublicMessage}>
              <ThemedText style={styles.sendButtonText}>Send</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </KeyboardAvoidingView>
      ) : (
        <ThemedView style={styles.dmContainer}>
          {/* Notifications Section */}
          {dmNotifications.length > 0 && (
            <ThemedView style={styles.notificationsSection}>
              <ThemedText style={styles.sectionTitle}>
                💬 Chat Requests ({dmNotifications.length})
              </ThemedText>
              <FlatList
                data={dmNotifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </ThemedView>
          )}
          
          {/* Conversations Section */}
          {dmConversations.length > 0 ? (
            <ThemedView style={styles.conversationsSection}>
              <ThemedText style={styles.sectionTitle}>Your Conversations</ThemedText>
              <FlatList
                data={dmConversations}
                renderItem={renderConversation}
                keyExtractor={(item) => item.partnerId.toString()}
                style={styles.conversationsList}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              />
            </ThemedView>
          ) : (
            !dmNotifications.length && (
              <ThemedView style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>No conversations yet</ThemedText>
              </ThemedView>
            )
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
      
      {/* Modals */}
      {renderCategoryModal()}
      {renderTypeModal()}
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
    backgroundColor: '#6366f1',
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
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
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
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  replyIndicator: {
    backgroundColor: '#e0e7ff',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  replyIndicatorContent: {
    flex: 1,
  },
  replyIndicatorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 2,
  },
  replyIndicatorText: {
    fontSize: 14,
    color: '#333',
  },
  cancelReplyButton: {
    padding: 4,
    marginLeft: 8,
  },
  cancelReplyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
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
    paddingHorizontal: 0,
  },
  userItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
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
    fontWeight: '500',
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
    backgroundColor: '#ffffff',
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    backgroundColor: '#6366f1',
    padding: 8,
    borderRadius: 20,
    marginRight: 16,
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dmHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  dmMessagesList: {
    flex: 1,
    padding: 16,
  },
  dmMessageContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 4,
    marginRight: 12,
  },
  notificationIconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
  },
  notificationRight: {
    alignItems: 'flex-end',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  newBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 4,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationsSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  conversationsSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  resourceFilterContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resourceFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resourceFilterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  closeFilterButton: {
    padding: 4,
  },
  closeFilterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  resourceInputContainer: {
    marginBottom: 12,
  },
  resourceInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  resourcePickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  resourcePicker: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minHeight: 50,
    justifyContent: 'center',
  },
  resourcePickerText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  resourceFilterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  applyFilterButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  applyFilterButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  clearFilterButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  clearFilterButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  activeFiltersLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#6366f1',
    padding: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  modalOption: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 6,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  selectedOption: {
    backgroundColor: '#6366f1',
  },
  selectedOptionText: {
    color: 'white',
  },
  resourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resourceIndicatorLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  resourceIndicatorBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 1,
  },
  resourceIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  changeResourceButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeResourceText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
});