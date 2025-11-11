import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '../utils/api';
import { socket } from '../utils/socket';

export default function ChatroomScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { rideId } = route.params;
  const [chatroom, setChatroom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    fetchChatroom();
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [rideId]);

  useEffect(() => {
    if (chatroom?._id) {
      socket.on(`chatroom:${chatroom._id}:message`, (data) => {
        setMessages((prev) => [...prev, data.message]);
      });
    }

    return () => {
      if (chatroom?._id) {
        socket.off(`chatroom:${chatroom._id}:message`);
      }
    };
  }, [chatroom]);

  const fetchChatroom = async () => {
    try {
      setLoading(true);
      const userResponse = await api.get('/auth/me');
      setCurrentUserId(userResponse.data._id || userResponse.data.id);

      const response = await api.get(`/chat/ride/${rideId}`);
      setChatroom(response.data);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error fetching chatroom:', err);
      Alert.alert('Error', 'Failed to load chatroom.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatroom) return;

    try {
      setSending(true);
      const response = await api.post(`/chat/chatroom/${chatroom._id}/message`, {
        message: newMessage.trim(),
      });
      setMessages(response.data.messages || []);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading chatroom...</Text>
      </View>
    );
  }

  if (!chatroom) {
    return (
      <View style={styles.centerContainer}>
        <Text>Chatroom not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back to My Rides</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
        ) : (
          messages.map((msg, idx) => {
            const senderId = msg.sender?._id?.toString() || msg.sender?.id?.toString();
            const isOwnMessage = senderId === currentUserId?.toString();
            return (
              <View
                key={idx}
                style={[
                  styles.messageContainer,
                  isOwnMessage ? styles.ownMessage : styles.otherMessage,
                ]}
              >
                {!isOwnMessage && (
                  <Text style={styles.senderName}>{msg.sender?.name || 'Unknown'}</Text>
                )}
                <Text style={isOwnMessage ? styles.ownMessageText : styles.otherMessageText}>
                  {msg.message}
                </Text>
                <Text style={styles.timestamp}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          editable={!sending}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
  },
  messageContainer: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  ownMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  otherMessageText: {
    color: '#333',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 5,
    opacity: 0.7,
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    maxHeight: 100,
  },
  sendButton: {
    padding: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007bff',
    borderRadius: 8,
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    color: '#007bff',
    marginTop: 10,
    fontSize: 16,
  },
});

