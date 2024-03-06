import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import getStorage function for Firebase Storage
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8phUMb65atxaFEbAb9I3Fo50Gfs1wLcw",
  authDomain: "simenon-db758.firebaseapp.com",
  projectId: "simenon-db758",
  storageBucket: "simenon-db758.appspot.com",
  messagingSenderId: "55590854970",
  appId: "1:55590854970:web:fa5e3ae704c86a9eeeb003",
  measurementId: "G-4HYC636X3K",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const auth = getAuth(firebaseApp);

export { firebaseApp, db, storage, auth };
