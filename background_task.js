// import * as TaskManager from 'expo-task-manager';
// import * as Location from 'expo-location';

// const LOCATION_TASK_NAME = 'background-location-task';

// TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
//     console.log('***********************');
//     if (error) {
//         console.error('Background location error:', error);
//         return;
//     }
//     if (data) {
//         const { locations } = data;
//         const location = locations[0];

//         if (location) {
//             console.log('Location in background:', location);

            // try {
            //     await fetch('https://5e02-2409-40d1-8e-abef-207d-8594-e086-f0d9.ngrok-free.app/update-location', {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({
            //             latitude: location.coords.latitude,
            //             longitude: location.coords.longitude,
            //             timestamp: location.timestamp,
            //         }),
            //     });
            // } catch (err) {
            //     console.error('Failed to send location:', err);
            // }
//         }
//     }
// });
