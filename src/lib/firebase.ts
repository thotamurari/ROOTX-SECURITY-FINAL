import { initializeApp } from 'firebase/app'
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: 'AIzaSyDfGp-JA31ECvluaJJmOCaXNPto3H3zgpo',
    authDomain: 'e-learning-18dcf.firebaseapp.com',
    projectId: 'e-learning-18dcf',
    storageBucket: 'e-learning-18dcf.firebasestorage.app',
    messagingSenderId: '781934102806',
    appId: '1:781934102806:web:d43beb81e381695be42837',
    measurementId: 'G-9G6VH3S6FX',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Auth with persistent sessions
export const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence)

// Initialize Cloud Firestore for Scan History & Security Logs
export const db = getFirestore(app)

export default app
