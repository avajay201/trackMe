import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useCallback } from "react";
import { 
    View, Text, StyleSheet, BackHandler, ToastAndroid, 
    TouchableOpacity, Alert, ActivityIndicator 
} from "react-native";
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { updateLocation } from "./ApiActions";
import { useFocusEffect } from "@react-navigation/native";


const LOCATION_TRACKING = "background-location-task";
TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
    if (error) {
        console.log("Background location error:", error);
        return;
    }
    if (data) {
        const { locations } = data;
        if (locations.length > 0) {
            const location = locations[0];
            console.log("Background Location:", location);

            const user_id = await AsyncStorage.getItem('user_id');
            await updateLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: location.timestamp,
                user_id: user_id,
            });
        }
    }
});

const Home = ({ navigation }) => {
    const [exitApp, setExitApp] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [location, setLocation] = useState(null);
    const [lastResponse, setLastResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [locationSubscription, setLocationSubscription] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const backAction = () => {
                if (exitApp) {
                    BackHandler.exitApp();
                    return true;
                } else {
                    setExitApp(true);
                    ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
                    setTimeout(() => setExitApp(false), 2000);
                    return true;
                }
            };

            const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

            return () => backHandler.remove();
        }, [exitApp])
    );

    const fetchTrackingStatus = async () => {
        const tracking = await AsyncStorage.getItem('tracking');
        if (tracking === 'true') {
            setIsTracking(true);
            await trackingProcessExecution();
        };
    };

    useEffect(() => {
        fetchTrackingStatus();
    }, []);

    const trackingProcessExecution = async()=>{
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Error', 'Permission to access location was denied.');
            ToastAndroid.show('Tracking failed.', ToastAndroid.SHORT);
            setTrackingLoading(false);
            return;
        };

        let { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus !== 'granted') {
            Alert.alert('Error', 'Permission to access background location was denied.');
            return;
        };

        await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 5000,
            distanceInterval: 5,
            foregroundService: {
                notificationTitle: "Location Tracking",
                notificationBody: "Your location is being tracked in the background.",
                notificationColor: "#007bff",
            }
        });

        const isTaskDefined = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING);
        if (!isTaskDefined) {
            console.log("Registering Task...");
        };

        const subscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 5000,
                distanceInterval: 5,
            },
            async (newLocation) => {
                setLoading(true);
                setLocation(newLocation);
                const user_id = await AsyncStorage.getItem('user_id');
                const result = await updateLocation({
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                    timestamp: newLocation.timestamp,
                    user_id: user_id,
                });
                setLoading(false);
                if (result === 200) {
                    setLastResponse('Success ✅');
                } else {
                    setLastResponse('Failed ❌');
                }
            }
        );

        setLocationSubscription(subscription);
    };

    const startLocationTracking = async () => {
        setTrackingLoading(true);
        await trackingProcessExecution();
        setIsTracking(true);
        await AsyncStorage.setItem('tracking', 'true');
        setTrackingLoading(false);
    };

    const stopTracking = async () => {
        Alert.alert(
            "Stop Tracking?",
            "Are you sure you want to stop tracking?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "OK", onPress: async () => {
                    setTrackingLoading(true);

                    await AsyncStorage.removeItem('tracking');
                    setIsTracking(false);
                    setLocation(null);
                    setLastResponse(null);

                    if (locationSubscription) {
                        locationSubscription.remove();
                        setLocationSubscription(null);
                    };

                    await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
                    ToastAndroid.show("Tracking Stopped", ToastAndroid.SHORT);
                    setTrackingLoading(false);
                }}
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Track Me</Text>

            <TouchableOpacity 
                style={[styles.button, trackingLoading && styles.disabledButton]} 
                onPress={() => isTracking ? stopTracking() : startLocationTracking()} 
                disabled={trackingLoading}
            >
                {trackingLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>{isTracking ? 'Stop' : 'Start'} Tracking</Text>
                )}
            </TouchableOpacity>

            {location && (
                <View style={styles.infoContainer}>
                    {(loading || trackingLoading) && <View style={styles.blurOverlay} />}
                    {(loading || trackingLoading) && <ActivityIndicator size="large" color="#007bff" style={styles.loader} />}
                    
                    <Text style={styles.infoText}>📍 Location:</Text>
                    <Text style={styles.locationText}>Lat: {location.coords.latitude.toFixed(5)}</Text>
                    <Text style={styles.locationText}>Lng: {location.coords.longitude.toFixed(5)}</Text>
                </View>
            )}

            {lastResponse && (
                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>⚡ Last Response:</Text>
                    <Text style={styles.responseText}>{lastResponse}</Text>
                </View>
            )}

            {!location && !lastResponse && isTracking &&
                <View>
                    <ActivityIndicator size="small" color="#007bff" />
                </View>    
            }

            <TouchableOpacity style={styles.locationHistory} onPress={()=> navigation.navigate('LocationHistory')}>
                <Text style={styles.locationHistoryText}>Location History</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        paddingTop: '20%',
    },
    heading: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 20,
    },
    button: {
        backgroundColor: "#007bff",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    disabledButton: {
        backgroundColor: "#aac7ee",
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    infoContainer: {
        alignItems: "center",
        justifyContent: 'center',
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        marginVertical: 10,
        width: "80%",
        position: "relative",
    },
    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.6)",
        borderRadius: 10,
    },
    loader: {
        position: "absolute",
        top: "40%",
    },
    infoText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#444",
    },
    locationText: {
        fontSize: 15,
        color: "#555",
    },
    responseText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    locationHistory: {
        position: 'absolute',
        bottom: '10%',
        backgroundColor: "#007bff",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
    },
    locationHistoryText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default Home;
