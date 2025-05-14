import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  Image,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Collapsible } from "@/components/Collapsible";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import axios from "axios";
import AIResponseModal from "@/Modals/AIResponseModal";
import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";
import * as Calendar from 'expo-calendar';

const STORAGE_KEY = "@learning_resources";
const SCHEDULED_TOPICS_KEY = "@scheduled_topics";

export default function HomeScreen() {
  const navigation = useNavigation();

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newResource, setNewResource] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduledTopics, setScheduledTopics] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [availableCalendars, setAvailableCalendars] = useState([]);
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [editedResource, setEditedResource] = useState("");

  const [pickedImage, setPickedImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [aiResponseData, setAIResponseData] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [newSearchQuery, setNewSearchQuery] = useState("");
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Request calendar permissions
  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      setHasCalendarPermission(status === 'granted');
      
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        setAvailableCalendars(calendars);
        
        if (calendars.length > 0) {
          setSelectedCalendar(calendars[0]);
        }
      }
    })();
  }, []);

  const taglines = [
    "Organize, Save, Learn.",
    "Smart Resource Management, Made Simple.",
    "Keep your knowledge in check — with Ressa.",
    "Effortless Resource Tracking.",
    "Your Digital Resource Library.",
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
        }),
      ]).start();

      setCurrentTaglineIndex((prevIndex) =>
        prevIndex === taglines.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Load data from AsyncStorage on initial render
  useEffect(() => {
    loadData();
    loadScheduledTopics();
  }, [navigation]);

  // Handle search
  useEffect(() => {
    try {
      if (searchQuery.trim()) {
        setIsSearching(true);
        const results = topics.filter(topic =>
          topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.resources.some(resource =>
            typeof resource === 'string' && resource.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
        setSearchResults(results);
      } else {
        setIsSearching(false);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [searchQuery, topics]);

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setTopics(JSON.parse(storedData));
      } else {
        // Initialize with default topics if no data exists
        const defaultTopics = [
          {
            id: "1",
            title: "This is an Example",
            resources: ["Example Documentation", "https://github.com"],
          },
          // { id: '2', title: 'JavaScript', resources: ['MDN JavaScript Guide', 'JavaScript.info'] },
          // { id: '3', title: 'TypeScript', resources: ['TypeScript Handbook', 'TypeScript Deep Dive'] },
          // { id: '4', title: 'UI/UX Design', resources: ['Material Design Guidelines', 'Figma Tutorials'] },
          // { id: '5', title: 'Data Structures', resources: ['Big O Notation Guide', 'Algorithms Book'] },
        ];
        setTopics(defaultTopics);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTopics));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadScheduledTopics = async () => {
    try {
      const storedData = await AsyncStorage.getItem(SCHEDULED_TOPICS_KEY);
      if (storedData) {
        setScheduledTopics(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Error loading scheduled topics:", error);
    }
  };

  const saveData = async (updatedTopics) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTopics));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const saveScheduledTopic = async (topic, time, date) => {
    try {
      const scheduledTopic = {
        ...topic,
        scheduledTime: time,
        scheduledDate: date,
        isScheduled: true,
      };

      // Get existing scheduled topics
      const storedData = await AsyncStorage.getItem(SCHEDULED_TOPICS_KEY);
      let existingScheduledTopics = storedData ? JSON.parse(storedData) : [];
      
      // Remove any previous entries of this topic to avoid duplicates
      existingScheduledTopics = existingScheduledTopics.filter(t => t.id !== topic.id);
      
      // Add the newly scheduled topic
      const updatedScheduledTopics = [...existingScheduledTopics, scheduledTopic];
      
      setScheduledTopics(updatedScheduledTopics);
      await AsyncStorage.setItem(
        SCHEDULED_TOPICS_KEY,
        JSON.stringify(updatedScheduledTopics)
      );

      // Update the original topic to show it's scheduled
      const updatedTopics = topics.map((t) =>
        t.id === topic.id ? { ...t, isScheduled: true } : t
      );
      setTopics(updatedTopics);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTopics));
    } catch (error) {
      console.error("Error saving scheduled topic:", error);
    }
  };

  const handleAddResource = async () => {
    if (newResource.trim() && selectedTopic) {
      const updatedTopics = topics.map((topic) => {
        if (topic.id === selectedTopic.id) {
          return {
            ...topic,
            resources: [...topic.resources, newResource.trim()],
          };
        }
        return topic;
      });

      // Update main topics
      setTopics(updatedTopics);
      setSelectedTopic(
        updatedTopics.find((t) => t.id === selectedTopic.id) || null
      );
      await saveData(updatedTopics);

      // Update scheduled topics if the topic is scheduled
      const storedScheduledTopics = await AsyncStorage.getItem(SCHEDULED_TOPICS_KEY);
      if (storedScheduledTopics) {
        const scheduledTopics = JSON.parse(storedScheduledTopics);
        const updatedScheduledTopics = scheduledTopics.map((topic) => {
          if (topic.id === selectedTopic.id) {
            return {
              ...topic,
              resources: [...topic.resources, newResource.trim()],
            };
          }
          return topic;
        });
        await AsyncStorage.setItem(
          SCHEDULED_TOPICS_KEY,
          JSON.stringify(updatedScheduledTopics)
        );
      }

      setNewResource("");
    }
  };

  const handleEditTitle = async () => {
    if (editedTitle.trim() && selectedTopic) {
      const updatedTopics = topics.map((topic) => {
        if (topic.id === selectedTopic.id) {
          return {
            ...topic,
            title: editedTitle.trim(),
          };
        }
        return topic;
      });

      setTopics(updatedTopics);
      setSelectedTopic(
        updatedTopics.find((t) => t.id === selectedTopic.id) || null
      );
      setEditingTitle(false);

      await saveData(updatedTopics);
    }
  };

  const handleAddTopic = async () => {
    if (newTopicTitle.trim()) {
      const newTopic = {
        id: Date.now().toString(),
        title: newTopicTitle.trim(),
        resources: [],
      };

      const updatedTopics = [...topics, newTopic];
      setTopics(updatedTopics);
      setSelectedTopic(newTopic);
      setNewTopicTitle("");
      setIsAddingTopic(false);

      await saveData(updatedTopics);
    }
  };

  const startEditing = () => {
    setEditedTitle(selectedTopic?.title || "");
    setEditingTitle(true);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={i} style={styles.highlightedText}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  // Get list of months for selection
  const getMonthsList = () => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  };

  // Get available years (current year and next 5 years)
  const getYearsList = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 6; i++) {
      years.push((currentYear + i).toString());
    }
    return years;
  };

  // Get days in a month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get days list based on selected month and year
  const getDaysList = () => {
    if (!selectedMonth || !selectedYear) return [];
    
    const monthIndex = getMonthsList().findIndex(m => m === selectedMonth);
    const daysInMonth = getDaysInMonth(parseInt(selectedYear), monthIndex);
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i.toString());
    }
    return days;
  };

  // Format date for display
  const formatScheduleDate = () => {
    const currentDate = new Date();
    
    if (!selectedMonth && !selectedYear) {
      // If nothing is selected, use today's date
      const day = currentDate.getDate();
      const month = getMonthsList()[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      return `${day} ${month}, ${year}`;
    } else if (selectedMonth && selectedYear && !selectedDate) {
      // If month and year selected but no date, use 1st of the month
      return `1 ${selectedMonth}, ${selectedYear}`;
    } else if (selectedMonth && selectedYear && selectedDate) {
      // If all are selected, use the complete selection
      return `${selectedDate} ${selectedMonth}, ${selectedYear}`;
    } else if (selectedYear && !selectedMonth) {
      // If only year is selected, use January 1st
      return `1 January, ${selectedYear}`;
    } else {
      // For other cases, use today
      const day = currentDate.getDate();
      const month = getMonthsList()[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      return `${day} ${month}, ${year}`;
    }
  };

  // Get the actual date object from selections
  const getScheduleDate = () => {
    const currentDate = new Date();
    
    if (!selectedMonth && !selectedYear) {
      // If nothing is selected, use today
      return currentDate;
    } else if (selectedMonth && selectedYear && !selectedDate) {
      // If month and year selected but no date, use 1st of the month
      const monthIndex = getMonthsList().findIndex(m => m === selectedMonth);
      return new Date(parseInt(selectedYear), monthIndex, 1);
    } else if (selectedMonth && selectedYear && selectedDate) {
      // If all are selected, use the complete selection
      const monthIndex = getMonthsList().findIndex(m => m === selectedMonth);
      return new Date(parseInt(selectedYear), monthIndex, parseInt(selectedDate));
    } else if (selectedYear && !selectedMonth) {
      // If only year is selected, use January 1st
      return new Date(parseInt(selectedYear), 0, 1);
    } else {
      // For other cases, use today
      return currentDate;
    }
  };

  // Reset date selection fields
  const resetDateSelection = () => {
    setSelectedDate('');
    setSelectedMonth('');
    setSelectedYear('');
  };

  // Create an event in the calendar
  const createCalendarEvent = async (topic) => {
    try {
      if (!hasCalendarPermission || !selectedCalendar) {
        Alert.alert(
          "Calendar Access Required", 
          "Please grant calendar access to schedule topics"
        );
        return null;
      }

      // Get selected date or default to today
      const scheduleDate = getScheduleDate();
      
      // Set time to 9:00 AM
      scheduleDate.setHours(9, 0, 0, 0);
      
      // End time (1 hour after start)
      const endTime = new Date(scheduleDate);
      endTime.setHours(endTime.getHours() + 1);

      const eventDetails = {
        title: `Study: ${topic.title}`,
        notes: `Review your learning resources for ${topic.title}`,
        startDate: scheduleDate,
        endDate: endTime,
        calendarId: selectedCalendar.id,
      };

      // Create the event
      const eventId = await Calendar.createEventAsync(selectedCalendar.id, eventDetails);
      return { 
        eventId, 
        date: scheduleDate.toISOString().split('T')[0],
        formattedDate: formatScheduleDate()
      };
    } catch (error) {
      console.error("Error creating calendar event:", error);
      Alert.alert("Error", "Failed to create calendar event");
      return null;
    }
  };

  const handleSchedule = async () => {
    if (selectedTopic) {
      const eventResult = await createCalendarEvent(selectedTopic);
      
      if (eventResult) {
        await saveScheduledTopic(
          selectedTopic, 
          "", // No time
          eventResult.formattedDate
        );
        
        Alert.alert(
          "Topic Scheduled", 
          `${selectedTopic.title} has been scheduled for ${eventResult.formattedDate}`
        );
        
        setIsScheduling(false);
        resetDateSelection();
      }
    }
  };

  const renderDropdown = (
    items,
    selectedValue,
    setSelectedValue,
    showDropdown,
    setShowDropdown
  ) => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowDropdown(!showDropdown)}
      >
        <Text style={styles.dropdownButtonText}>
          {selectedValue || "Select"}
        </Text>
        <MaterialIcons
          name={showDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={hp(2)}
          color="#b8c1ec"
        />
      </TouchableOpacity>
      {showDropdown && (
        <ScrollView style={styles.dropdownList}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedValue(item);
                setShowDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const handleDeleteTopic = async (topic) => {
    Alert.alert(
      "Delete Topic",
      "Are you sure you want to delete this topic and all its resources?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove from topics
              const updatedTopics = topics.filter((t) => t.id !== topic.id);
              setTopics(updatedTopics);
              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updatedTopics)
              );

              // Remove from scheduled topics if exists
              const storedScheduledTopics = await AsyncStorage.getItem(
                SCHEDULED_TOPICS_KEY
              );
              if (storedScheduledTopics) {
                const scheduledTopics = JSON.parse(storedScheduledTopics);
                const updatedScheduledTopics = scheduledTopics.filter(
                  (t) => t.id !== topic.id
                );
                await AsyncStorage.setItem(
                  SCHEDULED_TOPICS_KEY,
                  JSON.stringify(updatedScheduledTopics)
                );
              }

              // Close modal if the deleted topic was selected
              if (selectedTopic?.id === topic.id) {
                setSelectedTopic(null);
              }
            } catch (error) {
              console.error("Error deleting topic:", error);
            }
          },
        },
      ]
    );
  };

  const isUrl = (str) => {
    const domainExtensions = [
      ".com",
      ".org",
      ".net",
      ".io",
      ".edu",
      ".gov",
      ".me",
      ".co",
      ".app",
    ];
    const hasLikelyDomain =
      domainExtensions.some((ext) => str.includes(ext)) ||
      str.includes("www.") ||
      str.includes("https://") ||
      str.includes("http://");

    if (!hasLikelyDomain) return false;

    const match =
      str.match(/https?:\/\/[^\s]+/) ||
      str.match(/www\.[^\s]+/) ||
      str.match(/[^\s]+\.(com|org|net|io|edu|gov|me|co|app)/);

    if (!match) return false;

    try {
      // Add protocol if not present (for URL constructor to work)
      const url = match[0].startsWith("http")
        ? match[0]
        : `https://${match[0]}`;
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleResourceAction = (resource) => {
    if (isUrl(resource)) {
      Alert.alert(
        "Resource Action",
        "What would you like to do with this link?",
        [
          {
            text: "Open Link",
            onPress: () => Linking.openURL(resource),
          },
          {
            text: "Edit",
            onPress: () => {
              setEditingResource(resource);
              setEditedResource(resource);
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } else {
      setEditingResource(resource);
      setEditedResource(resource);
    }
  };

  

  const handleEditResource = async () => {
    if (editedResource.trim() && selectedTopic && editingResource) {
      const updatedTopics = topics.map((topic) => {
        if (topic.id === selectedTopic.id) {
          return {
            ...topic,
            resources: topic.resources.map((resource) =>
              resource === editingResource ? editedResource.trim() : resource
            ),
          };
        }
        return topic;
      });

      // Update main topics
      setTopics(updatedTopics);
      setSelectedTopic(
        updatedTopics.find((t) => t.id === selectedTopic.id) || null
      );
      await saveData(updatedTopics);

      // Update scheduled topics if the topic is scheduled
      const storedScheduledTopics = await AsyncStorage.getItem(SCHEDULED_TOPICS_KEY);
      if (storedScheduledTopics) {
        const scheduledTopics = JSON.parse(storedScheduledTopics);
        const updatedScheduledTopics = scheduledTopics.map((topic) => {
          if (topic.id === selectedTopic.id) {
            return {
              ...topic,
              resources: topic.resources.map((resource) =>
                resource === editingResource ? editedResource.trim() : resource
              ),
            };
          }
          return topic;
        });
        await AsyncStorage.setItem(
          SCHEDULED_TOPICS_KEY,
          JSON.stringify(updatedScheduledTopics)
        );
      }

      setEditingResource(null);
      setEditedResource("");
    }
  };

  const handleDeleteResource = async (resource) => {
    Alert.alert(
      "Delete Resource",
      "Are you sure you want to delete this resource?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (selectedTopic) {
              const updatedTopics = topics.map((topic) => {
                if (topic.id === selectedTopic.id) {
                  return {
                    ...topic,
                    resources: topic.resources.filter((r) => r !== resource),
                  };
                }
                return topic;
              });

              // Update main topics
              setTopics(updatedTopics);
              setSelectedTopic(
                updatedTopics.find((t) => t.id === selectedTopic.id) || null
              );
              await saveData(updatedTopics);

              // Update scheduled topics if the topic is scheduled
              const storedScheduledTopics = await AsyncStorage.getItem(SCHEDULED_TOPICS_KEY);
              if (storedScheduledTopics) {
                const scheduledTopics = JSON.parse(storedScheduledTopics);
                const updatedScheduledTopics = scheduledTopics.map((topic) => {
                  if (topic.id === selectedTopic.id) {
                    return {
                      ...topic,
                      resources: topic.resources.filter((r) => r !== resource),
                    };
                  }
                  return topic;
                });
                await AsyncStorage.setItem(
                  SCHEDULED_TOPICS_KEY,
                  JSON.stringify(updatedScheduledTopics)
                );
              }
            }
          },
        },
      ]
    );
  };

  const handleViewResource = async (resource) => {
    try {
      // Handle document type resources (uploaded files)
      if (typeof resource === 'object' && resource.type === 'document') {
        if (Platform.OS === 'android') {
          // For Android, we need to copy the file to a public directory first
          const publicDir = FileSystem.documentDirectory + 'downloads/';
          await FileSystem.makeDirectoryAsync(publicDir, { intermediates: true });

          // Get the filename from the resource
          const fileName = resource.name || 'download.jpg';
          const publicPath = publicDir + fileName;

          // Copy the file to public directory
          await FileSystem.copyAsync({
            from: resource.uri,
            to: publicPath
          });

          // Get a content URI that can be shared
          const contentUri = await FileSystem.getContentUriAsync(publicPath);

          // Open with system viewer/browser
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,  // FLAG_GRANT_READ_URI_PERMISSION
            type: resource.mimeType
          });
        } else {
          // For iOS, we can share directly
          await Sharing.shareAsync(resource.uri);
        }
      } else {
        // For URL type resources, open in browser
        const canOpen = await Linking.canOpenURL(resource);
        if (canOpen) {
          await Linking.openURL(resource);
        } else {
          Alert.alert('Error', 'Cannot open this URL in browser');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to open file. Please try again.');
    }
  };

  const handleShareOptions = (topic) => {
    Alert.alert("Export Resources", "Choose export format", [
      {
        text: "JSON",
        onPress: () => handleExportJSON(topic),
      },
      {
        text: "PDF",
        onPress: () => handleExportPDF(topic),
      },
      {
        text: "DOCX",
        onPress: () => handleExportDOCX(topic),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleExportJSON = async (topic) => {
    try {
      const exportData = {
        title: topic.title,
        resources: topic.resources,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileUri =
        FileSystem.documentDirectory +
        `${topic.title.replace(/\s+/g, "_")}.json`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: `Share ${topic.title} Resources`,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to export JSON file");
    }
  };

  const handleExportPDF = async (topic) => {
    try {
      const pdfContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial; padding: 20px; }
              h1 { color: #333; }
              .resource { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>${topic.title}</h1>
            <h2>Resources:</h2>
            ${topic.resources
              .map(
                (resource, index) =>
                  `<div class="resource">${index + 1}. ${resource}</div>`
              )
              .join("")}
          </body>
        </html>
      `;

      const fileUri =
        FileSystem.documentDirectory +
        `${topic.title.replace(/\s+/g, "_")}.pdf`;

      //  implement actual PDF generation here
      Alert.alert("Info", "PDF export will be implemented in the next update");
    } catch (error) {
      Alert.alert("Error", "Failed to export PDF file");
    }
  };

  const handleExportDOCX = async (topic) => {
    try {
      // implement actual DOCX generation here
      Alert.alert("Info", "DOCX export will be implemented in the next update");
    } catch (error) {
      Alert.alert("Error", "Failed to export DOCX file");
    }
  };

  const handleAddImageResource = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: [
          "image/*",
          "video/*",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
          "application/rtf",
        ],
      });

      if (!result.canceled && selectedTopic) {
        const documents = result.assets;
        const updatedTopics = topics.map((topic) => {
          if (topic.id === selectedTopic.id) {
            return {
              ...topic,
              resources: [
                ...topic.resources,
                ...documents.map((doc) => ({
                  type: "document",
                  uri: doc.uri,
                  name: doc.name,
                  mimeType: doc.mimeType,
                  size: doc.size,
                })),
              ],
            };
          }
          return topic;
        });

        setTopics(updatedTopics);
        setSelectedTopic(
          updatedTopics.find((t) => t.id === selectedTopic.id) || null
        );
        await saveData(updatedTopics);
      }
    } catch (error) {
      console.error("Error picking documents:", error);
      Alert.alert("Error", "Failed to add documents");
    }
  };

  const isImage = (resource) => {
    if (typeof resource === "object" && resource.type === "document") {
      return resource.mimeType.startsWith("image/");
    }
    if (typeof resource === "string") {
      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".webp",
      ];
      return imageExtensions.some((ext) =>
        resource.toLowerCase().endsWith(ext)
      );
    }
    return false;
  };

  const isDocument = (resource) => {
    return typeof resource === "object" && resource.type === "document";
  };

  const getDocumentIcon = (mimeType) => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "videocam";
    if (mimeType === "application/pdf") return "picture-as-pdf";
    if (mimeType.includes("word")) return "description";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "table-chart";
    if (mimeType === "text/plain") return "text-fields";
    return "insert-drive-file";
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData();
    loadScheduledTopics();
    setRefreshing(false);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#232946" />
      </View>
    );
  }

  const handleFetchButton = async () => {
    try {
      console.log("Clicked");
      setShowAIResponse(true); // Show modal first
      setIsLoadingAI(true);

      const form = new FormData();
      // if (customQuery) {
      //   form.append("topicName", customQuery);
      // } else {
        form.append(
          "topicName",
          selectedTopic?.title || "Learning habits"
        );
      // }

      const res = await axios.post("http://onrender:5000", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // console.log("Response from backend", JSON.stringify(res.data, null, 2));
      setAIResponseData(res.data);
    } catch (error) {
      console.log("Error sending to backend: ", error);
      Alert.alert("Error", "Failed to fetch resources. Please try again.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSaveResources = async (resources) => {
    if (!selectedTopic) return;

    try {
      // Create a collapsible section with all the resources
      const collapsibleContent = {
        type: "collapsible",
        title: "RESOURCES FROM INTERNET",
        content: resources,
      };

      // Update the selected topic with the new collapsible resource
      const updatedTopics = topics.map((topic) => {
        if (topic.id === selectedTopic.id) {
          // Check if the collapsible already exists
          const existingCollapsibleIndex = topic.resources.findIndex(
            (resource) =>
              typeof resource === "object" &&
              resource.type === "collapsible" &&
              resource.title === "RESOURCES FROM INTERNET"
          );

          if (existingCollapsibleIndex !== -1) {
            // Update existing collapsible
            const updatedResources = [...topic.resources];
            updatedResources[existingCollapsibleIndex] = collapsibleContent;
            return {
              ...topic,
              resources: updatedResources,
            };
          } else {
            // Add new collapsible
            return {
              ...topic,
              resources: [...topic.resources, collapsibleContent],
            };
          }
        }
        return topic;
      });

      setTopics(updatedTopics);
      setSelectedTopic(updatedTopics.find((t) => t.id === selectedTopic.id));
      await saveData(updatedTopics);
    } catch (error) {
      console.error("Error saving resources to topic:", error);
      Alert.alert("Error", "Failed to save resources to topic");
    }
  };

  const renderCollapsibleResource = (resource, index) => {
    const handleDeleteCollapsible = async () => {
      Alert.alert(
        "Delete Resources",
        "Are you sure you want to delete all internet resources?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const updatedTopics = topics.map((topic) => {
                  if (topic.id === selectedTopic.id) {
                    return {
                      ...topic,
                      resources: topic.resources.filter((_, i) => i !== index),
                    };
                  }
                  return topic;
                });

                setTopics(updatedTopics);
                setSelectedTopic(
                  updatedTopics.find((t) => t.id === selectedTopic.id)
                );
                await saveData(updatedTopics);
              } catch (error) {
                console.error("Error deleting resources:", error);
                Alert.alert("Error", "Failed to delete resources");
              }
            },
          },
        ]
      );
    };

    return (
      <View key={`collapsible-${index}`} style={styles.resourceItem}>
        <View style={styles.collapsibleHeader}>
          {/* <Collapsible title={resource.title} /> */}
          <TouchableOpacity
            style={styles.deleteCollapsibleButton}
            onPress={handleDeleteCollapsible}
          >
            <MaterialIcons name="delete" size={hp(2)} color="#ff4444" />
          </TouchableOpacity>
        </View>
        <Collapsible title={resource.title}>
          {resource.content.articles &&
            resource.content.articles.length > 0 && (
              <View key="articles-section" style={styles.section}>
                <ThemedText type="subtitle" style={{ marginBottom: hp(2) }}>
                  Articles
                </ThemedText>
                {resource.content.articles.map((article, articleIndex) => (
                  <TouchableOpacity
                    key={`article-${articleIndex}`}
                    style={styles.card}
                    onPress={() => Linking.openURL(article.link)}
                  >
                    <Text style={styles.cardTitle}>{article.title}</Text>
                    <Text style={styles.cardSummary}>{article.summary}</Text>
                    <Text style={styles.cardScore}>
                      Relevance Score: {(article.score * 100).toFixed(2)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

          {resource.content.videos && resource.content.videos.length > 0 && (
            <View key="videos-section" style={styles.section}>
              <ThemedText type="subtitle" style={{ marginBottom: hp(2) }}>
                Videos
              </ThemedText>
              {resource.content.videos.map((video, videoIndex) => (
                <TouchableOpacity
                  key={`video-${videoIndex}`}
                  style={styles.card}
                  onPress={() => Linking.openURL(video.href)}
                >
                  <Text style={styles.cardTitle}>{video.title}</Text>
                  <Text style={styles.cardSummary}>{video.body}</Text>
                  {video.upload_time && (
                    <Text style={styles.cardTime}>
                      Uploaded:{" "}
                      {new Date(video.upload_time).toLocaleDateString()}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {resource.content.images && resource.content.images.length > 0 && (
            <View key="images-section" style={styles.section}>
              <ThemedText type="subtitle" style={{ marginBottom: hp(2) }}>
                Images
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {resource.content.images.map((image, imageIndex) => (
                  <TouchableOpacity
                    key={`image-${imageIndex}`}
                    style={styles.imageCard}
                    onPress={() => Linking.openURL(image.image)}
                  >
                    <Image
                      source={{ uri: image.image }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                    <Text style={styles.imageTitle}>{image.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </Collapsible>
      </View>
    );
  };

  const openDocument = async (uri, mimeType) => {
    try {
      if (Platform.OS === "android") {
        // Create a public directory path
        const publicDir = FileSystem.documentDirectory + "public/";
        await FileSystem.makeDirectoryAsync(publicDir, { intermediates: true });

        // Get the file name from the URI
        const fileName = uri.split("/").pop();
        const publicPath = publicDir + fileName;

        // Copy the file to public directory
        await FileSystem.copyAsync({
          from: uri,
          to: publicPath,
        });

        // Create a content URI
        const contentUri = await FileSystem.getContentUriAsync(publicPath);

        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          type: mimeType,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
      } else {
        const supported = await Linking.canOpenURL(uri);
        if (supported) {
          await Linking.openURL(uri);
        } else {
          Alert.alert("Error", "No app available to open this document");
        }
      }
    } catch (error) {
      console.error("Error opening document:", error);
      Alert.alert("Error", "Failed to open document");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Ressa</ThemedText>
        <View style={styles.taglineContainer}>
          <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
            {taglines[currentTaglineIndex]}
          </Animated.Text>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics and resources..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#b8c1ec"
          />
          <MaterialIcons
            name="search"
            size={hp(2)}
            color="#b8c1ec"
            style={styles.searchIcon}
          />
        </View>
      </View>

      {isSearching &&  (
        <View style={styles.searchResultsContainer}>
          {searchResults.length > 0 ? (
            <ScrollView
              style={styles.searchResults}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }>
              {searchResults.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={styles.searchResultItem}
                  onPress={() => {
                    setSelectedTopic(topic);
                    setSearchQuery('');
                    setIsSearching(false);
                  }}>
                  <Text style={styles.searchResultTitle}>
                    Title: {highlightText(topic.title, searchQuery)}
                  </Text>
                  {topic.resources.map((resource, index) => (
                    typeof resource === 'string' &&
                    resource.toLowerCase().includes(searchQuery.toLowerCase()) && (
                      <Text key={index} style={styles.searchResultResource}>
                        {highlightText(resource, searchQuery)}
                      </Text>
                    )
                  ))}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No results found</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.content}>
        <ScrollView
          style={styles.topicsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {topics.map((topic) => (
            <View key={topic.id} style={styles.topicCardContainer}>
              <TouchableOpacity
                style={styles.topicCard}
                onPress={() => setSelectedTopic(topic)}
              >
                <View style={styles.topicCardContent}>
                  <ThemedText type="defaultSemiBold">{topic.title}</ThemedText>
                </View>
                <Text style={{ color: "#b8c1ec", fontWeight: "bold" }}>
                  {topic.resources.length} resources
                </Text>
              </TouchableOpacity>
              <View style={styles.topicActions}>
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedTopic(topic);
                    setIsScheduling(true);
                  }}
                >
                  <FontAwesome
                    name="calendar"
                    size={hp(2)}
                    color={topic.isScheduled ? "#4CAF50" : "#b8c1ec"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteTopic(topic);
                  }}
                >
                  <MaterialIcons name="delete" size={hp(2)} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddingTopic(true)}
        >
          <ThemedText style={styles.addButtonText}>+ Add New Topic</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Fetch Data */}
      {/* <View style={{margin: 13}}>
        <Button title="Fetch" onPress={handleFetchButton}/>
      </View> */}

      {/* Add Topic Modal */}
      <Modal
        visible={isAddingTopic}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddingTopic(false)}
      >
        <View style={styles.addTopicModalContainer}>
          <View style={styles.addTopicModalContent}>
            <ThemedText type="title" style={styles.addTopicModalTitle}>
              Add New Topic
            </ThemedText>
            <TextInput
              style={styles.addTopicInput}
              placeholder="Enter topic title..."
              value={newTopicTitle}
              onChangeText={setNewTopicTitle}
              autoFocus
              onSubmitEditing={handleAddTopic}
              placeholderTextColor="#fff"
            />
            <TouchableOpacity
              style={styles.addTopicButton}
              onPress={handleAddTopic}
            >
              <ThemedText style={styles.addTopicButtonText}>
                Add Topic
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Topic Modal */}
      <Modal
        visible={selectedTopic !== null && !isAddingTopic}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setSelectedTopic(null);
          setEditingTitle(false);
          setEditingResource(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setSelectedTopic(null);
                  setEditingTitle(false);
                  setEditingResource(null);
                }}
              >
                <AntDesign name="caretleft" size={28} color="white" />
              </TouchableOpacity>
              {editingTitle ? (
                <View style={styles.titleEditContainer}>
                  <TextInput
                    style={styles.titleInput}
                    value={editedTitle}
                    onChangeText={setEditedTitle}
                    autoFocus
                    onSubmitEditing={handleEditTitle}
                  />
                  <TouchableOpacity
                    style={styles.saveTitleButton}
                    onPress={handleEditTitle}
                  >
                    <MaterialIcons name="check" size={hp(2)} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.titleContainer}>
                  <ThemedText type="title" style={styles.modalTitle}>
                    {selectedTopic?.title}
                  </ThemedText>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.editTitleButton}
                      onPress={startEditing}
                    >
                      <MaterialIcons name="edit" size={hp(2)} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.aiButton}
                      onPress={handleFetchButton}
                    >
                      <MaterialIcons
                        name="auto-awesome"
                        size={hp(2)}
                        color="#b8c1ec"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={() => handleShareOptions(selectedTopic)}
                    >
                      <MaterialIcons
                        name="share"
                        size={hp(2)}
                        color="#b8c1ec"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Resource items */}
            <ScrollView style={styles.resourcesList}>
              {selectedTopic?.resources.map((resource, index) => {
                if (
                  typeof resource === "object" &&
                  resource.type === "document"
                ) {
                  return (
                    <View key={index} style={styles.resourceItem}>
                      <Text style={styles.resourceNumber}>{index + 1}.</Text>
                      <Collapsible title={resource.name}>
                        <View style={styles.documentContainer}>
                          {resource.mimeType.startsWith("image/") ? (
                            <Image
                              source={{ uri: resource.uri }}
                              style={styles.documentImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <>
                              <MaterialIcons
                                name={getDocumentIcon(resource.mimeType)}
                                size={hp(4)}
                                color="#b8c1ec"
                              />
                              <View style={styles.documentInfo}>
                                <Text style={styles.documentName}>
                                  {resource.name}
                                </Text>
                                <Text style={styles.documentSize}>
                                  {(resource.size / 1024 / 1024).toFixed(2)} MB
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.documentActionButton}
                                onPress={() =>
                                  openDocument(resource.uri, resource.mimeType)
                                }
                              >
                                <MaterialIcons
                                  name="open-in-new"
                                  size={hp(2)}
                                  color="#b8c1ec"
                                />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </Collapsible>
                      <View style={styles.resourceActions}>
                        <TouchableOpacity
                          style={styles.resourceActionButton}
                          onPress={() => handleViewResource(resource)}
                        >
                          <MaterialIcons
                            name={isImage(resource) ? "visibility" : "open-in-new"}
                            size={20}
                            color="#b8c1ec"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.resourceActionButton}
                          onPress={() => handleDeleteResource(resource)}
                        >
                          <MaterialIcons
                            name="delete"
                            size={20}
                            color="#ff4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                } else if (
                  typeof resource === "object" &&
                  resource.type === "collapsible"
                ) {
                  return renderCollapsibleResource(resource, index);
                } else {
                  return (
                    <View key={index} style={styles.resourceItem}>
                      <Text style={styles.resourceNumber}>{index + 1}.</Text>
                      {editingResource === resource ? (
                        <View style={styles.resourceEditContainer}>
                          <TextInput
                            multiline
                            numberOfLines={8}
                            maxLength={700}
                            style={styles.resourceEditInput}
                            value={editedResource}
                            onChangeText={setEditedResource}
                            autoFocus
                            onSubmitEditing={handleEditResource}
                          />
                          <TouchableOpacity
                            style={styles.saveResourceButton}
                            onPress={handleEditResource}
                          >
                            <MaterialIcons
                              name="check"
                              size={24}
                              color="white"
                            />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          {isImage(resource) ? (
                            <Collapsible title="View Image">
                              <Image
                                source={{ uri: resource }}
                                style={styles.resourceImage}
                                resizeMode="contain"
                              />
                            </Collapsible>
                          ) : (
                            <View>
                              {isUrl(resource) ? (
                                <TouchableOpacity
                                  onPress={() => Linking.openURL(resource)}
                                >
                                  <Text style={{ color: "#b8c1ec" }}>
                                    {resource}
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <Text style={{ color: "white" }}>
                                  {resource}
                                </Text>
                              )}
                            </View>
                          )}
                        </>
                      )}
                      <View style={styles.resourceActions}>
                        <TouchableOpacity
                          style={styles.resourceActionButton}
                          onPress={() => handleResourceAction(resource)}
                        >
                          <MaterialIcons
                            name={
                              isUrl(resource)
                                ? "link"
                                : isImage(resource)
                                ? "image"
                                : "edit"
                            }
                            size={20}
                            color="#b8c1ec"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.resourceActionButton}
                          onPress={() => handleDeleteResource(resource)}
                        >
                          <MaterialIcons
                            name="delete"
                            size={20}
                            color="#ff4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }
              })}
            </ScrollView>

            {/* add media note: DONE */}
            {/* <View>
              <Text style={{ color: '#b8c1ec', fontSize: hp('1.1%') }}>Note: Add Media feature coming soon!</Text>
            </View> */}
            <View style={styles.newResourceContainer}>
              <TextInput
                multiline
                numberOfLines={15}
                // maxLength={700}
                style={styles.newResourceInput}
                placeholder="Add new resource..."
                value={newResource}
                onChangeText={setNewResource}
                onSubmitEditing={handleAddResource}
                placeholderTextColor="#b8c1ec"
              />
              <TouchableOpacity
                style={styles.addResourceButton}
                onPress={handleAddResource}
              >
                <Entypo name="add-to-list" size={hp(2.5)} color="#B8C1EC" />
              </TouchableOpacity>

              {/* add image as resource */}

              <TouchableOpacity
                style={styles.mediaButton}
                onPress={handleAddImageResource}
              >
                <MaterialIcons
                  name="perm-media"
                  size={hp(2.5)}
                  color="#B8C1EC"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Scheduling Modal */}
      <Modal
        visible={isScheduling}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsScheduling(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setIsScheduling(false);
                  resetDateSelection();
                }}
              >
                <AntDesign name="caretleft" size={28} color="white" />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.modalTitle}>
                Schedule Topic
              </ThemedText>
            </View>
            
            <View style={styles.scheduleInputContainer}>
              <Text style={styles.scheduleText}>
                Select a date to schedule "{selectedTopic?.title}"
              </Text>
              
              <View style={styles.dateSelectionContainer}>
                <Text style={styles.scheduleSectionTitle}>Date (optional)</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.datePickerRow}
                >
                  {getDaysList().map(day => (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[
                        styles.datePickerItem,
                        selectedDate === day && styles.selectedDateItem
                      ]}
                      onPress={() => setSelectedDate(day)}
                    >
                      <Text style={styles.datePickerText}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.dateSelectionContainer}>
                <Text style={styles.scheduleSectionTitle}>Month</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.datePickerRow}
                >
                  {getMonthsList().map(month => (
                    <TouchableOpacity
                      key={`month-${month}`}
                      style={[
                        styles.datePickerItem,
                        selectedMonth === month && styles.selectedDateItem
                      ]}
                      onPress={() => {
                        setSelectedMonth(month);
                        // Reset date when month changes
                        setSelectedDate('');
                      }}
                    >
                      <Text style={styles.datePickerText}>{month.substr(0, 3)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.dateSelectionContainer}>
                <Text style={styles.scheduleSectionTitle}>Year</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.datePickerRow}
                >
                  {getYearsList().map(year => (
                    <TouchableOpacity
                      key={`year-${year}`}
                      style={[
                        styles.datePickerItem,
                        selectedYear === year && styles.selectedDateItem
                      ]}
                      onPress={() => {
                        setSelectedYear(year);
                        // Reset date when year changes
                        setSelectedDate('');
                      }}
                    >
                      <Text style={styles.datePickerText}>{year}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.scheduleSummary}>
                <Text style={styles.scheduleSummaryText}>
                  Schedule for: {formatScheduleDate()}
                </Text>
              </View>
              
              {availableCalendars.length > 0 ? (
                <View style={styles.calendarSelection}>
                  <Text style={styles.scheduleSectionTitle}>Select Calendar</Text>
                  <ScrollView style={styles.calendarList}>
                    {availableCalendars.map((calendar) => (
                      <TouchableOpacity
                        key={calendar.id}
                        style={[
                          styles.calendarItem,
                          selectedCalendar?.id === calendar.id && styles.selectedCalendarItem
                        ]}
                        onPress={() => setSelectedCalendar(calendar)}
                      >
                        <View 
                          style={[
                            styles.calendarColor, 
                            { backgroundColor: calendar.color || '#4285F4' }
                          ]} 
                        />
                        <Text style={styles.calendarName}>{calendar.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <Text style={styles.noCalendarText}>
                  No calendars available. Please make sure calendar permissions are granted.
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.scheduleButton,
                (!hasCalendarPermission || !selectedCalendar) && styles.disabledButton
              ]}
              onPress={handleSchedule}
              disabled={!hasCalendarPermission || !selectedCalendar}
            >
              <Text style={styles.scheduleButtonText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Response Modal */}
      <AIResponseModal
        visible={showAIResponse}
        onClose={() => {
          setShowAIResponse(false);
          setAIResponseData(null);
        }}
        responseData={aiResponseData}
        isLoading={isLoadingAI}
        selectedTopic={selectedTopic}
        onSaveResources={handleSaveResources}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#232946",
  },
  header: {
    padding: wp("4%"),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: wp("2%"),
    marginTop: hp("2%"),
    paddingHorizontal: wp("3%"),
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    padding: wp("2%"),
    fontSize: wp("3%"),
  },
  searchIcon: {
    marginLeft: wp("2%"),
  },
  searchResultsContainer: {
    backgroundColor: "#121629",
    marginHorizontal: wp("4%"),
    borderRadius: wp("2%"),
    maxHeight: hp("25%"),
    marginTop: hp("2%"),
  },
  searchResults: {
    padding: wp("2%"),
  },
  searchResultItem: {
    padding: wp("3%"),
    borderBottomWidth: 1,
    borderBottomColor: "#232946",
  },
  searchResultTitle: {
    color: "#fff",
    fontSize: wp("3%"),
    fontWeight: "bold",
    marginBottom: hp("1%"),
  },
  searchResultResource: {
    color: "#b8c1ec",
    fontSize: wp("3.5%"),
    marginLeft: wp("2%"),
  },
  highlightedText: {
    backgroundColor: "#FFD700",
    color: "#000",
  },
  content: {
    flex: 1,
    padding: wp("4%"),
  },
  topicsContainer: {
    gap: hp("1.5%"),
  },
  topicCardContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("2%"),
    justifyContent: "space-between",
  },
  topicCard: {
    width: wp("70%"),
    padding: wp("4%"),
    borderRadius: wp("2%"),
    backgroundColor: "#1E1E1E",
    borderWidth: 0.4,
    borderColor: "#b8c1ec",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topicCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editButton: {
    padding: wp("1%"),
  },
  addButton: {
    marginTop: hp("2%"),
    padding: wp("4%"),
    backgroundColor: "#121212",
    borderRadius: wp("2%"),
    alignItems: "center",
    // borderWidth: 1,
    // borderColor: '#b8c1ec',
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  addTopicModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  addTopicModalContent: {
    backgroundColor: "#1E1E1E",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
  },
  addTopicModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  addTopicInput: {
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },
  addTopicButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
  },
  addTopicButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1E1E1E ",
    height: "100%",
    borderTopLeftRadius: wp("2.5%"),
    borderTopRightRadius: wp("2.5%"),
    padding: wp("4%"),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("2%"),
  },
  closeButton: {
    padding: wp("2%"),
  },
  titleContainer: {
    backgroundColor: "#1E1E1E",
    // flexDirection: 'row',
    alignItems: "center",
    flex: 1,
  },
  titleEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalTitle: {
    marginLeft: wp("2%"),
    fontSize: wp("4.2%"),
    color: "white",
  },
  titleInput: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    padding: wp("2%"),
    borderRadius: wp("2%"),
    marginLeft: wp("2%"),
    fontSize: wp("4%"),
    color: "#fff",
  },
  editTitleButton: {
    padding: wp("2%"),
    marginLeft: wp("2%"),
  },
  saveTitleButton: {
    padding: wp("2%"),
    marginLeft: wp("2%"),
  },
  resourcesList: {
    flex: 1,
  },
  resourceItem: {
    flexDirection: "row",
    backgroundColor: "#121212",
    padding: wp("3%"),
    borderRadius: wp("2%"),
    marginBottom: hp("1%"),
    alignItems: "center",
    borderWidth: 0.4,
    borderColor: "#b8c1ec",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    flexWrap: "wrap",
  },
  resourceNumber: {
    color: "#fff",
    marginRight: wp("2%"),
    fontWeight: "bold",
    width: wp("5%"),
  },
  resourceText: {
    color: "#fff",
    flex: 1,
    marginRight: wp("2%"),
    flexShrink: 1,
  },
  newResourceContainer: {
    flexDirection: "row",
    marginTop: hp("2%"),
    // marginBottom: hp('2%'),
    width: wp("95%"),
  },
  newResourceInput: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    padding: wp("3%"),
    borderRadius: wp("2%"),
    marginRight: wp("2%"),
    fontSize: wp("3%"),
    color: "#fff",
  },
  addResourceButton: {
    // backgroundColor: '#fff',
    padding: wp("4%"),
    borderRadius: wp("2%"),
    justifyContent: "center",
    alignItems: "center",
  },
  mediaButton: {
    // width: wp('10%'),
    // backgroundColor: '#fff',
    padding: wp("4%"),
    borderRadius: wp("2%"),
    marginLeft: wp("1%"),
    justifyContent: "center",
    alignItems: "center",
  },
  calendarButton: {
    padding: wp("2%"),
    // backgroundColor: "#232946",
    // borderRadius: wp("2%"),
    // borderWidth: 1,
    // borderColor: "#b8c1ec",
  },
  scheduleInputContainer: {
    padding: wp("4%"),
  },
  scheduleText: {
    color: "#ffffff",
    fontSize: wp("3.5%"),
    marginBottom: hp("2%"),
    textAlign: "center",
  },
  dateSelectionContainer: {
    marginBottom: hp("2%"),
  },
  scheduleSectionTitle: {
    color: "#b8c1ec",
    fontSize: wp("3.5%"),
    marginBottom: hp("1%"),
    fontWeight: "bold",
  },
  datePickerRow: {
    maxHeight: hp("6%"),
  },
  datePickerItem: {
    backgroundColor: "#232946",
    paddingVertical: hp("1%"),
    paddingHorizontal: wp("3%"),
    borderRadius: wp("2%"),
    marginRight: wp("2%"),
    alignItems: "center",
    justifyContent: "center",
    minWidth: wp("12%"),
  },
  selectedDateItem: {
    backgroundColor: "#4CAF50",
  },
  datePickerText: {
    color: "#ffffff",
    fontSize: wp("3.5%"),
  },
  scheduleSummary: {
    backgroundColor: "#2A3152",
    padding: wp("3%"),
    borderRadius: wp("2%"),
    marginVertical: hp("2%"),
  },
  scheduleSummaryText: {
    color: "#ffffff",
    fontSize: wp("3.5%"),
    textAlign: "center",
  },
  calendarSelection: {
    marginVertical: hp("2%"),
  },
  calendarList: {
    maxHeight: hp("30%"),
  },
  calendarItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp("3%"),
    backgroundColor: "#232946",
    borderRadius: wp("2%"),
    marginBottom: hp("1%"),
  },
  selectedCalendarItem: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  calendarColor: {
    width: wp("5%"),
    height: wp("5%"),
    borderRadius: wp("2.5%"),
    marginRight: wp("3%"),
  },
  calendarName: {
    color: "#ffffff",
    fontSize: wp("3.5%"),
  },
  noCalendarText: {
    color: "#ff4444",
    fontSize: wp("3.5%"),
    textAlign: "center",
    marginVertical: hp("2%"),
  },
  scheduleButton: {
    backgroundColor: "#4CAF50",
    padding: wp("4%"),
    borderRadius: wp("2%"),
    alignItems: "center",
    margin: wp("4%"),
  },
  scheduleButtonText: {
    color: "#fff",
    fontSize: wp("3%"),
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  dropdownContainer: {
    flex: 1,
    marginHorizontal: wp("1%"),
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#121629",
    padding: wp("3%"),
    borderRadius: wp("2%"),
  },
  dropdownButtonText: {
    color: "#fff",
    fontSize: wp("3%"),
  },
  dropdownList: {
    maxHeight: hp("30%"),
    backgroundColor: "#121629",
    borderRadius: wp("2%"),
    marginTop: hp("6%"),
    position: "absolute",
    width: "100%",
    zIndex: 1,
  },
  dropdownItem: {
    padding: wp("3%"),
    borderBottomWidth: 1,
    borderBottomColor: "#232946",
  },
  dropdownItemText: {
    color: "#fff",
    fontSize: wp("3%"),
  },
  topicActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: wp("2%"),
    gap: wp("2%"),
  },
  deleteButton: {
    padding: wp("2%"),
    // backgroundColor: "#232946",
    borderRadius: wp("2%"),
    // borderWidth: 1,
    // borderColor: "#ff4444",
  },
  resourceEditContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: wp("2%"),
  },
  resourceEditInput: {
    flex: 1,
    backgroundColor: "#232946",
    color: "#fff",
    padding: wp("2%"),
    borderRadius: wp("1%"),
    marginRight: wp("2%"),
    flexShrink: 1,
  },
  resourceActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  resourceActionButton: {
    padding: wp("1%"),
    marginLeft: wp("2%"),
    backgroundColor: "#232946",
    borderRadius: wp("1%"),
    borderWidth: 1,
    borderColor: "#b8c1ec",
  },
  saveResourceButton: {
    padding: wp("1%"),
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  shareButton: {
    padding: wp("2%"),
    marginLeft: wp("2%"),
  },
  resourceImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 1,
    borderRadius: wp("2%"),
    marginTop: hp("1%"),
    backgroundColor: "#232946",
  },
  collapsibleContainer: {
    backgroundColor: "#232946",
    borderRadius: wp("2%"),
    padding: wp("2%"),
    marginBottom: hp("1%"),
  },
  collapsibleTitle: {
    color: "#fff",
    fontSize: wp("4%"),
    fontWeight: "bold",
  },
  collapsibleContent: {
    marginTop: hp("1%"),
  },
  aiButton: {
    padding: wp("2%"),
    marginLeft: wp("2%"),
  },
  section: {
    marginBottom: hp("2%"),
  },
  card: {
    padding: wp("3%"),
    borderBottomWidth: 1,
    borderBottomColor: "#232946",
  },
  cardTitle: {
    color: "#fff",
    fontSize: wp("3%"),
    fontWeight: "bold",
  },
  cardSummary: {
    color: "#b8c1ec",
    fontSize: wp("3%"),
  },
  cardScore: {
    color: "#fff",
    fontSize: wp("3%"),
    fontWeight: "bold",
  },
  cardTime: {
    color: "#b8c1ec",
    fontSize: wp("3%"),
  },
  imageCard: {
    marginRight: wp("2%"),
  },
  image: {
    width: wp("100%"),
    height: undefined,
    aspectRatio: 1,
    borderRadius: wp("2%"),
  },
  imageTitle: {
    color: "#fff",
    fontSize: wp("3%"),
    fontWeight: "bold",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: wp("2%"),
  },
  deleteCollapsibleButton: {
    padding: wp("2%"),
  },
  taglineContainer: {
    marginTop: hp(1),
    // marginBottom: hp(2),
  },
  tagline: {
    color: "#b8c1ec",
    fontStyle: "italic",
    fontSize: hp(1.5),
    // textAlign: '',
    // marginVertical: hp(0.5),
  },

  documentContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp("3%"),
    backgroundColor: "#232946",
    borderRadius: wp("2%"),
    marginTop: hp("1%"),
  },
  documentInfo: {
    flex: 1,
    marginLeft: wp("2%"),
  },
  documentName: {
    color: "#fff",
    fontSize: wp("3%"),
  },
  documentSize: {
    color: "#b8c1ec",
    fontSize: wp("2.5%"),
    marginTop: hp("0.5%"),
  },
  documentActionButton: {
    padding: wp("2%"),
    marginLeft: wp("2%"),
  },
  documentImage: {
    width: "100%",
    height: hp("20%"),
    borderRadius: wp("2%"),
    backgroundColor: "#232946",
  },

  noResultsContainer: {
    padding: wp('4%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    color: '#b8c1ec',
    fontSize: wp('3%'),
    textAlign: 'center',
  },
});
