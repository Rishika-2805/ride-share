import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../utils/api';
import { socket } from '../utils/socket';

export default function AvailableRidesScreen() {
  const [availableRides, setAvailableRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchAvailableRides();
    socket.connect();

    socket.on('new_shared_ride', (data) => {
      setAvailableRides((prev) => {
        const exists = prev.some((r) => r.rideId === data.rideId);
        if (exists) return prev;
        return [{ ...data, members: data.members || [] }, ...prev];
      });
    });

    socket.on('ride_member_joined', (data) => {
      setAvailableRides((prev) => prev.filter((r) => r.rideId !== data.rideId));
    });

    return () => {
      socket.off('new_shared_ride');
      socket.off('ride_member_joined');
      socket.disconnect();
    };
  }, []);

  const fetchAvailableRides = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rides/available');
      setAvailableRides(response.data || []);
    } catch (err) {
      console.error('Error fetching available rides:', err);
      Alert.alert('Error', 'Failed to load available rides.');
    } finally {
      setLoading(false);
    }
  };

  const joinRide = async (rideId) => {
    try {
      const response = await api.post(`/rides/${rideId}/join`);
      if (response.data.chatroomId) {
        Alert.alert('Success', 'You have successfully joined this ride! A chatroom has been created.');
        navigation.navigate('Chatroom', { rideId });
      } else {
        Alert.alert('Success', 'You have successfully joined this ride!');
      }
      setAvailableRides((prev) => prev.filter((r) => r.rideId !== rideId));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Could not join ride. It might be full or taken.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading available rides...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {availableRides.length === 0 ? (
          <Text style={styles.emptyText}>No shared rides available right now. Be the first to request one!</Text>
        ) : (
          availableRides.map((ride) => {
            const currentMembers = ride.currentMembersCount || (ride.members ? ride.members.length : 0);
            const spotsLeft = (ride.membersCount || 2) - currentMembers;
            return (
              <View key={ride.rideId} style={styles.rideCard}>
                <Text style={styles.rideTitle}>Join This Ride</Text>
                {ride.rider && (
                  <Text style={styles.riderName}>Created by: {ride.rider.name}</Text>
                )}
                <Text style={styles.rideInfo}>From: {ride.pickup?.address || 'N/A'}</Text>
                <Text style={styles.rideInfo}>To: {ride.drop?.address || 'N/A'}</Text>
                {ride.rideDetailsScreenshot && (
                  <Image source={{ uri: ride.rideDetailsScreenshot }} style={styles.screenshot} />
                )}
                <Text style={styles.fareText}>Total fare: ₹{ride.totalFare || 0}</Text>
                <Text style={styles.fareText}>Your share: ₹{ride.memberShare || 0}</Text>
                <Text style={styles.membersText}>
                  Members: {currentMembers}/{ride.membersCount || 2} ({spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left)
                </Text>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => joinRide(ride.rideId)}
                >
                  <Text style={styles.acceptButtonText}>ACCEPT (Join)</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
  rideCard: {
    backgroundColor: '#fffbe6',
    borderWidth: 2,
    borderColor: '#ffc107',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  rideTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  riderName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rideInfo: {
    marginBottom: 5,
    fontSize: 14,
  },
  screenshot: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
  fareText: {
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 16,
  },
  membersText: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  acceptButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 15,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

