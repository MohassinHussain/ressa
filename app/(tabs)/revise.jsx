import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, Alert, Linking, Share, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { ThemedText } from '@/components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

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
  const [refreshing, setRefreshing] = useState(false);
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
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
        <ScrollView 
          style={styles.topicsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
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
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  content: {
    flex: 1,
    padding: wp('4%'),
  },
  topicsContainer: {
    gap: hp('1.5%'),
  },
  topicCard: {
    padding: wp('4%'),
    borderRadius: wp('2%'),
    backgroundColor: '#232946',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: hp('2%'),
  },
  topicCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleInfo: {
    marginVertical: hp('1%'),
    padding: wp('2%'),
    backgroundColor: '#121629',
    borderRadius: wp('2%'),
  },
  scheduleText: {
    color: '#4CAF50',
    fontSize: wp('3.5%'),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#55423d',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#55423d',
    height: '100%',
    borderTopLeftRadius: wp('5%'),
    borderTopRightRadius: wp('5%'),
    padding: wp('4%'),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  closeButton: {
    padding: wp('2%'),
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
    marginLeft: wp('2%'),
    fontSize: wp('5%'),
    color: 'white',
  },
  titleInput: {
    flex: 1,
    backgroundColor: 'white',
    padding: wp('2%'),
    borderRadius: wp('2%'),
    marginLeft: wp('2%'),
    fontSize: wp('4%'),
  },
  editTitleButton: {
    padding: wp('2%'),
    marginLeft: wp('2%'),
  },
  saveTitleButton: {
    padding: wp('2%'),
    marginLeft: wp('2%'),
  },
  resourcesList: {
    flex: 1,
  },
  resourceItem: {
    flexDirection: 'row',
    backgroundColor: '#121629',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
    alignItems: 'center',
  },
  resourceNumber: {
    color: '#fff',
    marginRight: wp('2%'),
    fontWeight: 'bold',
  },
  resourceText: {
    color: '#fff',
    flex: 1,
  },
  removeButton: {
    padding: wp('2%'),
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
    padding: wp('2%'),
    borderRadius: wp('1%'),
    marginRight: wp('2%'),
  },
  resourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceActionButton: {
    padding: wp('1%'),
    marginLeft: wp('2%'),
  },
  saveResourceButton: {
    padding: wp('1%'),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121629',
    borderRadius: wp('2%'),
    marginTop: hp('2%'),
    paddingHorizontal: wp('3%'),
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    padding: wp('3%'),
    fontSize: wp('4%'),
  },
  searchIcon: {
    marginLeft: wp('2%'),
  },
  searchResultsContainer: {
    backgroundColor: '#121629',
    marginHorizontal: wp('4%'),
    borderRadius: wp('2%'),
    maxHeight: hp('25%'),
    marginTop: hp('2%'),
  },
  searchResults: {
    padding: wp('2%'),
  },
  searchResultItem: {
    padding: wp('3%'),
    borderBottomWidth: 1,
    borderBottomColor: '#232946',
  },
  searchResultTitle: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
  },
  searchResultResource: {
    color: '#b8c1ec',
    fontSize: wp('3.5%'),
    marginLeft: wp('2%'),
  },
  highlightedText: {
    backgroundColor: '#FFD700',
    color: '#000',
  },
}); 