import { StyleSheet, View, Text, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ThemedText } from '@/components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Updates from 'expo-updates';

const STORAGE_KEYS = [
  '@learning_resources',
  '@scheduled_topics'
];

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear all your data? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all storage keys
              await Promise.all(
                STORAGE_KEYS.map(key => AsyncStorage.removeItem(key))
              );
              
              Alert.alert(
                "Data Cleared",
                "All your data has been cleared. The app will now restart.",
                [
                  {
                    text: "OK",
                    onPress: async () => {
                      try {
                        await Updates.reloadAsync();
                      } catch (error) {
                        Alert.alert("Error", "Failed to restart app. Please manually restart the app.");
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
      </View>
      <View style={styles.content}>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Enable Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>
        <TouchableOpacity 
          style={styles.clearDataButton}
          onPress={handleClearData}>
          <MaterialIcons name="delete-forever" size={24} color="#ff4444" />
          <Text style={styles.clearDataText}>Clear My Data</Text>
        </TouchableOpacity>
        <Text style={styles.clearDataDescription}>
          This will remove all your topics, resources, and scheduled items. This action cannot be undone.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121629',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#b8c1ec',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    fontSize: 16,
    color: '#fff',
  },
  clearDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232946',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
    marginBottom: 8,
    marginTop: 16,
  },
  clearDataText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  clearDataDescription: {
    color: '#b8c1ec',
    fontSize: 14,
    marginLeft: 8,
  },
}); 