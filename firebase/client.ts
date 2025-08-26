import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBu1DRN7vjNCEn7z4XYxEewTw4FnY26S_U",
    authDomain: "preppal-b9992.firebaseapp.com",
    projectId: "preppal-b9992",
    storageBucket: "preppal-b9992.firebasestorage.app",
    messagingSenderId: "830979627912",
    appId: "1:830979627912:web:4dcd2745c0166fb65a383d",
    measurementId: "G-WKZVV10392"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);