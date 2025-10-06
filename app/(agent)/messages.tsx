// app/(agent)/messages.tsx
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Messages() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState('control-center');
  const [isOnline, setIsOnline] = useState(true);
  const scrollViewRef = useRef();

  // Mock conversations data
  const conversations = [
    {
      id: 'control-center',
      name: 'Control Center',
      type: 'official',
      unread: 2,
      lastMessage: 'New emergency assigned in your area',
      lastTime: '2 min ago',
      status: 'online',
      isPinned: true
    },
    {
      id: 'emergency-0012',
      name: 'Emergency #EMG-2024-0012',
      type: 'emergency',
      unread: 0,
      lastMessage: 'Victim is safe, proceeding to location',
      lastTime: '5 min ago',
      status: 'resolved',
      isPinned: false
    },
    {
      id: 'responder-team',
      name: 'Response Team Alpha',
      type: 'group',
      unread: 3,
      lastMessage: 'Backup requested at Gulshan location',
      lastTime: '10 min ago',
      status: 'active',
      isPinned: true
    },
    {
      id: 'police-unit',
      name: 'Police Unit B-12',
      type: 'official',
      unread: 0,
      lastMessage: 'We have taken over the case',
      lastTime: '1 hour ago',
      status: 'offline',
      isPinned: false
    },
    {
      id: 'ngo-support',
      name: 'Women Support NGO',
      type: 'official',
      unread: 1,
      lastMessage: 'Counseling services available',
      lastTime: '2 hours ago',
      status: 'online',
      isPinned: false
    }
  ];

  // Mock messages for active chat
  const chatMessages = {
    'control-center': [
      {
        id: 1,
        sender: 'control-center',
        text: 'New emergency alert: Harassment case in Gulshan 1',
        time: '14:20',
        type: 'emergency_alert',
        isRead: true
      },
      {
        id: 2,
        sender: 'control-center',
        text: 'Victim is female, 25 years old. Location: Road 45, Gulshan 1',
        time: '14:21',
        type: 'info',
        isRead: true
      },
      {
        id: 3,
        sender: 'control-center',
        text: 'Please confirm if you can respond to this emergency',
        time: '14:21',
        type: 'question',
        isRead: true
      },
      {
        id: 4,
        sender: 'me',
        text: 'I am available. Starting navigation to location now.',
        time: '14:22',
        type: 'response',
        isRead: true
      },
      {
        id: 5,
        sender: 'control-center',
        text: 'Thank you. Police unit has been notified and is en route as backup.',
        time: '14:23',
        type: 'info',
        isRead: false
      },
      {
        id: 6,
        sender: 'control-center',
        text: 'New emergency update: Additional reports of same perpetrator in area',
        time: '14:25',
        type: 'emergency_alert',
        isRead: false
      }
    ],
    'responder-team': [
      {
        id: 1,
        sender: 'team-leader',
        name: 'Team Leader',
        text: 'All team members please check in for shift change',
        time: '13:00',
        type: 'announcement',
        isRead: false
      },
      {
        id: 2,
        sender: 'responder-ahmed',
        name: 'Ahmed H.',
        text: 'Checked in. Currently in Dhanmondi area',
        time: '13:05',
        type: 'checkin',
        isRead: false
      },
      {
        id: 3,
        sender: 'me',
        text: 'Checked in. Available in Gulshan area',
        time: '13:07',
        type: 'checkin',
        isRead: true
      },
      {
        id: 4,
        sender: 'team-leader',
        name: 'Team Leader',
        text: 'Backup needed at Gulshan 2. Who is closest?',
        time: '14:15',
        type: 'emergency',
        isRead: false
      }
    ]
  };

  useEffect(() => {
    // Load messages for active chat
    setMessages(chatMessages[activeChat] || []);
    
    // Auto-scroll to bottom when messages update
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [activeChat]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'message',
      isRead: true
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    
    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleQuickResponse = (response: string) => {
    setNewMessage(response);
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      "Send Emergency Alert",
      "This will send an emergency alert to control center and nearby responders",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Send Alert",
          style: "destructive",
          onPress: () => {
            const emergencyMsg = {
              id: Date.now(),
              sender: 'me',
              text: '🚨 EMERGENCY ALERT: Need immediate backup at my location!',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'emergency_alert',
              isRead: false
            };
            setMessages(prev => [...prev, emergencyMsg]);
            Alert.alert("Alert Sent", "Emergency alert has been sent to control center.");
          }
        }
      ]
    );
  };

  const handleCall = (contactName: string) => {
    Alert.alert(
      `Call ${contactName}`,
      "This would initiate a voice call",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Call",
          onPress: () => console.log(`Calling ${contactName}...`)
        }
      ]
    );
  };

  const getMessageStyle = (message: any) => {
    const baseStyle = "max-w-[80%] rounded-2xl p-3 my-1";
    
    if (message.sender === 'me') {
      return `${baseStyle} bg-primary self-end`;
    }
    
    switch (message.type) {
      case 'emergency_alert':
        return `${baseStyle} bg-red-500 self-start`;
      case 'announcement':
        return `${baseStyle} bg-orange-500 self-start`;
      case 'emergency':
        return `${baseStyle} bg-red-400 self-start`;
      case 'question':
        return `${baseStyle} bg-blue-500 self-start`;
      case 'checkin':
        return `${baseStyle} bg-green-500 self-start`;
      default:
        return `${baseStyle} bg-surface-variant self-start`;
    }
  };

  const getMessageTextStyle = (message: any) => {
    if (message.sender === 'me' || message.type === 'emergency_alert' || message.type === 'announcement') {
      return "text-white";
    }
    return "text-on-surface";
  };

  const quickResponses = [
    "En route to location",
    "Need backup",
    "Situation under control",
    "Victim is safe",
    "Requesting police assistance",
    "Medical help needed",
    "ETA 5 minutes",
    "Unable to respond"
  ];

  const activeConversation = conversations.find(conv => conv.id === activeChat);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View className="px-6 pt-6 pb-4 bg-surface">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-headline text-on-surface">Messages</Text>
          <View className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
        </View>
        
        {/* Conversation Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2">
          {conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              className={`px-4 py-2 rounded-full flex-row items-center ${
                activeChat === conversation.id ? 'bg-primary' : 'bg-surface-variant'
              } ${conversation.isPinned ? 'border border-primary' : ''}`}
              onPress={() => setActiveChat(conversation.id)}
            >
              {conversation.unread > 0 && (
                <View className="w-2 h-2 rounded-full bg-red-500 mr-1" />
              )}
              <Text className={activeChat === conversation.id ? 'text-white' : 'text-on-surface'}>
                {conversation.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat Header */}
      <View className="px-6 py-3 bg-surface-variant flex-row justify-between items-center">
        <View>
          <Text className="text-on-surface font-semibold">{activeConversation?.name}</Text>
          <Text className="text-label text-on-surface-variant">
            {activeConversation?.status === 'online' ? '🟢 Online' : 
             activeConversation?.status === 'offline' ? '⚫ Offline' : 
             `Last active: ${activeConversation?.lastTime}`}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-primary px-4 py-2 rounded-lg"
          onPress={() => handleCall(activeConversation?.name)}
        >
          <Text className="text-white font-semibold">Call</Text>
        </TouchableOpacity>
      </View>

      {/* Messages Area */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="py-4 space-y-2">
          {messages.map((message) => (
            <View key={message.id} className={message.sender === 'me' ? 'items-end' : 'items-start'}>
              <View className={getMessageStyle(message)}>
                {message.sender !== 'me' && message.name && (
                  <Text className="text-label text-on-surface-variant mb-1">
                    {message.name}
                  </Text>
                )}
                <Text className={getMessageTextStyle(message)}>
                  {message.text}
                </Text>
                <Text className={`text-xs mt-1 ${
                  message.sender === 'me' ? 'text-white/70' : 'text-on-surface-variant'
                }`}>
                  {message.time}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Quick Responses */}
      {activeChat === 'control-center' && (
        <View className="px-4 py-2 border-t border-outline">
          <Text className="text-label text-on-surface-variant mb-2">Quick Responses:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2">
            {quickResponses.map((response, index) => (
              <TouchableOpacity
                key={index}
                className="bg-surface-variant px-3 py-2 rounded-full"
                onPress={() => handleQuickResponse(response)}
              >
                <Text className="text-on-surface text-sm">{response}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Message Input */}
      <View className="px-4 py-3 bg-surface border-t border-outline">
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            className="bg-red-500 w-10 h-10 rounded-full items-center justify-center"
            onPress={handleEmergencyAlert}
          >
            <Text className="text-white font-bold">🚨</Text>
          </TouchableOpacity>
          
          <TextInput
            className="flex-1 bg-surface-variant rounded-full px-4 py-3 text-on-surface"
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          
          <TouchableOpacity
            className="bg-primary w-10 h-10 rounded-full items-center justify-center"
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Text className="text-white font-bold">➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}