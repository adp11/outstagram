import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// App's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDb-Fpaj-p4d2r9J2QpOyeJX-e9EBk1y6U",
  authDomain: "superchat-905f2.firebaseapp.com",
  databaseURL: "https://superchat-905f2-default-rtdb.firebaseio.com",
  projectId: "superchat-905f2",
  storageBucket: "superchat-905f2.appspot.com",
  messagingSenderId: "1064715598950",
  appId: "1:1064715598950:web:fcbc8ae42d8042d88fc1a7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Set Storage
const storage = getStorage(app);

export {
  app, storage,
};
