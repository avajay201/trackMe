// import * as Location from 'expo-location';

// export const startLocationTracking = async () => {
//   console.log('Tracking processing...');
//   const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
//   if (foregroundStatus !== 'granted') {
//     console.log('Foreground location permission denied');
//     return;
//   }

//   const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
//   if (backgroundStatus !== 'granted') {
//     console.log('Background location permission denied');
//     return;
//   }

//   const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
//   console.log('isTaskRegistered:::', isTaskRegistered);
//   if (!isTaskRegistered) {
//     await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
//       accuracy: Location.Accuracy.High,
//       timeInterval: 3000,
//       distanceInterval: 1,
//       deferredUpdatesInterval: 10000,
//       deferredUpdatesDistance: 50,
//       foregroundService: {
//         notificationTitle: 'Location Tracking',
//         notificationBody: 'Your location is being tracked in the background',
//       },
//     });
//     console.log('Started background location tracking');
//   } else {
//     console.log('Background location tracking already active');
//   }
// };
