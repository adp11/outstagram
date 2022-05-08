import "./App.css";
import React, {
  useEffect, useContext, useState, useMemo, useRef, useLayoutEffect,
} from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, where,
} from "firebase/firestore";
import Nav from "./components/Nav/Nav";
import Newsfeed from "./components/Newsfeed";
import ProfilePreview from "./components/ProfilePreview";
import Profile from "./components/Profile";
import Auth from "./components/Auth/Auth";
import AddPost from "./components/AddPost";
import FullPost from "./components/FullPost";
// import EditProfile from "./components/EditProfile";
// import NewsfeedPost from "./components/NewsfeedPost";
// import app from "./firebase";
import UserContext from "./components/Contexts/UserContext";
import { db } from "./firebase";
import EditProfile from "./components/EditProfile";
import { quickSort, sortedAdd } from "./utils";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAddPostActive, setIsAddPostActive] = useState(false);
  const [isEditProfileActive, setIsEditProfileActive] = useState(false);
  const [isFullPostActive, setIsFullPostActive] = useState(false);
  const [userData, setUserData] = useState(null);
  const [visitedUserData, setVisitedUserData] = useState(null);
  const [allUserData, setAllUserData] = useState([]);
  const [newsfeed, setNewsfeed] = useState([]);
  const tempNewsfeed = [];

  const providerValue = useMemo(() => ({
    setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, allUserData, userData, setUserData, visitedUserData, setVisitedUserData, newsfeed, setNewsfeed, setIsFullPostActive,
  }), [setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, setAllUserData, userData, setUserData, visitedUserData, setVisitedUserData, newsfeed, setNewsfeed, setIsFullPostActive]);
  const counter = useRef(0);

  useEffect(() => {
    async function fetchUserData() {
      const docRef = doc(db, `users/uid_${getAuth().currentUser.uid}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    }

    /*
    This function serves the purpose of displaying short 3-field snippets of all users in searchbox ONLY.
    It is also NOT designed to listen to realtime updates in the remote Firebase database (e.g. when new users signed up to the database)
    Notice: querySnapshot.map() won't work. Need to use forEach() as an alternative.
    */
    async function fetchAllUserData() {
      const querySnapshot = await getDocs(collection(db, "users"));
      querySnapshot.forEach((document) => {
        const toBePushed = { ...document.data(), uid: document.id };
        allUserData.push(toBePushed);
      });
      setAllUserData(allUserData);
    }

    if (isLoggedIn) {
      fetchUserData();
      fetchAllUserData();
    } else {
      setAllUserData([]);
      setVisitedUserData(null);
      setUserData(null);
      setNewsfeed([]);
    }
    window.scrollTo(0, 0); // prevent browser remember scroll position and auto scroll upon user refreshes the page.
  }, [isLoggedIn]);

  useEffect(() => {
    function fetchNewsfeed() {
      const { following } = userData;
      following.forEach(async (followee) => {
        const q = query(collection(db, `users/${followee.uid}/posts`), limit(7));

        // Listening to real-time change
        onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
              const deletePosition = newsfeed.findIndex((post) => post.postId === change.doc.id);
              tempNewsfeed.splice(deletePosition, 1);
            } else {
              sortedAdd(tempNewsfeed, change.doc.data()); // oldest to newest
            }
          });
          setNewsfeed(tempNewsfeed);
        });
      });
    }
    if (isLoggedIn) {
      fetchNewsfeed();
    }
  }, [userData]);

  const scrollY = useRef(0);

  /*
  useEffect here is fired twice upon first loading even though isFullPostActive still is (false). Duc tape (counter < 2) for this
  useRef works but using a variable to save counter doesn't.
  smooth scroll here, but want abrupt scroll
  nav and previewprofile is not fixed on top edge because of position: fixed with top down applied to App
  */
  useEffect(() => {
    function jump() {
      if (counter.current < 1) {
        counter.current += 1;
      } else {
        window.scrollTo(0, scrollY.current);
      }
    }
    if (!isFullPostActive) {
      jump();
    }
  }, [isFullPostActive]);

  return (
    <div>
      <BrowserRouter>
        <UserContext.Provider value={providerValue}>
          {/* <div className="App" style={{ position: "fixed", top: "-20px" }}> */}
          <div style={{ position: isFullPostActive && "fixed", top: isFullPostActive && `-${scrollY.current}px` }} className={`App ${(isAddPostActive || isEditProfileActive || isFullPostActive) ? "blur" : ""}`}>
            {/* <button
              type="button"
              style={{ position: "fixed", top: "0px", zIndex: "4" }}
              onClick={() => { scrollY.current = parseInt(window.scrollY, 10); setIsFullPostActive(true); }}
            >
              CLICK
            </button> */}
            {!isLoggedIn && <Auth />}
            {isLoggedIn && <Nav />}
            {isLoggedIn && (
              <Routes>
                <Route
                  path="/"
                  element={(
                    <>
                      <Newsfeed />
                      <ProfilePreview />
                    </>
)}
                />
                <Route path="/:uid" element={<Profile />} />
              </Routes>
            )}
          </div>
          {isAddPostActive && <AddPost />}
          {isEditProfileActive && <EditProfile />}
          {isFullPostActive && <FullPost />}
        </UserContext.Provider>
      </BrowserRouter>
    </div>

  );
}

export default App;

{ /* <AddPost />
<EditProfile />
<FullPost />
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
</Routes> */ }
