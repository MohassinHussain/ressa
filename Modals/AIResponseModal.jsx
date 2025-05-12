import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
  Alert
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Collapsible } from "@/components/Collapsible";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAMPLE_DATA = {
  articles: [
    {
      link: "https://example.com/article1",
      score: 0.85,
      summary:
        "This is a sample article summary that will be replaced with real data when available.",
      title: "Sample Article 1",
    },
    {
      link: "https://example.com/article2",
      score: 0.75,
      summary:
        "Another sample article summary that will be replaced with real data when available.",
      title: "Sample Article 2",
    },
  ],
  videos: [
    {
      body: "This is a sample video description that will be replaced with real data when available.",
      href: "https://example.com/video1",
      title: "Sample Video 1",
      upload_time: "2024-01-01T00:00:00Z",
    },
  ],
  images: [
    {
      image: "https://via.placeholder.com/300x200",
      title: "Sample Image 1",
    },
  ],
};

export default function AIResponseModal({
  visible,
  onClose,
  responseData,
  isLoading,
  selectedTopic,
  onSaveResources,

}) {
  let dataToDisplay = responseData || SAMPLE_DATA;
  if (responseData) dataToDisplay = responseData.resources;
  // console.log("CHECK CHECK", dataToDisplay);
  const renderArticles = () => {
    return dataToDisplay.articles?.map((article, index) => (
      <TouchableOpacity
        key={index}
        style={styles.card}
        onPress={() => Linking.openURL(article.link)}
      >
        <Text style={styles.cardTitle}>{article.title}</Text>
        <Text style={styles.cardSummary}>{article.summary}</Text>
        <Text style={styles.cardScore}>
          Relevance Score: {(article.score * 100).toFixed(2)}%
        </Text>
      </TouchableOpacity>
    ));
  };

  const renderVideos = () => {
    return dataToDisplay.videos?.map((video, index) => (
      <TouchableOpacity
        key={index}
        style={styles.card}
        onPress={() => Linking.openURL(video.href)}
      >
        <Text style={styles.cardTitle}>{video.title}</Text>
        <Text style={styles.cardSummary}>{video.body}</Text>
        {video.upload_time && (
          <Text style={styles.cardTime}>
            Uploaded: {new Date(video.upload_time).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    ));
  };

  const renderImages = () => {
    return dataToDisplay.images?.map((image, index) => (
      <TouchableOpacity
        key={index}
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
    ));
  };

  if (!visible) return null;

const RESOURCES_FROM_NET_KEY = "@resources_from_net"

const handleSaveAllResources = async () => {
  try {
    // Save the resources to AsyncStorage
    await AsyncStorage.setItem(RESOURCES_FROM_NET_KEY, JSON.stringify(dataToDisplay));

    // Pass the resources back to the parent component
    if (onSaveResources) {
      onSaveResources(dataToDisplay);
    }

    // Show a success alert once the data is saved
    Alert.alert(
      "Save Net Resources",
      "All resources from the net are saved successfully!",
      [
        {
          text: "Ok",
          onPress: () => {
            // console.log("Resources saved successfully.");
          }
        },
      ]
    );
  } catch (error) {
    // console.error('Error saving net resources data:', error);
    Alert.alert(
      "Save Error",
      "There was an error saving the resources. Please try again later.",
      [
        {
          text: "Ok",
          onPress: () => {
            console.log("Error saving resources.");
          }
        },
      ]
    );
  }
};


const handleNewResources = () => {
  console.log("CLCC");
  // const customQuery = "Other Resources for " + selectedTopic?.title;
  // handleFetchButton(customQuery);
};


  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <AntDesign name="caretleft" size={hp(2.5)} color="black" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.modalTitle}>
              AI Resources
            </ThemedText>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#001858" />
              <Text style={styles.loadingText}>
                Fetching resources for {selectedTopic?.title}...
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.content}>
              
              <View>
                <Text
                  style={{
                    color: "black",
                    fontSize: hp("2.2%"),
                    fontWeight: "600",
                    marginBottom: hp(2),
                  }}
                >
                  Fetched Resources 
                </Text>
              </View>
              <View style={{ marginBottom: hp(1.5) }}>
                <Collapsible title="Articles">
                  {dataToDisplay.articles &&
                    dataToDisplay.articles.length > 0 && (
                      <View style={styles.section}>
                        <ThemedText
                          type="subtitle"
                          style={{ marginBottom: hp(2) }}
                        >
                          Articles
                        </ThemedText>
                        {renderArticles()}
                      </View>
                    )}
                </Collapsible>
              </View>
              <View style={{ marginBottom: hp(1.5) }}>
                <Collapsible title="Videos">
                  {dataToDisplay.videos && dataToDisplay.videos.length > 0 && (
                    <View style={styles.section}>
                      <ThemedText
                        type="subtitle"
                        style={{ marginBottom: hp(2) }}
                      >
                        Videos
                      </ThemedText>
                      {renderVideos()}
                    </View>
                  )}
                </Collapsible>
              </View>
              <View style={{ marginBottom: hp(1.5) }}>
                <Collapsible title="Images">
                  {dataToDisplay.images && dataToDisplay.images.length > 0 && (
                    <View style={styles.section}>
                      <ThemedText
                        type="subtitle"
                        style={{ marginBottom: hp(2) }}
                      >
                        Images
                      </ThemedText>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        {renderImages()}
                      </ScrollView>
                    </View>
                  )}
                </Collapsible>
              </View>

              <View style={{ flex: 1, padding: hp(2) }}>
                <TouchableOpacity style={styles.othersContainer}>
                  <Text style={styles.othersContainerText}>
                    Want resources related to topic and for inerview?
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.othersContainer}>
                  <Text style={styles.othersContainerText}>
                    Want resources related to topic and for revision?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Save All resources */}

                  <TouchableOpacity style={styles.saveAllResourcesButton} onPress={handleSaveAllResources}>
                    <Text style={{color: "#001858", fontWeight: "bold", textAlign: "center", fontSize: hp(1.5)}}>Save All Resources</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={{alignItems: "center", marginTop: hp(4)}} onPress={handleNewResources}>
                <Text style={{fontSize: hp(2)}}>Get new resources</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#b8c1ec",
    height: "75%",
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
  modalTitle: {
    marginLeft: wp("2%"),
    fontSize: wp("4.2%"),
    color: "black",
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: hp("3%"),
    width: hp(39),
  },
  card: {
    backgroundColor: "#232946",
    padding: wp("4%"),
    borderRadius: wp("2%"),
    marginBottom: hp("2%"),
  },
  cardTitle: {
    color: "#b8c1ec",
    fontSize: wp("3.5%"),
    fontWeight: "bold",
    marginBottom: hp("1%"),
  },
  cardSummary: {
    color: "#fff",
    fontSize: wp("3%"),
    marginBottom: hp("1%"),
  },
  cardScore: {
    color: "#4CAF50",
    fontSize: wp("2.5%"),
  },
  cardTime: {
    color: "#b8c1ec",
    fontSize: wp("2.5%"),
  },
  imageCard: {
    width: wp("60%"),
    marginRight: wp("2%"),
  },
  image: {
    width: "100%",
    height: hp("20%"),
    borderRadius: wp("2%"),
  },
  imageTitle: {
    color: "#fff",
    fontSize: wp("3%"),
    marginTop: hp("1%"),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#172c66",
    fontSize: wp("3.5%"),
    marginTop: hp("2%"),
  },
  othersContainer: {
    backgroundColor: "#f582ae",
    borderRadius: hp("1%"),
    marginBottom: hp("2%"),
  },
  othersContainerText: {
    color: "#001858",
    padding: hp("1.4%"),
    fontSize: hp(1.5),
    fontWeight: "bold",
  },

  saveAllResourcesButton: {
    backgroundColor: "#fef6e4",
    padding: hp(1.5),
    borderRadius: hp(5),
    position: "fixed",
    bottom: 0
  }
});
