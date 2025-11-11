import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../utils/api';

export default function MyRidesScreen() {
  const [myRides, setMyRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchMyRides();
  }, []);

  const fetchMyRides = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rides/my-rides');
      setMyRides(response.data || []);
    } catch (err) {
      console.error('Error fetching my rides:', err);
      Alert.alert('Error', 'Failed to load your rides.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      awaiting_member_join: { bg: '#fff3cd', color: '#856404', text: 'Awaiting Members' },
      accepted: { bg: '#d4edda', color: '#155724', text: 'Accepted' },
      started: { bg: '#cce5ff', color: '#004085', text: 'In Progress' },
      completed: { bg: '#d1ecf1', color: '#0c5460', text: 'Completed' },
      cancelled: { bg: '#f8d7da', color: '#721c24', text: 'Cancelled' },
    };
    const style = statusColors[status] || { bg: '#e2e3e5', color: '#383d41', text: status };
    return { ...style };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading your rides...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {myRides.length === 0 ? (
          <Text style={styles.emptyText}>
            No rides yet. Request a ride to get started!
          </Text>
        ) : (
          myRides.map((ride) => {
            const spotsLeft = (ride.membersCount || 2) - (ride.currentMembersCount || ride.members?.length || 0);
            const statusStyle = getStatusBadge(ride.status);
            return (
              <View key={ride.rideId} style={styles.rideCard}>
                <View style={styles.rideHeader}>
                  <View>
                    <Text style={styles.rideTitle}>
                      {ride.isCreator ? '🛵 Your Requested Ride' : '👥 Joined Ride'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>
                      {statusStyle.text}
                    </Text>
                  </View>
                </View>
                <Text style={styles.rideInfo}>From: {ride.pickup?.address || 'N/A'}</Text>
                <Text style={styles.rideInfo}>To: {ride.drop?.address || 'N/A'}</Text>
                <View style={styles.fareContainer}>
                  <View style={styles.fareItem}>
                    <Text style={styles.fareLabel}>Total Fare</Text>
                    <Text style={styles.fareValue}>₹{ride.totalFare || 0}</Text>
                  </View>
                  <View style={styles.fareItem}>
                    <Text style={styles.fareLabel}>Your Share</Text>
                    <Text style={styles.fareValue}>₹{ride.memberShare || 0}</Text>
                  </View>
                  <View style={styles.fareItem}>
                    <Text style={styles.fareLabel}>Members</Text>
                    <Text style={styles.fareValue}>
                      {ride.currentMembersCount || ride.members?.length || 0}/{ride.membersCount || 2}
                    </Text>
                  </View>
                </View>
                {ride.status === 'accepted' && (
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => navigation.navigate('Chatroom', { rideId: ride.rideId })}
                  >
                    <Text style={styles.chatButtonText}>💬 Open Chatroom</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rideTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rideInfo: {
    marginBottom: 8,
    fontSize: 14,
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  fareItem: {
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  fareValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 15,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

