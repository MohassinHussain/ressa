import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, Alert, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const STORAGE_KEY = '@learning_resources';
const SCHEDULED_TOPICS_KEY = '@scheduled_topics';

export default function HomeScreen() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newResource, setNewResource] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTopics, setScheduledTopics] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [selectedAmPm, setSelectedAmPm] = useState('');
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showHourDropdown, setShowHourDropdown] = useState(false);
  const [showMinuteDropdown, setShowMinuteDropdown] = useState(false);
  const [showAmPmDropdown, setShowAmPmDropdown] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [editedResource, setEditedResource] = useState('');

  const days = Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = [
    '01', '02', '03', '04', '05', '06', 
    '07', '08', '09', '10', '11', '12'
  ];
  const years = Array.from({length: 5}, (_, i) => (new Date().getFullYear() + i).toString());
  const hours = Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'));
  const amPmOptions = ['AM', 'PM'];

  // Load data from AsyncStorage on initial render
  useEffect(() => {
    loadData();
    loadScheduledTopics();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const results = topics.filter(topic => 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.resources.some(resource => 
          resource.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setSearchResults(results);
    } else {
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
          { id: '1', title: 'This is an Example', resources: ['Example Documentation', 'https://github.com'] },
          // { id: '2', title: 'JavaScript', resources: ['MDN JavaScript Guide', 'JavaScript.info'] },
          // { id: '3', title: 'TypeScript', resources: ['TypeScript Handbook', 'TypeScript Deep Dive'] },
          // { id: '4', title: 'UI/UX Design', resources: ['Material Design Guidelines', 'Figma Tutorials'] },
          // { id: '5', title: 'Data Structures', resources: ['Big O Notation Guide', 'Algorithms Book'] },
        ];
        setTopics(defaultTopics);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTopics));
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
      console.error('Error loading scheduled topics:', error);
    }
  };

  const saveData = async (updatedTopics) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTopics));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const saveScheduledTopic = async (topic, time, date) => {
    try {
      const scheduledTopic = {
        ...topic,
        scheduledTime: time,
        scheduledDate: date,
        isScheduled: true
      };

      const updatedScheduledTopics = [...scheduledTopics, scheduledTopic];
      setScheduledTopics(updatedScheduledTopics);
      await AsyncStorage.setItem(SCHEDULED_TOPICS_KEY, JSON.stringify(updatedScheduledTopics));

      // Update the original topic to show it's scheduled
      const updatedTopics = topics.map(t => 
        t.id === topic.id ? { ...t, isScheduled: true } : t
      );
      setTopics(updatedTopics);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTopics));
    } catch (error) {
      console.error('Error saving scheduled topic:', error);
    }
  };

  const handleAddResource = async () => {
    if (newResource.trim() && selectedTopic) {
      const updatedTopics = topics.map(topic => {
        if (topic.id === selectedTopic.id) {
          return {
            ...topic,
            resources: [...topic.resources, newResource.trim()]
          };
        }
        return topic;
      });
      
      setTopics(updatedTopics);
      setSelectedTopic(updatedTopics.find(t => t.id === selectedTopic.id) || null);
      setNewResource('');
      
      await saveData(updatedTopics);
    }
  };

  const handleEditTitle = async () => {
    if (editedTitle.trim() && selectedTopic) {
      const updatedTopics = topics.map(topic => {
        if (topic.id === selectedTopic.id) {
          return {
            ...topic,
            title: editedTitle.trim()
          };
        }
        return topic;
      });
      
      setTopics(updatedTopics);
      setSelectedTopic(updatedTopics.find(t => t.id === selectedTopic.id) || null);
      setEditingTitle(false);
      
      await saveData(updatedTopics);
    }
  };

  const handleAddTopic = async () => {
    if (newTopicTitle.trim()) {
      const newTopic = {
        id: Date.now().toString(),
        title: newTopicTitle.trim(),
        resources: []
      };

      const updatedTopics = [...topics, newTopic];
      setTopics(updatedTopics);
      setSelectedTopic(newTopic);
      setNewTopicTitle('');
      setIsAddingTopic(false);
      
      await saveData(updatedTopics);
    }
  };

  const startEditing = () => {
    setEditedTitle(selectedTopic?.title || '');
    setEditingTitle(true);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <Text key={i} style={styles.highlightedText}>{part}</Text> : 
        part
    );
  };

  const handleSchedule = async () => {
    if (selectedTopic && selectedDay && selectedMonth && selectedYear && 
        selectedHour && selectedMinute && selectedAmPm) {
      const scheduledDate = `${selectedDay}-${selectedMonth}-${selectedYear}`;
      const scheduledTime = `${selectedHour}-${selectedMinute}-00 ${selectedAmPm}`;
      await saveScheduledTopic(selectedTopic, scheduledTime, scheduledDate);
      setIsScheduling(false);
      resetScheduleFields();
    }
  };

  const resetScheduleFields = () => {
    setSelectedDay('');
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedHour('');
    setSelectedMinute('');
    setSelectedAmPm('');
  };

  const renderDropdown = (items, selectedValue, setSelectedValue, showDropdown, setShowDropdown) => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={() => setShowDropdown(!showDropdown)}>
        <Text style={styles.dropdownButtonText}>
          {selectedValue || 'Select'}
        </Text>
        <MaterialIcons 
          name={showDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
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
              }}>
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
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove from topics
              const updatedTopics = topics.filter(t => t.id !== topic.id);
              setTopics(updatedTopics);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTopics));

              // Remove from scheduled topics if exists
              const storedScheduledTopics = await AsyncStorage.getItem(SCHEDULED_TOPICS_KEY);
              if (storedScheduledTopics) {
                const scheduledTopics = JSON.parse(storedScheduledTopics);
                const updatedScheduledTopics = scheduledTopics.filter(t => t.id !== topic.id);
                await AsyncStorage.setItem(SCHEDULED_TOPICS_KEY, JSON.stringify(updatedScheduledTopics));
              }

              // Close modal if the deleted topic was selected
              if (selectedTopic?.id === topic.id) {
                setSelectedTopic(null);
              }
            } catch (error) {
              console.error('Error deleting topic:', error);
            }
          }
        }
      ]
    );
  };

  const isUrl = (str) => {
    try {
      new URL(str);
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
            onPress: () => Linking.openURL(resource)
          },
          {
            text: "Edit",
            onPress: () => {
              setEditingResource(resource);
              setEditedResource(resource);
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } else {
      setEditingResource(resource);
      setEditedResource(resource);
    }
  };

  const handleEditResource = async () => {
    if (editedResource.trim() && selectedTopic && editingResource) {
      const updatedTopics = topics.map(topic => {
        if (topic.id === selectedTopic.id) {
          return {
            ...topic,
            resources: topic.resources.map(resource => 
              resource === editingResource ? editedResource.trim() : resource
            )
          };
        }
        return topic;
      });
      
      setTopics(updatedTopics);
      setSelectedTopic(updatedTopics.find(t => t.id === selectedTopic.id) || null);
      setEditingResource(null);
      setEditedResource('');
      
      await saveData(updatedTopics);
    }
  };

  const handleDeleteResource = async (resource) => {
    Alert.alert(
      "Delete Resource",
      "Are you sure you want to delete this resource?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (selectedTopic) {
              const updatedTopics = topics.map(topic => {
                if (topic.id === selectedTopic.id) {
                  return {
                    ...topic,
                    resources: topic.resources.filter(r => r !== resource)
                  };
                }
                return topic;
              });
              
              setTopics(updatedTopics);
              setSelectedTopic(updatedTopics.find(t => t.id === selectedTopic.id) || null);
              
              await saveData(updatedTopics);
            }
          }
        }
      ]
    );
  };

  const handleShareOptions = (topic) => {
    Alert.alert(
      "Export Resources",
      "Choose export format",
      [
        {
          text: "JSON",
          onPress: () => handleExportJSON(topic)
        },
        {
          text: "PDF",
          onPress: () => handleExportPDF(topic)
        },
        {
          text: "DOCX",
          onPress: () => handleExportDOCX(topic)
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const handleExportJSON = async (topic) => {
    try {
      const exportData = {
        title: topic.title,
        resources: topic.resources
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileUri = FileSystem.documentDirectory + `${topic.title.replace(/\s+/g, '_')}.json`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: `Share ${topic.title} Resources`
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
            ${topic.resources.map((resource, index) => 
              `<div class="resource">${index + 1}. ${resource}</div>`
            ).join('')}
          </body>
        </html>
      `;

      const fileUri = FileSystem.documentDirectory + `${topic.title.replace(/\s+/g, '_')}.pdf`;
      
      // Note: You'll need to implement actual PDF generation here
      // This is a placeholder for the PDF export functionality
      Alert.alert("Info", "PDF export will be implemented in the next update");
    } catch (error) {
      Alert.alert("Error", "Failed to export PDF file");
    }
  };

  const handleExportDOCX = async (topic) => {
    try {
      // Note: You'll need to implement actual DOCX generation here
      // This is a placeholder for the DOCX export functionality
      Alert.alert("Info", "DOCX export will be implemented in the next update");
    } catch (error) {
      Alert.alert("Error", "Failed to export DOCX file");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#232946" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">My Learning Resources</ThemedText>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics and resources..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#b8c1ec"
          />
          <MaterialIcons name="search" size={24} color="#b8c1ec" style={styles.searchIcon} />
        </View>
      </View>

      {isSearching && searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <ScrollView style={styles.searchResults}>
            {searchResults.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.searchResultItem}
                onPress={() => {
                  setSelectedTopic(topic);
                  setSearchQuery('');
                }}>
                <Text style={styles.searchResultTitle}>
                  {highlightText(topic.title, searchQuery)}
                </Text>
                {topic.resources.map((resource, index) => (
                  resource.toLowerCase().includes(searchQuery.toLowerCase()) && (
                    <Text key={index} style={styles.searchResultResource}>
                      {highlightText(resource, searchQuery)}
                    </Text>
                  )
                ))}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.content}>
        <ScrollView style={styles.topicsContainer}>
          {topics.map((topic) => (
            <View key={topic.id} style={styles.topicCardContainer}>
              <TouchableOpacity
                style={styles.topicCard}
                onPress={() => setSelectedTopic(topic)}>
                <View style={styles.topicCardContent}>
                  <ThemedText type="defaultSemiBold">{topic.title}</ThemedText>
                </View>
                <Text style={{color: '#b8c1ec', fontWeight: 'bold'}}>{topic.resources.length} resources</Text>
              </TouchableOpacity>
              <View style={styles.topicActions}>
                <TouchableOpacity 
                  style={styles.calendarButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedTopic(topic);
                    setIsScheduling(true);
                  }}>
                  <FontAwesome 
                    name="calendar" 
                    size={24} 
                    color={topic.isScheduled ? '#4CAF50' : '#b8c1ec'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteTopic(topic);
                  }}>
                  <MaterialIcons name="delete" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddingTopic(true)}>
          <ThemedText style={styles.addButtonText}>+ Add New Topic</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Add Topic Modal */}
      <Modal
        visible={isAddingTopic}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddingTopic(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setIsAddingTopic(false)}>
                <AntDesign name="caretleft" size={28} color="white" />
              </TouchableOpacity>
              <View style={styles.titleEditContainer}>
                <TextInput
                  style={styles.titleInput}
                  placeholder="Enter topic title..."
                  value={newTopicTitle}
                  onChangeText={setNewTopicTitle}
                  autoFocus
                  onSubmitEditing={handleAddTopic}
                />
                <TouchableOpacity 
                  style={styles.saveTitleButton}
                  onPress={handleAddTopic}>
                  <MaterialIcons name="check" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            
            
            <View style={styles.newResourceContainer}>
              <TextInput
                style={styles.newResourceInput}
                placeholder="Add your first resource..."
                value={newResource}
                onChangeText={setNewResource}
                onSubmitEditing={handleAddResource}
              />
              <TouchableOpacity 
                style={styles.addResourceButton}
                onPress={handleAddResource}>
                <Entypo name="add-to-list" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaButton}>
                <MaterialIcons name="perm-media" size={24} color="black" />
              </TouchableOpacity>
            </View>
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
        }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setSelectedTopic(null);
                  setEditingTitle(false);
                  setEditingResource(null);
                }}>
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
                    onPress={handleEditTitle}>
                    <MaterialIcons name="check" size={24} color="white" />
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
                      onPress={startEditing}>
                      <MaterialIcons name="edit" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.shareButton}
                      onPress={() => handleShareOptions(selectedTopic)}>
                      <MaterialIcons name="share" size={24} color="#b8c1ec" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            

            <ScrollView style={styles.resourcesList}>
              {selectedTopic?.resources.map((resource, index) => (
                <View key={index} style={styles.resourceItem}>
                  <Text style={styles.resourceNumber}>{index + 1}.</Text>
                  {editingResource === resource ? (
                    <View style={styles.resourceEditContainer}>
                      <TextInput
                        style={styles.resourceEditInput}
                        value={editedResource}
                        onChangeText={setEditedResource}
                        autoFocus
                        onSubmitEditing={handleEditResource}
                      />
                      <TouchableOpacity 
                        style={styles.saveResourceButton}
                        onPress={handleEditResource}>
                        <MaterialIcons name="check" size={24} color="white" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.resourceText}>{resource}</Text>
                  )}
                  <View style={styles.resourceActions}>
                    <TouchableOpacity 
                      style={styles.resourceActionButton}
                      onPress={() => handleResourceAction(resource)}>
                      <MaterialIcons 
                        name={isUrl(resource) ? "link" : "edit"} 
                        size={20} 
                        color="#b8c1ec" 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.resourceActionButton}
                      onPress={() => handleDeleteResource(resource)}>
                      <MaterialIcons name="delete" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
              <View>
                <Text style={{color: '#b8c1ec', fontSize: 12}}>Note: Add Media feature coming soon!</Text>
              </View>
            <View style={styles.newResourceContainer}>
              <TextInput
                style={styles.newResourceInput}
                placeholder="Add new resource..."
                value={newResource}
                onChangeText={setNewResource}
                onSubmitEditing={handleAddResource}
              />
              <TouchableOpacity 
                style={styles.addResourceButton}
                onPress={handleAddResource}>
                <Entypo name="add-to-list" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaButton}>
                <MaterialIcons name="perm-media" size={24} color="black" />
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
        onRequestClose={() => setIsScheduling(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setIsScheduling(false)}>
                <AntDesign name="caretleft" size={28} color="white" />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.modalTitle}>
                Schedule Topic
              </ThemedText>
            </View>
            
            <View style={styles.scheduleInputContainer}>
              <Text style={styles.scheduleLabel}>Date:</Text>
              <View style={styles.dateTimeRow}>
                {renderDropdown(days, selectedDay, setSelectedDay, showDayDropdown, setShowDayDropdown)}
                {renderDropdown(months, selectedMonth, setSelectedMonth, showMonthDropdown, setShowMonthDropdown)}
                {renderDropdown(years, selectedYear, setSelectedYear, showYearDropdown, setShowYearDropdown)}
              </View>

              <Text style={styles.scheduleLabel}>Time:</Text>
              <View style={styles.dateTimeRow}>
                {renderDropdown(hours, selectedHour, setSelectedHour, showHourDropdown, setShowHourDropdown)}
                {renderDropdown(minutes, selectedMinute, setSelectedMinute, showMinuteDropdown, setShowMinuteDropdown)}
                {renderDropdown(amPmOptions, selectedAmPm, setSelectedAmPm, showAmPmDropdown, setShowAmPmDropdown)}
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.scheduleButton,
                (!selectedDay || !selectedMonth || !selectedYear || 
                 !selectedHour || !selectedMinute || !selectedAmPm) && styles.disabledButton
              ]}
              onPress={handleSchedule}
              disabled={!selectedDay || !selectedMonth || !selectedYear || 
                       !selectedHour || !selectedMinute || !selectedAmPm}>
              <Text style={styles.scheduleButtonText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121629',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#232946',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121629',
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 12,
    
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    padding: 12,
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchResultsContainer: {
    backgroundColor: '#121629',
    marginHorizontal: 16,
    borderRadius: 8,
    maxHeight: 200,
    marginTop: 16,
  },
  searchResults: {
    padding: 8,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#232946',
  },
  searchResultTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  searchResultResource: {
    color: '#b8c1ec',
    fontSize: 14,
    marginLeft: 8,
  },
  highlightedText: {
    backgroundColor: '#FFD700',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  topicsContainer: {
    gap: 12,
  },
  topicCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  topicCard: {
    width: '80%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#232946',
    borderWidth: 1,
    borderColor: '#b8c1ec',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topicCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    padding: 4,
  },
  addButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#55423d',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f0e17',
    height: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    marginLeft: 8,
    fontSize: 20,
    color: 'white',
  },
  titleInput: {
    flex: 1,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
    fontSize: 20,
  },
  editTitleButton: {
    padding: 8,
    marginLeft: 8,
  },
  saveTitleButton: {
    padding: 8,
    marginLeft: 8,
  },
  resourcesList: {
    flex: 1,
  },
  resourceItem: {
    flexDirection: 'row',
    backgroundColor: '#121629',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b8c1ec',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  resourceNumber: {
    color: '#fff',
    marginRight: 8,
    fontWeight: 'bold',
  },
  resourceText: {
    color: '#fff',
    flex: 1,
  },
  newResourceContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
  },
  newResourceInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  addResourceButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaButton: {
    width: '10%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarButton: {
    padding: 8,
  },
  scheduleInputContainer: {
    padding: 16,
  },
  scheduleLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scheduleButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  dropdownContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121629',
    padding: 12,
    borderRadius: 8,
  },
  dropdownButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  dropdownList: {
    maxHeight: 150,
    backgroundColor: '#121629',
    borderRadius: 8,
    marginTop: 4,
    position: 'absolute',
    width: '100%',
    zIndex: 1,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#232946',
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 16,
  },
  topicActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  resourceEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceEditInput: {
    flex: 1,
    backgroundColor: '#232946',
    color: '#fff',
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  resourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceActionButton: {
    padding: 4,
    marginLeft: 8,
  },
  saveResourceButton: {
    padding: 4,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    padding: 8,
    marginLeft: 8,
  },
}); 