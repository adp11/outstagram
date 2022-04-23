import "./App.css";
// useEffect, useContext, useState
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Newsfeed from "./components/Newsfeed";
import ProfilePreview from "./components/ProfilePreview";
import Profile from "./components/Profile";
import Auth from "./components/Auth";
import AddPost from "./components/AddPost";
import FullPost from "./components/FullPost";
import EditProfile from "./components/EditProfile";
// import NewsfeedPost from "./components/NewsfeedPost";
// import { createContext } from 'react';
// import app from './firebase';
// import {
//   getAuth,
//   onAuthStateChanged,
//   signOut,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   connectAuthEmulator,
//   GoogleAuthProvider,
//   signInWithPopup,
// } from 'firebase/auth';
// import {
//   getFirestore,
//   collection,
//   addDoc,
//   query,
//   orderBy,
//   limit,
//   onSnapshot,
//   setDoc,
//   updateDoc,
//   doc,
//   serverTimestamp,
// } from 'firebase/firestore';
// import {
//   getStorage,
//   ref,
//   uploadBytesResumable,
//   getDownloadURL,
// } from 'firebase/storage';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        {/* <Auth /> */}
        {/* <Nav /> */}
        {/* <AddPost /> */}
        {/* <EditProfile /> */}
        {/* <FullPost /> */}
        <Routes>
          <Route
            path="/a"
            element={(
              <>
                <Newsfeed />
                <ProfilePreview />
              </>
)}
          />
          <Route path="/a" element={<Profile />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
