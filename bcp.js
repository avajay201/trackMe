import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, Button, Alert, TouchableOpacity, ToastAndroid, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from "react-native-maps";
import * as TaskManager from 'expo-task-manager';



const API_URL = 'https://ajay-verma.in';
const LOCATION_TRACKING = "background-location-task";

export default function App() {
  const [logged, setLogged] = useState(false);
  const [screen, setScreen] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [showLocation, setShowLocation] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (logged) {
      startLocationTracking();

      // background location tracking task create
      TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }
        if (data) {
          const { locations } = data;
          const userId = await AsyncStorage.getItem('user_id');
      
          try {
            await fetch(`${API_URL}/update-location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                latitude: locations[0].coords.latitude,
                longitude: locations[0].coords.longitude,
                timestamp: locations[0].timestamp,
                user_id: userId,
              }),
            });
          } catch (err) {
            console.error('Failed to send background location:', err);
          }
        }
      });
    };
  }, [logged]);

  const checkLoginStatus = async () => {
    const loggedUser = await AsyncStorage.getItem('user_id');
    if (loggedUser) {
      setLogged(loggedUser);
    }
  };

  const registerUser = async () => {
    if (!username || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    if (username.length < 6 || username.length > 20) {
      Alert.alert('Error', 'Username must be between 6 and 20 characters.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, 'confirm_password': confirmPassword }),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', result.message);
        setScreen('login');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  const loginUser = async () => {
    try {
      if (!username || !password) {
        Alert.alert('Error', 'All fields are required.');
        return;
      };

      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem('user_id', String(result.user_id));
        Alert.alert('Success', result.message);
        setLogged(true);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  const startLocationTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Permission to access location was denied.');
      return;
    };

    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 5,
      },
      async (newLocation) => {
        setLocation(newLocation);
        try {
          const response = await fetch(`${API_URL}/update-location`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              timestamp: newLocation.timestamp,
              user_id: logged,
            }),
          });

          if (!response.ok) throw new Error('Failed to send location');
          setLastResponse('Success');
        } catch (err) {
          setLastResponse('Failed');
        }
      }
    );

    // background task start
    const isTaskDefined = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING);
    if (!isTaskDefined) {
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 5,
        foregroundService: {
          notificationTitle: "Location Tracking",
          notificationBody: "Your location is being tracked in the background.",
        },
      });
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const fetchMyLocation = async () => {
    setShowLocation(true);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/my-location?user_id=${logged}`);
      const data = await response.json();
      if (data.error) {
        ToastAndroid.show(data.error, ToastAndroid.SHORT);
        setShowLocation(false);
      }
      else {
        setLocations(data.data);
        if (data.data.length === 0) {
          ToastAndroid.show('No locations found', ToastAndroid.SHORT);
          setShowLocation(false);
        };
      };
    } catch (error) {
      ToastAndroid.show('Something went wrong.', ToastAndroid.SHORT);
      setShowLocation(false);
    } finally {
      setLoading(false);
    }
  };

  const closeLocations = ()=>{
    setLocations([]);
    setShowLocation(false);
  };

  if (loading) return <ActivityIndicator size="large" color="blue" style={{ flex: 1 }} />;

  return (
    <>
      {showLocation && locations.length > 0 ?
        <SafeAreaView style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: locations[0][0],
              longitude: locations[0][1],
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {locations.map(([latitude, longitude], index) => (
              <Marker
                key={index}
                coordinate={{ latitude, longitude }}
                title={`Location ${index + 1}`}
              />
            ))}

            <Polyline
              coordinates={locations.map(([latitude, longitude]) => ({ latitude, longitude }))}
              strokeWidth={4}
              strokeColor="green"
            />
          </MapView>
          <TouchableOpacity onPress={fetchMyLocation} style={[styles.myLocations, {position: 'absolute', bottom: '75', left: '35%'}]}>
            <Text style={styles.myLocationsText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={closeLocations} style={[styles.myLocations, {position: 'absolute', bottom: '20', left: '35%'}]}>
            <Text style={styles.myLocationsText}>Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
        :
        <View style={styles.container}>
          {!logged ? (
            screen === 'register' ? (
              <>
                <Text style={styles.heading}>Register</Text>
                <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} />
                <TextInput placeholder="Password" style={styles.input} value={password} secureTextEntry onChangeText={setPassword} />
                <TextInput placeholder="Confirm Password" style={styles.input} value={confirmPassword} secureTextEntry onChangeText={setConfirmPassword} />
                <Button title="Register" onPress={registerUser} />
                <Text onPress={() => { setScreen('login'); resetForm(); }} style={styles.link}>Already have an account? Login</Text>
              </>
            ) : (
              <>
                <Text style={styles.heading}>Login</Text>
                <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} />
                <TextInput placeholder="Password" style={styles.input} value={password} secureTextEntry onChangeText={setPassword} />
                <Button title="Login" onPress={loginUser} />
                <Text onPress={() => { setScreen('register'); resetForm(); }} style={styles.link}>Don't have an account? Register</Text>
              </>
            )
          ) : (
            <>
              <Text style={styles.heading}>Tracking Enabled</Text>
              {location ? (
                <>
                  <Text>Latitude: {location.coords.latitude}</Text>
                  <Text>Longitude: {location.coords.longitude}</Text>
                  {lastResponse && <Text style={{ marginTop: 20 }}>Last Response: {lastResponse === 'Success' ? '✅ Success' : '❌ Failed'}</Text>}
                  {!showLocation && <TouchableOpacity onPress={fetchMyLocation} style={styles.myLocations}><Text style={styles.myLocationsText}>My Locations</Text></TouchableOpacity>}
                </>
              ) : (
                <Text>Fetching location...</Text>
              )}
            </>
          )
          }
        </View>
      }
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginTop: '20%',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    width: 250,
    borderWidth: 1,
    padding: 10,
    marginVertical: 8,
    borderRadius: 5,
  },
  link: {
    color: 'blue',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
  myLocations: {
    marginTop: 20,
    width: 125,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'green',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myLocationsText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
