import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../utils/api';
import { compressImage, imageToBase64 } from '../utils/imageCompression';

export default function RequestRideScreen() {
  const [form, setForm] = useState({
    pickup: { lat: '', lng: '', address: '' },
    drop: { lat: '', lng: '', address: '' },
    totalFare: '',
    membersCount: '2',
    memberShare: 0,
  });
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fare = parseFloat(form.totalFare) || 0;
    const count = parseInt(form.membersCount) || 1;
    if (fare > 0 && count > 0) {
      const share = fare / count;
      setForm((prev) => ({ ...prev, memberShare: share.toFixed(2) }));
    } else {
      setForm((prev) => ({ ...prev, memberShare: 0 }));
    }
  }, [form.totalFare, form.membersCount]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setScreenshot(result.assets[0].uri);
    }
  };

  const submit = async () => {
    setLoading(true);

    if (!form.pickup.address || !form.drop.address || parseFloat(form.totalFare) <= 0 || parseInt(form.membersCount) < 2) {
      Alert.alert('Error', 'Please fill out all location, fare, and member details. Minimum 2 members required.');
      setLoading(false);
      return;
    }

    try {
      let screenshotBase64 = null;
      if (screenshot) {
        // Compress and convert to base64
        const compressedUri = await compressImage(screenshot);
        screenshotBase64 = await imageToBase64(compressedUri);
      }

      await api.post('/rides', {
        pickup: {
          lat: parseFloat(form.pickup.lat) || 0,
          lng: parseFloat(form.pickup.lng) || 0,
          address: form.pickup.address,
        },
        drop: {
          lat: parseFloat(form.drop.lat) || 0,
          lng: parseFloat(form.drop.lng) || 0,
          address: form.drop.address,
        },
        totalFare: parseFloat(form.totalFare),
        membersCount: parseInt(form.membersCount),
        memberShare: parseFloat(form.memberShare),
        rideDetailsScreenshot: screenshotBase64,
      });

      Alert.alert('Success', 'Shared Ride Requested! Awaiting members.');
      // Reset form
      setForm({
        pickup: { lat: '', lng: '', address: '' },
        drop: { lat: '', lng: '', address: '' },
        totalFare: '',
        membersCount: '2',
        memberShare: 0,
      });
      setScreenshot(null);
      navigation.navigate('AvailableRides');
    } catch (err) {
      console.error('Request ride error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        Alert.alert('Error', 'Session expired. Please login again.');
        navigation.replace('Login');
      } else if (err.code === 'ECONNREFUSED') {
        Alert.alert('Error', 'Cannot connect to server. Please make sure the backend server is running.');
      } else {
        Alert.alert('Error', err.response?.data?.msg || err.message || 'Request failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Location From (address)"
            value={form.pickup.address}
            onChangeText={(text) => setForm({ ...form, pickup: { ...form.pickup, address: text } })}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Location To (address)"
            value={form.drop.address}
            onChangeText={(text) => setForm({ ...form, drop: { ...form.drop, address: text } })}
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Total Fare Estimate"
            value={form.totalFare}
            onChangeText={(text) => setForm({ ...form, totalFare: text })}
            keyboardType="numeric"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Members Required (Including You)"
            value={form.membersCount}
            onChangeText={(text) => setForm({ ...form, membersCount: text })}
            keyboardType="numeric"
            editable={!loading}
          />
          <Text style={styles.shareText}>
            Calculated Your Share: <Text style={styles.shareValue}>₹{form.memberShare}</Text>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Details Screenshot (Optional)</Text>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage} disabled={loading}>
            <Text style={styles.imageButtonText}>📷 Pick Image</Text>
          </TouchableOpacity>
          {screenshot && (
            <Image source={{ uri: screenshot }} style={styles.previewImage} />
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>MAKE A REQUEST</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  shareText: {
    fontWeight: 'bold',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    fontSize: 16,
  },
  shareValue: {
    color: '#28a745',
  },
  imageButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  imageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

