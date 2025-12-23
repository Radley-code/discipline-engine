import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAey12mGvyWS_4s0D7eCo63sV_xoikDEV8',
  authDomain: 'discipline-engine-29d21.firebaseapp.com',
  projectId: 'discipline-engine-29d21',
  storageBucket: 'discipline-engine-29d21.appspot.com',
  messagingSenderId: '31220393360',
  appId: '1:31220393360:android:ed47feb8c3b06c10e9ff15',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app); // ✅ This works in Expo Go

