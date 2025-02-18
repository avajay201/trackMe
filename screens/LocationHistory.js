import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  ToastAndroid,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { locationHistory as fetchMyLocations } from "./ApiActions";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";


const LocationHistory = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [locationHistory, setLocationHistory] = useState([]);
  const [showConnection, setShowConnection] = useState(false);
  const [mapType, setMapType] = useState("standard");
  const [currentRegion, setCurrentRegion] = useState(null);

  const loadLocationHistory = async () => {
    setLoading(true);
    try {
      const user_id = await AsyncStorage.getItem("user_id");
      const result = await fetchMyLocations(user_id);

      if (result[0] === 200) {
        const last10Locations = result[1];
        setLocationHistory(last10Locations);
      } else {
        ToastAndroid.show("Something went wrong.", ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error("Error fetching location history:", error);
      ToastAndroid.show("Error fetching data.", ToastAndroid.SHORT);
    }
    setLoading(false);
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
    if (status !== "granted") {
      ToastAndroid.show("Permission to access location was denied.", ToastAndroid.SHORT);
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setCurrentRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  useEffect(() => {
    loadLocationHistory();
    getCurrentLocation();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      ) : (
        <>
          <MapView
            style={styles.map}
            mapType={mapType}
            initialRegion={{
              latitude: currentRegion?.latitude || 37.78825,
              longitude: currentRegion?.longitude || -122.4324,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={currentRegion || undefined}
          >
            {currentRegion && (
              <Marker coordinate={currentRegion}>
                <Ionicons name="location-sharp" size={24} color="blue" />
              </Marker>
            )}

            {showConnection &&
              locationHistory.map((loc, index) => (
                <Marker
                  key={index}
                  coordinate={{ latitude: loc[0], longitude: loc[1] }}
                >
                  <Ionicons name="location-sharp" size={24} color="red" />
                </Marker>
              ))}
            {showConnection && locationHistory.length > 1 && (
              <Polyline
                coordinates={locationHistory.map((loc) => ({
                  latitude: loc[0],
                  longitude: loc[1],
                }))}
                strokeWidth={3}
                strokeColor="blue"
              />
            )}
          </MapView>

          <View style={styles.optionsContainer}>
            <View style={styles.optionRow}>
              <Text>Show Connection</Text>
              <Switch
                value={showConnection}
                onValueChange={() => setShowConnection(!showConnection)}
              />
            </View>

            <View style={styles.optionRow}>
              <Text>Map Style</Text>
              <TouchableOpacity style={styles.button}
                onPress={() => {
                  const types = ["standard", "satellite", "hybrid", "terrain"];
                  const nextIndex = (types.indexOf(mapType) + 1) % types.length;
                  setMapType(types[nextIndex]);
                }}>
                <Text style={styles.buttonText}>Change {mapType.charAt(0).toUpperCase() + mapType.slice(1,)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.optionRow}>
              <Text>Show Current Location</Text>
              <TouchableOpacity style={styles.button} onPress={getCurrentLocation}>
                <Text style={styles.buttonText}>Current Location</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.listContainer}>
            <Text style={styles.header}>Last 10 Locations</Text>
            <FlatList
              data={locationHistory}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.listItem}>
                  <Text style={{ fontWeight: 'bold' }}>{index + 1}.</Text>
                  <Text style={{ fontSize: 12, flex: 1 }}>
                    {item[2]} - ({item[0]}, {item[1]})
                  </Text>
                  <TouchableOpacity
                  style={{paddingRight: 20}}
                    onPress={() =>
                      setCurrentRegion({
                        latitude: item[0],
                        longitude: item[1],
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      })
                    }>
                    <Ionicons name="location" size={24} color="blue" />
                  </TouchableOpacity>
                </View>
              )}
            />
            <View style={styles.bottomOptions}>
              <TouchableOpacity style={styles.button} onPress={loadLocationHistory}>
                <Text style={styles.buttonText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={()=> navigation.navigate('Home')}>
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { flex: 1, height: "50%" },
  listContainer: { flex: 1, padding: 10, backgroundColor: "#f9f9f9" },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  listItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionsContainer: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    flexDirection: "column",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  button: {
    width: 120,
    height: 35,
    backgroundColor: 'blue',
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bottomOptions: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
  }
});

export default LocationHistory;
