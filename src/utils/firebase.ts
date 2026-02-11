// Firebase configuration for CredPOS
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithCredential,
    User as FirebaseUser
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

// Firebase config from google-services.json
const firebaseConfig = {
    apiKey: "AIzaSyCwCNom-iWVP08ocPd9uSCmncCsGT4V5Sc",
    authDomain: "creadpos.firebaseapp.com",
    projectId: "creadpos",
    storageBucket: "creadpos.firebasestorage.app",
    messagingSenderId: "322176258286",
    appId: "1:322176258286:android:687de02e3d6b063b26e3ff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Google Web Client ID from google-services.json
export const GOOGLE_WEB_CLIENT_ID = "322176258286-v0cel8753hpqmq5vgnssj8ggd1lpdu2d.apps.googleusercontent.com";

// Google Sign In function
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
    try {
        if (Capacitor.isNativePlatform()) {
            // Use native Google Sign-In for Android/iOS
            const result = await FirebaseAuthentication.signInWithGoogle();

            // Get the ID token and create credential
            const idToken = result.credential?.idToken;
            if (!idToken) {
                throw new Error('No ID token received from Google Sign-In');
            }

            // Create Firebase credential and sign in
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            return userCredential.user;
        } else {
            // Use popup for web
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        }
    } catch (error) {
        console.error('Google Sign-In error:', error);
        throw error;
    }
};

// Sign out function
export const signOutFromGoogle = async (): Promise<void> => {
    try {
        if (Capacitor.isNativePlatform()) {
            await FirebaseAuthentication.signOut();
        }
        await firebaseSignOut(auth);
    } catch (e) {
        console.error('Sign out error:', e);
    }
};

// Get current user
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
    return auth.currentUser;
};

export { auth, onAuthStateChanged, GoogleAuthProvider };
export type { FirebaseUser };
