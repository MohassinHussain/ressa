import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, Alert, Linking, Share, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { ThemedText } from '@/components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Collapsible } from '@/components/Collapsible';

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

  const loadScheduledTopics = async () => {
    try {
      // First get the scheduled topics
      const storedScheduledData = await AsyncStorage.getItem(SCHEDULED_TOPICS_KEY);
      if (!storedScheduledData) {
        setScheduledTopics([]);
        setIsLoading(false);
        return;
      }

      // Get the main topics to ensure we have the latest data
      const storedMainTopics = await AsyncStorage.getItem(STORAGE_KEY);
      const scheduledTopics = JSON.parse(storedScheduledData);
      const mainTopics = storedMainTopics ? JSON.parse(storedMainTopics) : [];

      // Filter duplicates - keep only the latest scheduled version of each topic
      const topicMap = new Map();
      scheduledTopics.forEach(topic => {
        // If topic already exists, only replace if this one is newer
        // We're assuming the topics are in chronological order with newer ones at the end
        topicMap.set(topic.id, topic);
      });
      
      // Convert map back to array
      const uniqueScheduledTopics = Array.from(topicMap.values());

      // Update scheduled topics with latest data from main topics
      const updatedScheduledTopics = uniqueScheduledTopics.map(scheduledTopic => {
        const mainTopic = mainTopics.find(t => t.id === scheduledTopic.id);
        if (mainTopic) {
          // Keep scheduling info but update resources and title
          return {
            ...scheduledTopic,
            title: mainTopic.title,
            resources: mainTopic.resources
          };
        }
        return scheduledTopic;
      });

      // Save the updated scheduled topics back to storage
      await AsyncStorage.setItem(SCHEDULED_TOPICS_KEY, JSON.stringify(updatedScheduledTopics));
      setScheduledTopics(updatedScheduledTopics);
    } catch (error) {
      console.error('Error loading scheduled topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect for focus events
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadScheduledTopics();
    });
    return unsubscribe;
  }, [navigation]);

  // Effect for periodic refresh
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!isLoading) {
        loadScheduledTopics();
      }
    }, 1000); // Check every second for changes

    return () => clearInterval(refreshInterval);
  }, [isLoading]);

  // Initial load
  useEffect(() => {
    loadScheduledTopics();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const results = scheduledTopics.filter(topic => 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.resources.some(resource => {
          const resourceText = renderResource(resource);
          return typeof resourceText === 'string' && 
            resourceText.toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
      setSearchResults(results);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [searchQuery, scheduledTopics]);

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

  const renderResource = (resource) => {
    if (typeof resource === 'object') {
      if (resource.type === 'document') {
        return resource.name;
      } else if (resource.type === 'collapsible') {
        return resource.title;
      }
    }
    return resource;
  };

  const isImage = (resource) => {
    if (typeof resource === 'object' && resource.type === 'document') {
      return resource.mimeType.startsWith('image/');
    }
    if (typeof resource === 'string') {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      return imageExtensions.some(ext => resource.toLowerCase().endsWith(ext));
    }
    return false;
  };

  const getDocumentIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'videocam';
    if (mimeType === 'application/pdf') return 'picture-as-pdf';
    if (mimeType.includes('word')) return 'description';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table-chart';
    if (mimeType === 'text/plain') return 'text-fields';
    return 'insert-drive-file';
  };

  const openDocument = async (uri, mimeType) => {
    try {
      if (Platform.OS === 'android') {
        // Create a public directory path
        const publicDir = FileSystem.documentDirectory + 'public/';
        await FileSystem.makeDirectoryAsync(publicDir, { intermediates: true });

        // Get the file name from the URI
        const fileName = uri.split('/').pop();
        const publicPath = publicDir + fileName;

        // Copy the file to public directory
        await FileSystem.copyAsync({
          from: uri,
          to: publicPath,
        });

        // Create a content URI
        const contentUri = await FileSystem.getContentUriAsync(publicPath);

        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: mimeType,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
      } else {
        const supported = await Linking.canOpenURL(uri);
        if (supported) {
          await Linking.openURL(uri);
        } else {
          Alert.alert('Error', 'No app available to open this document');
        }
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
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
                {topic.resources.map((resource, index) => {
                  const resourceText = renderResource(resource);
                  return typeof resourceText === 'string' &&
                    resourceText.toLowerCase().includes(searchQuery.toLowerCase()) && (
                    <Text key={index} style={styles.searchResultResource}>
                      {highlightText(resourceText, searchQuery)}
                    </Text>
                  );
                })}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View>
        <Text style={{color: "#b8c1ec", fontStyle: "italic", padding: hp(2)}}>Notification and alarm system Will be updated soon!</Text>
      </View>

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
                  Scheduled for: {topic.scheduledDate}
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
                    {/* <TouchableOpacity 
                      style={styles.editTitleButton}
                      onPress={startEditing}>
                      <MaterialIcons name="edit" size={24} color="white" />
                    </TouchableOpacity> */}
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
                Scheduled for: {selectedTopic?.scheduledDate}
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
                    typeof resource === 'object' && resource.type === 'document' ? (
                      resource.mimeType.startsWith('image/') ? (
                        <View style={styles.imageContainer}>
                          <Collapsible title={resource.name}>
                            <Image
                              source={{ uri: resource.uri }}
                              style={styles.resourceImage}
                              resizeMode="contain"
                            />
                          </Collapsible>
                        </View>
                      ) : (
                        <View style={styles.documentContainer}>
                          <MaterialIcons 
                            name={getDocumentIcon(resource.mimeType)}
                            size={24} 
                            color="#b8c1ec" 
                          />
                          <View style={styles.documentInfo}>
                            <Text style={styles.documentName}>{resource.name}</Text>
                            <Text style={styles.documentSize}>
                              {(resource.size / 1024 / 1024).toFixed(2)} MB
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.documentActionButton}
                            onPress={() => openDocument(resource.uri, resource.mimeType)}
                          >
                            <MaterialIcons
                              name="open-in-new"
                              size={20}
                              color="#b8c1ec"
                            />
                          </TouchableOpacity>
                        </View>
                      )
                    ) : isImage(resource) ? (
                      <View style={styles.imageContainer}>
                        <Collapsible title="View Image">
                          <Image
                            source={{ uri: resource }}
                            style={styles.resourceImage}
                            resizeMode="contain"
                          />
                        </Collapsible>
                      </View>
                    ) : (
                      <Text style={styles.resourceText}>{renderResource(resource)}</Text>
                    )
                  )}
                  <View style={styles.resourceActions}>
                    <TouchableOpacity 
                      style={styles.resourceActionButton}
                      onPress={() => handleResourceAction(resource)}>
                      <MaterialIcons 
                        name={isUrl(resource) ? "link" : isImage(resource) ? "visibility" : ""} 
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
    backgroundColor: '#121212',
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
    backgroundColor: '#1E1E1E',
    borderWidth: 0.4,
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
    backgroundColor: '#121212',
    borderRadius: wp('2%'),
  },
  scheduleText: {
    color: '#4CAF50',
    fontSize: wp('3.5%'),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
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
    fontSize: wp('4.2%'),
    color: 'white',
  },
  titleInput: {
    flex: 1,
    backgroundColor: '1E1E1E ',
    padding: wp('2%'),
    borderRadius: wp('2%'),
    marginLeft: wp('2%'),
    fontSize: wp('4%'),
    color: '#fff',
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
    backgroundColor: '#121212',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
    alignItems: 'center',
    borderWidth: 0.4,
    borderColor: '#b8c1ec',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    flexWrap: 'wrap',
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
    backgroundColor: '#1E1E1E',
    borderRadius: wp('2%'),
    marginTop: hp('2%'),
    paddingHorizontal: wp('3%'),
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    padding: wp('2%'),
    fontSize: wp('3%'),
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
    fontSize: wp('3%'),
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
  documentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('3%'),
    backgroundColor: '#232946',
    borderRadius: wp('2%'),
    marginTop: hp('1%'),
  },
  documentInfo: {
    flex: 1,
    marginLeft: wp('2%'),
  },
  documentName: {
    color: '#fff',
    fontSize: wp('3%'),
  },
  documentSize: {
    color: '#b8c1ec',
    fontSize: wp('2.5%'),
    marginTop: hp('0.5%'),
  },
  documentActionButton: {
    padding: wp('2%'),
    marginLeft: wp('2%'),
  },
  imageContainer: {
    flex: 1,
    width: '100%',
  },
  resourceImage: {
    width: '100%',
    height: hp('30%'),
    borderRadius: wp('2%'),
    marginTop: hp('1%'),
  },
}); 