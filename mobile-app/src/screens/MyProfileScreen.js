import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';
import { compressImage, imageToBase64 } from '../utils/imageCompression';

export default function MyProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    aadharNumber: '',
    panCardNumber: '',
  });
  const [aadharImage, setAadharImage] = useState(null);
  const [panCardImage, setPanCardImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      setUser(response.data);
      setForm({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        password: '',
        confirmPassword: '',
        aadharNumber: response.data.idVerification?.aadhar?.number || '',
        panCardNumber: response.data.idVerification?.panCard?.number || '',
      });
      if (response.data.idVerification?.aadhar?.document) {
        setAadharImage(response.data.idVerification.aadhar.document);
      }
      if (response.data.idVerification?.panCard?.document) {
        setPanCardImage(response.data.idVerification.panCard.document);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type) => {
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
      if (type === 'aadhar') {
        setAadharImage(result.assets[0].uri);
      } else if (type === 'panCard') {
        setPanCardImage(result.assets[0].uri);
      }
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (form.password && form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (form.password && form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };

      if (form.password) {
        updateData.password = form.password;
      }

      const idVerification = {};
      if (form.aadharNumber || aadharImage) {
        idVerification.aadhar = { number: form.aadharNumber.trim() };
        if (aadharImage && !aadharImage.startsWith('data:')) {
          const compressed = await compressImage(aadharImage);
          idVerification.aadhar.document = await imageToBase64(compressed);
        } else if (aadharImage) {
          idVerification.aadhar.document = aadharImage;
        }
      }
      if (form.panCardNumber || panCardImage) {
        idVerification.panCard = { number: form.panCardNumber.trim() };
        if (panCardImage && !panCardImage.startsWith('data:')) {
          const compressed = await compressImage(panCardImage);
          idVerification.panCard.document = await imageToBase64(compressed);
        } else if (panCardImage) {
          idVerification.panCard.document = panCardImage;
        }
      }

      if (Object.keys(idVerification).length > 0) {
        updateData.idVerification = idVerification;
      }

      const response = await api.put('/auth/me', updateData);
      setUser(response.data);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', err.response?.data?.msg || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {!editing ? (
          <>
            <View style={styles.header}>
              <Text style={styles.sectionTitle}>Profile Information</Text>
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.editButton}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{user?.name || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{user?.email || 'Not provided'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{user?.phone || 'Not provided'}</Text>
              </View>
            </View>
            <View style={styles.idSection}>
              <Text style={styles.sectionTitle}>ID Verification</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Aadhar Number:</Text>
                <Text style={styles.value}>{user?.idVerification?.aadhar?.number || 'Not provided'}</Text>
              </View>
              {aadharImage && (
                <Image source={{ uri: aadharImage }} style={styles.idImage} />
              )}
              <View style={styles.infoRow}>
                <Text style={styles.label}>PAN Card Number:</Text>
                <Text style={styles.value}>{user?.idVerification?.panCard?.number || 'Not provided'}</Text>
              </View>
              {panCardImage && (
                <Image source={{ uri: panCardImage }} style={styles.idImage} />
              )}
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.sectionTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditing(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Name *"
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                editable={!saving}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!saving}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={form.phone}
                onChangeText={(text) => setForm({ ...form, phone: text })}
                keyboardType="phone-pad"
                editable={!saving}
              />
              <TextInput
                style={styles.input}
                placeholder="New Password (leave blank to keep current)"
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
                secureTextEntry
                editable={!saving}
              />
              {form.password ? (
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Password"
                  value={form.confirmPassword}
                  onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                  secureTextEntry
                  editable={!saving}
                />
              ) : null}
              <View style={styles.idSection}>
                <Text style={styles.sectionTitle}>ID Verification</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Aadhar Number"
                  value={form.aadharNumber}
                  onChangeText={(text) => setForm({ ...form, aadharNumber: text })}
                  editable={!saving}
                />
                <TouchableOpacity style={styles.imageButton} onPress={() => pickImage('aadhar')}>
                  <Text style={styles.imageButtonText}>📷 Upload Aadhar Document</Text>
                </TouchableOpacity>
                {aadharImage && <Image source={{ uri: aadharImage }} style={styles.idImage} />}
                <TextInput
                  style={styles.input}
                  placeholder="PAN Card Number"
                  value={form.panCardNumber}
                  onChangeText={(text) => setForm({ ...form, panCardNumber: text })}
                  editable={!saving}
                />
                <TouchableOpacity style={styles.imageButton} onPress={() => pickImage('panCard')}>
                  <Text style={styles.imageButtonText}>📷 Upload PAN Card Document</Text>
                </TouchableOpacity>
                {panCardImage && <Image source={{ uri: panCardImage }} style={styles.idImage} />}
              </View>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  label: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#212529',
  },
  idSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
  },
  form: {
    gap: 15,
  },
  input: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  imageButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  imageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  idImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

