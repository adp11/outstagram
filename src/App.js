import "./App.css";
import React, {
  useEffect, useState, useMemo, useRef,
} from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, onSnapshot, query,
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
import { quickSort, insert } from "./utils";
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
    selfProfile: false,
    visitedProfile: false,
    newsfeed: false,
  });
  const [fullPostIndex, setFullPostIndex] = useState(null);
  const [fullPostInfo, setFullPostInfo] = useState(null);

  const tempNewsfeed = []; // for state immutability
  const tempAllUserData = []; // for state immutability
  const scrollY = useRef(0);
  let stopRealTimeListen1 = null;
  let stopRealTimeListen2 = null;

  /*
    1. fetch Newsfeed is designed to real-time listen to remote db
    2. Notice: onSnapshot is the LAST code block to be executed in this useEffect()
    */

    function getRealTimeUpdates(q) {
      return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "removed") {
            console.log("before removed");
            const deletePosition = tempNewsfeed.findIndex((post) => post.postId === change.doc.id);
            tempNewsfeed.splice(deletePosition, 1);
          } else if (change.type === "added") {
            console.log("before add");
            insert(change.doc.data(), tempNewsfeed); // old to recent - need to be reversed later when populating
          } else {
            console.log("before modified");
            const modifiedPosition = tempNewsfeed.findIndex((post) => post.postId === change.doc.id);
            tempNewsfeed.splice(modifiedPosition, 1, change.doc.data());
          }
        });
        setNewsfeed([...tempNewsfeed]); // setNewsfeed(tempNewsfeed) won't work
      });
    }

  // BUG TODO
  function fetchNewsfeed() {
    // // posts from self
    // const q1 = query(collection(db, `users/${userData.uid}/posts`));
    // stopRealTimeListen1 = getRealTimeUpdates(q1);

    // posts from people user follows
    const { following } = userData;
    if (following.length) {
      following.forEach((followee) => {
        const q2 = query(collection(db, `users/${followee.uid}/posts`));
        stopRealTimeListen2 = getRealTimeUpdates(q2);
      });
    } else {
      setNewsfeed([]);
    }

    // console.log("self is next");
    // // posts from self
    // console.log(userData.uid);
    // const q1 = query(collection(db, `users/${userData.uid}/posts`));
    // stopRealTimeListen1 = getRealTimeUpdates(q1);
  }

  const providerValue = useMemo(
    () => ({
      userData, visitedUserData, allUserData, newsfeed, beforeFullPost, fullPostIndex, setFullPostIndex, scrollY, fetchNewsfeed, setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, setUserData, setVisitedUserData, setIsFullPostActive, setBeforeFullPost, fullPostInfo, setFullPostInfo, setAllUserData,
    }),
    [userData, allUserData, visitedUserData, newsfeed, beforeFullPost, fullPostIndex, fullPostInfo],
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
    1. Fetch allUserData is to get all users to be filtered/sorted when a user is using search box only
    2. Fetch allUserData is NOT designed to real-time listen to remote db (e.g. new users logged)
    3. querySnapshot.map() won't work. Use forEach()
    */
    async function fetchAllUserData() {
      const querySnapshot = await getDocs(collection(db, "users"));
      querySnapshot.forEach((document) => {
        const toBePushed = { ...document.data(), uid: document.id };
        tempAllUserData.push(toBePushed);
      });
      setAllUserData([...tempAllUserData]);
      // setAllUserData(tempAllUserData);
    }

    if (isLoggedIn) {
      fetchUserData();
      fetchAllUserData();
    } else {
      setUserData(null);
      setVisitedUserData(null);
      setAllUserData([]);
      setNewsfeed([]);
      setFullPostIndex(null);
      setFullPostInfo(null);
      scrollY.current = 0;
      if (stopRealTimeListen1) {
        stopRealTimeListen1();
        stopRealTimeListen1 = null;
      }
      if (stopRealTimeListen2) {
        stopRealTimeListen2();
        stopRealTimeListen2 = null;
      }
    }

    // prevent browser remember scroll position and auto scroll upon user refreshes the page.
    // window.scrollTo(0, 0);
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchNewsfeed();
    }
  }, [userData]);

  /*
  1. Triggered upon both mouting and dependency changes
  2. Prefer abrupt scroll (not smooth)
  */
  useEffect(() => {
    if (!(isAddPostActive && isEditProfileActive && isFullPostActive)) {
      window.scrollTo(0, scrollY.current);
      // scrollY.current = 0;
    }
  }, [isFullPostActive, isEditProfileActive, isAddPostActive]);

  return (
    <div>
      <BrowserRouter>
        <UserContext.Provider value={providerValue}>
          <div
            className={`App ${(isAddPostActive || isEditProfileActive || isFullPostActive) ? "blur" : ""}`}
            style={{ position: (isAddPostActive || isEditProfileActive || isFullPostActive) && "fixed", top: (isAddPostActive || isEditProfileActive || isFullPostActive) && `-${scrollY.current}px` }}
          >
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
