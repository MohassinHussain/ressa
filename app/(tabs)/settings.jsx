import { StyleSheet, View, Text, Switch, TouchableOpacity, Alert, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { ThemedText } from '@/components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Updates from 'expo-updates';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Link } from 'expo-router';

const STORAGE_KEYS = [
  '@learning_resources',
  '@scheduled_topics'
];

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const taglines = [
    "Organize, Save, Learn.",
    "Smart Resource Management, Made Simple.",
    "Keep your knowledge in check — with Ressa.",
    "Effortless Resource Tracking.",
    "Your Digital Resource Library."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();

      setCurrentTaglineIndex((prevIndex) =>
        prevIndex === taglines.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleNotificationToggle = async (value) => {
    setNotifications(value);
    try {
      await AsyncStorage.setItem('@notifications_enabled', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving notification preference:', error);
    }
  };

  const handleDarkModeToggle = async (value) => {
    setDarkMode(value);
    try {
      await AsyncStorage.setItem('@dark_mode_enabled', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  useEffect(() => {
    // Load saved preferences
    const loadPreferences = async () => {
      try {
        const notificationsEnabled = await AsyncStorage.getItem('@notifications_enabled');
        const darkModeEnabled = await AsyncStorage.getItem('@dark_mode_enabled');

        if (notificationsEnabled !== null) {
          setNotifications(JSON.parse(notificationsEnabled));
        }
        if (darkModeEnabled !== null) {
          setDarkMode(JSON.parse(darkModeEnabled));
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, []);

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
      <View><Text style={{ color: '#b8c1ec', fontStyle: 'italic', fontSize: hp(1.5), textAlign: 'center', marginBottom: hp(2), marginTop: hp(2) }}>
        Focus: App is under development.
      </Text></View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info" size={hp(2.5)} color="#b8c1ec" />
            <ThemedText type="subtitle" style={styles.sectionTitle}>About Ressa</ThemedText>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.description}>
              Ressa is your personal resource management app designed to help you organize, track, and access your learning materials efficiently.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="settings" size={hp(2.5)} color="#b8c1ec" />
            <ThemedText type="subtitle" style={styles.sectionTitle}>App Settings</ThemedText>
          </View>
          <View style={styles.sectionContent}>
            {/* <View style={styles.settingItem}>
              <Text style={styles.settingText}>Dark Mode</Text>
              <Switch
                value={darkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={darkMode ? '#2196F3' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View> */}
            {/* <View style={styles.settingItem}>
              <Text style={styles.settingText}>Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={notifications ? '#2196F3' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View> */}
            <Link  href="https://docs.google.com/document/d/1eRYMYS-w1wDfgUjq89birFIH1cUpBctI/edit?usp=sharing&ouid=110889650968495214776&rtpof=true&sd=true" style={styles.settingItem}>
              <TouchableOpacity  >
              <Text style={styles.settingText}>Read Docs</Text>
              </TouchableOpacity>
              {/* <MaterialIcons name="cloud-upload" size={hp(2.5)} color="#b8c1ec" /> */}
            </Link>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="help" size={hp(2.5)} color="#b8c1ec" />
            <ThemedText type="subtitle" style={styles.sectionTitle}>Help & Support</ThemedText>
          </View>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>FAQ</Text>
              <MaterialIcons name="help-outline" size={hp(2.5)} color="#b8c1ec" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Contact Support</Text>
              <MaterialIcons name="email" size={hp(2.5)} color="#b8c1ec" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.clearDataButton}
          onPress={handleClearData}>
          <MaterialIcons name="delete-forever" size={24} color="#ff4444" />
          <Text style={styles.clearDataText}>Clear My Data</Text>
        </TouchableOpacity>
        <Text style={styles.cautionDescription}>
          Caution: This will remove all your topics, resources, and scheduled items. This action cannot be undone.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#232946',
  },
  taglineContainer: {
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  tagline: {
    color: '#b8c1ec',
    fontStyle: 'italic',
    fontSize: hp(1.5),
    textAlign: 'center',
    marginVertical: hp(0.5),
  },
  content: {
    flex: 1,
    padding: wp('4%'),
  },
  section: {
    marginBottom: hp('4%'),
    backgroundColor: '#232946',
    borderRadius: wp('2%'),
    padding: wp('4%'),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  sectionTitle: {
    marginLeft: wp('2%'),
    color: '#b8c1ec',
  },
  sectionContent: {
    marginTop: hp('1%'),
  },
  description: {
    color: '#b8c1ec',
    fontSize: wp('3%'),
    lineHeight: hp('2.5%'),
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 0.4,
    borderBottomColor: '#b8c1ec',
  },
  settingText: {
    color: '#fff',
    fontSize: wp('3%'),
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
  cautionDescription: {
    color: '#b8c1ec',
    fontSize: hp(1.2),
    marginLeft: 8,
    marginBottom: hp(3),
  },
}); 