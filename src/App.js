import "./App.css";
import React, {
  useEffect, useState, useMemo, useRef,
} from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, limit, onSnapshot, query,
} from "firebase/firestore";
import Nav from "./components/Nav/Nav";
import Newsfeed from "./components/Newsfeed";
import ProfilePreview from "./components/ProfilePreview";
import Profile from "./components/Profile";
import Auth from "./components/Auth/Auth";
import AddPost from "./components/AddPost";
import FullPost from "./components/FullPost";
import UserContext from "./components/Contexts/UserContext";
import { db } from "./firebase";
import EditProfile from "./components/EditProfile";
import { quickSort, sortedAdd } from "./utils";
import Page404 from "./Page404";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAddPostActive, setIsAddPostActive] = useState(false);
  const [isEditProfileActive, setIsEditProfileActive] = useState(false);
  const [isFullPostActive, setIsFullPostActive] = useState(false);
  const [userData, setUserData] = useState(null);
  const [visitedUserData, setVisitedUserData] = useState(null);
  const [allUserData, setAllUserData] = useState([]);
  const [newsfeed, setNewsfeed] = useState([]);
  const [beforeFullPost, setBeforeFullPost] = useState({
    profile: false,
    newsfeed: false,
  });

  const tempNewsfeed = [];
  const scrollY = useRef(0);
  const counter = useRef(0);

  const providerValue = useMemo(
    () => (
      {
        setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, allUserData, userData, setUserData, visitedUserData, setVisitedUserData, newsfeed, setNewsfeed, setIsFullPostActive, beforeFullPost, setBeforeFullPost, scrollY,
      }),
    [setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, setAllUserData, userData, setUserData, visitedUserData, setVisitedUserData, newsfeed, setNewsfeed, setIsFullPostActive, beforeFullPost, setBeforeFullPost],
  );

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
        const q = query(collection(db, `users/${followee.uid}/posts`));

        // Listening to real-time change
        onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
              const deletePosition = newsfeed.findIndex((post) => post.postId === change.doc.id);
              tempNewsfeed.splice(deletePosition, 1);
            } else if (change.type === "added") {
              sortedAdd(tempNewsfeed, change.doc.data()); // oldest to newest
            } else {
              const modifiedPosition = newsfeed.findIndex((post) => post.postId === change.doc.id);
              tempNewsfeed.splice(modifiedPosition, 1, change.doc.data());
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
          <div className={`App ${(isAddPostActive || isEditProfileActive || isFullPostActive) ? "blur" : ""}`} style={{ position: isFullPostActive && "fixed", top: isFullPostActive && `-${scrollY.current}px` }}>
            {!isLoggedIn && <Auth />}
            {isLoggedIn && <Nav />}
            {isLoggedIn && (
            <Routes>
              {/* eslint-disable-next-line */}
              <Route path="/" element={(<><Newsfeed /><ProfilePreview /></>)} />
              <Route path="/:uid" element={<Profile />} />
              {(beforeFullPost.newsfeed)
              // eslint-disable-next-line
                ? (<Route path="/p/:postId" element={(<><Newsfeed /><ProfilePreview /></>)} />)
                : (<Route path="/p/:postId" element={<Profile />} />)}

            </Routes>
            )}
          </div>
          {isAddPostActive && <AddPost />}
          {isEditProfileActive && <EditProfile />}
          {isFullPostActive && (
          <Routes>
            <Route path="/p/:postId" element={<FullPost />} />
            <Route path="*" element={<Page404 />} />
          </Routes>
          )}
        </UserContext.Provider>
      </BrowserRouter>
    </div>
  );
}

export default App;
