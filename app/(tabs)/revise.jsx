import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';

const SCHEDULED_TOPICS_KEY = '@scheduled_topics';
const STORAGE_KEY = '@learning_resources';

export default function ReviseScreen() {
  const [scheduledTopics, setScheduledTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newResource, setNewResource] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editingResource, setEditingResource] = useState(null);
  const [editedResource, setEditedResource] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadScheduledTopics();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    loadScheduledTopics();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const results = scheduledTopics.filter(topic => 
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
  }, [searchQuery, scheduledTopics]);

  const loadScheduledTopics = async () => {
    try {
      const storedData = await AsyncStorage.getItem(SCHEDULED_TOPICS_KEY);
      if (storedData) {
        setScheduledTopics(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Error loading scheduled topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTitle = async () => {
    if (editedTitle.trim() && selectedTopic) {
      const updatedTopics = scheduledTopics.map(topic => {
        if (topic.id === selectedTopic.id) {
          return {
            ...topic,
            title: editedTitle.trim()
          };
        }
        return topic;
      });
      
      setScheduledTopics(updatedTopics);
      setSelectedTopic(updatedTopics.find(t => t.id === selectedTopic.id) || null);
      setEditingTitle(false);
      
      await AsyncStorage.setItem(SCHEDULED_TOPICS_KEY, JSON.stringify(updatedTopics));
    }
  };

  const handleRemoveTopic = async (topic) => {
    Alert.alert(
      "Remove Scheduled Topic",
      "Are you sure you want to remove this topic from your schedule?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove from scheduled topics
              const updatedScheduledTopics = scheduledTopics.filter(t => t.id !== topic.id);
              setScheduledTopics(updatedScheduledTopics);
              await AsyncStorage.setItem(SCHEDULED_TOPICS_KEY, JSON.stringify(updatedScheduledTopics));

              // Update the original topic in home screen
              const storedTopics = await AsyncStorage.getItem(STORAGE_KEY);
              if (storedTopics) {
                const topics = JSON.parse(storedTopics);
                const updatedTopics = topics.map(t => 
                  t.id === topic.id ? { ...t, isScheduled: false } : t
                );
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTopics));
              }

              // Close modal if the removed topic was selected
              if (selectedTopic?.id === topic.id) {
                setSelectedTopic(null);
              }
            } catch (error) {
              console.error('Error removing scheduled topic:', error);
            }
          }
        }
      ]
    );
  };

  const startEditing = () => {
    setEditedTitle(selectedTopic?.title || '');
    setEditingTitle(true);
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
      const updatedTopics = scheduledTopics.map(topic => {
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
      
      setScheduledTopics(updatedTopics);
      setSelectedTopic(updatedTopics.find(t => t.id === selectedTopic.id) || null);
      setEditingResource(null);
      setEditedResource('');
      
      await AsyncStorage.setItem(SCHEDULED_TOPICS_KEY, JSON.stringify(updatedTopics));
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
              const updatedTopics = scheduledTopics.map(topic => {
                if (topic.id === selectedTopic.id) {
                  return {
                    ...topic,
                    resources: topic.resources.filter(r => r !== resource)
                  };
                }
                return topic;
              });
              
              setScheduledTopics(updatedTopics);
              setSelectedTopic(updatedTopics.find(t => t.id === selectedTopic.id) || null);
              
              await AsyncStorage.setItem(SCHEDULED_TOPICS_KEY, JSON.stringify(updatedTopics));
            }
          }
        }
      ]
    );
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
        <ThemedText type="title">Scheduled Topics</ThemedText>
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
          {scheduledTopics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={styles.topicCard}
              onPress={() => setSelectedTopic(topic)}>
              <View style={styles.topicCardContent}>
                <ThemedText type="defaultSemiBold">{topic.title}</ThemedText>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveTopic(topic)}>
                  <MaterialIcons name="delete" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleText}>
                  Scheduled for: {topic.scheduledDate} at {topic.scheduledTime}
                </Text>
              </View>
              <Text style={{color: '#b8c1ec', fontWeight: 'bold'}}>{topic.resources.length} resources</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Topic Modal */}
      <Modal
        visible={selectedTopic !== null}
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
                      style={styles.removeButton}
                      onPress={() => handleRemoveTopic(selectedTopic)}>
                      <MaterialIcons name="delete" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
            
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleText}>
                Scheduled for: {selectedTopic?.scheduledDate} at {selectedTopic?.scheduledTime}
              </Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  topicsContainer: {
    gap: 12,
  },
  topicCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#232946',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  topicCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleInfo: {
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#121629',
    borderRadius: 8,
  },
  scheduleText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#55423d',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#55423d',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  removeButton: {
    padding: 8,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
}); 