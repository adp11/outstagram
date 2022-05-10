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

  const tempNewsfeed = []; // for state immutability
  const tempAllUserData = []; // for state immutability
  const scrollY = useRef(0);
  const initialFetch = false;

  const providerValue = useMemo(
    () => ({
      userData, visitedUserData, allUserData, newsfeed, beforeFullPost, scrollY, setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, setUserData, setVisitedUserData, setIsFullPostActive, setBeforeFullPost,
    }),
    [userData, visitedUserData, newsfeed, beforeFullPost],
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
      console.log(tempAllUserData);
      // setAllUserData([...tempAllUserData]);
      setAllUserData(tempAllUserData);
    }

    if (isLoggedIn) {
      fetchUserData();
      fetchAllUserData();
    } else {
      setUserData(null);
      setVisitedUserData(null);
      setAllUserData([]);
      setNewsfeed([]);
    }

    // prevent browser remember scroll position and auto scroll upon user refreshes the page.
    window.scrollTo(0, 0);
  }, [isLoggedIn]);

  useEffect(() => {
    /*
    1. fetch Newsfeed is designed to real-time listen to remote db
    2. Notice: onSnapshot is the LAST code block to be executed in this useEffect()
    */
    function fetchNewsfeed() {
      const { following } = userData;
      following.forEach(async (followee) => {
        const q = query(collection(db, `users/${followee.uid}/posts`));

        onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
              console.log("before removed");
              const deletePosition = tempNewsfeed.findIndex((post) => post.postId === change.doc.id);
              tempNewsfeed.splice(deletePosition, 1);
            } else if (change.type === "added") {
              console.log("before add");
              sortedAdd(tempNewsfeed, change.doc.data()); // oldest to newest
            } else {
              console.log("before modified");
              const modifiedPosition = tempNewsfeed.findIndex((post) => post.postId === change.doc.id);
              tempNewsfeed.splice(modifiedPosition, 1, change.doc.data());
            }
          });
          // BUG TODO: UI not rerender when newsfeed is updated
          setNewsfeed(tempNewsfeed);
        });
      });
    }
    console.log("triggered because of follow/unfollow")
    if (isLoggedIn) {
      console.log(userData, "userdata");
      fetchNewsfeed();
    }
  }, [userData]);

  /*
  1. Triggered upon both mouting and dependency changes
  2. Prefer abrupt scroll (not smooth)
  */
  useEffect(() => {
    if (!isFullPostActive) {
      window.scrollTo(0, scrollY.current);
    }
  }, [isFullPostActive]);

  return (
    <div>
      <BrowserRouter>
        <UserContext.Provider value={providerValue}>
          <div
            className={`App ${(isAddPostActive || isEditProfileActive || isFullPostActive) ? "blur" : ""}`}
            style={{ position: isFullPostActive && "fixed", top: isFullPostActive && `-${scrollY.current}px` }}
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
