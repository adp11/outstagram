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
import { insert } from "./utils";
import PageNotFound from "./components/PageNotFound";
import LikeList from "./components/LikeList";
import FollowList from "./components/FollowList";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAddPostActive, setIsAddPostActive] = useState(false);
  const [isEditProfileActive, setIsEditProfileActive] = useState(false);
  const [isFullPostActive, setIsFullPostActive] = useState(false);
  const [isLikeListActive, setIsLikeListActive] = useState(false);
  const [isFollowListActive, setIsFollowListActive] = useState({
    followers: false,
    following: false,
  });
  const [isProfilePageNotFoundActive, setIsProfilePageNotFoundActive] = useState(false);
  const [isPostPageNotFoundActive, setIsPostPageNotFoundActive] = useState(false);
  const [abruptPostView, setAbruptPostView] = useState(false);

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
  const [likeListInfo, setLikeListInfo] = useState({});
  const [followListInfo, setFollowListInfo] = useState({
    followers: [],
    following: [],
  });

  const tempNewsfeed = []; // for state immutability
  const tempAllUserData = []; // for state immutability
  const scrollY = useRef(0);
  let stopRealTimeListen1 = null;
  let stopRealTimeListen2 = null;

  /*
    1. fetch Newsfeed is designed to real-time listen to remote db
    2. There are 3 stages of change to db (creationTime: null (added), creationTime: [value] (modified), 10-key object: [full values] (modified))
    3. 10 outermost keys at least in a PROPER "change.doc.data()" object
    */

  function getRealTimeUpdates(q) {
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") {
          console.log("before removed");
          const deletePosition = tempNewsfeed.findIndex((post) => post.postId === change.doc.id);
          tempNewsfeed.splice(deletePosition, 1);
        } else if (change.type === "added") {
          const data = change.doc.data();
          if (Object.keys(data).length >= 10) {
            insert(tempNewsfeed, change.doc.data()); // recent to old - big to small UnixTime
          }
        } else {
          console.log("before modified");
          const modifiedPosition = tempNewsfeed.findIndex((post) => post.postId === change.doc.id);
          const data = change.doc.data();
          if (modifiedPosition !== -1) {
            tempNewsfeed.splice(modifiedPosition, 1, data);
          } else if (modifiedPosition === -1 && Object.keys(data).length >= 10) {
            insert(tempNewsfeed, change.doc.data());
          }
        }
      });
      setNewsfeed([...tempNewsfeed]); // setNewsfeed(tempNewsfeed) won't work
    });
  }

  // Don't factor out "posts from self" code block to prevent double rerender from 2 setNewsfeed() from 2 real-time listening
  function fetchNewsfeed() {
    const { following } = userData;
    if (following.length) {
      // posts from self
      const q1 = query(collection(db, `users/${userData.uid}/posts`));
      stopRealTimeListen1 = getRealTimeUpdates(q1);

      // posts from people user follows
      following.forEach((followee) => {
        const q2 = query(collection(db, `users/${followee.uid}/posts`));
        stopRealTimeListen2 = getRealTimeUpdates(q2);
      });
    } else {
      // posts from self
      const q1 = query(collection(db, `users/${userData.uid}/posts`));
      stopRealTimeListen1 = getRealTimeUpdates(q1);
    }
  }

  const providerValue = useMemo(
    () => ({
      userData, visitedUserData, allUserData, newsfeed, beforeFullPost, fullPostIndex, fullPostInfo, isLikeListActive, isFollowListActive, isFullPostActive, likeListInfo, followListInfo, abruptPostView, scrollY, setFullPostIndex, fetchNewsfeed, setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, setUserData, setVisitedUserData, setIsFullPostActive, setBeforeFullPost, setFullPostInfo, setAllUserData, setLikeListInfo, setIsLikeListActive, setFollowListInfo, setIsFollowListActive, setIsProfilePageNotFoundActive, setIsPostPageNotFoundActive, setAbruptPostView,
    }),
    [userData, allUserData, visitedUserData, newsfeed, beforeFullPost, fullPostIndex, fullPostInfo, likeListInfo, followListInfo, isLikeListActive, isFollowListActive, abruptPostView, isFullPostActive],
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
    1. Fetch allUserData is used in search box only
    2. Fetch allUserData is NOT designed to real-time listen to remote db (e.g. new users logged)
    */
    async function fetchAllUserData() {
      const querySnapshot = await getDocs(collection(db, "users"));
      querySnapshot.forEach((document) => {
        const toBePushed = { ...document.data(), uid: document.id };
        tempAllUserData.push(toBePushed);
      });
      setAllUserData([...tempAllUserData]); // setAllUserData(tempAllUserData) won't work
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
      setIsProfilePageNotFoundActive(false);
      setIsPostPageNotFoundActive(false);
      setAbruptPostView(false);
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

    // window.scrollTo(0, 0); // optional: prevent browser remember scroll position and auto scroll upon user refreshes the page.
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
    if (!(isAddPostActive && isEditProfileActive && isFullPostActive && isLikeListActive && (isFollowListActive.followers || isFollowListActive.following))) {
      window.scrollTo(0, scrollY.current);
    }
  }, [isFullPostActive, isEditProfileActive, isAddPostActive, isLikeListActive, isFollowListActive]);

  return (
    <div>
      <BrowserRouter>
        <UserContext.Provider value={providerValue}>
          <div
            className={`App ${(isAddPostActive || isEditProfileActive || isFullPostActive || isLikeListActive || (isFollowListActive.followers || isFollowListActive.following)) ? "blur opac" : ""}`}
            style={{
              position: (isAddPostActive || isEditProfileActive || isFullPostActive || isLikeListActive || (isFollowListActive.followers || isFollowListActive.following)) && "fixed",
              top: (isAddPostActive || isEditProfileActive || isFullPostActive || isLikeListActive || (isFollowListActive.followers || isFollowListActive.following)) && `-${scrollY.current}px`,
            }}
          >
            {!isLoggedIn && <Auth />}
            {isLoggedIn && <Nav />}
            {isLoggedIn && (
            <Routes>
              {/* eslint-disable-next-line */}
              <Route path="/" element={(<><Newsfeed /><ProfilePreview /></>)} />
              {!isProfilePageNotFoundActive && <Route path="/:uid" element={<Profile />} />}
              {isProfilePageNotFoundActive && <Route path="/:uid" element={<PageNotFound />} />}
              {/* eslint-disable-next-line */}
              {(beforeFullPost.newsfeed) && <Route path="/p/:postId" element={(<><Newsfeed /><ProfilePreview /></>)} />}
              {(beforeFullPost.selfProfile || beforeFullPost.visitedProfile) && <Route path="/p/:postId" element={<Profile />} />}
              {isPostPageNotFoundActive && <Route path="/p/:postId" element={<PageNotFound />} />}
            </Routes>
            )}
          </div>

          {isAddPostActive && <AddPost />}
          {isEditProfileActive && <EditProfile />}
          {isFullPostActive && (
            <Routes>
              <Route path="/p/:postId" element={<FullPost />} />
            </Routes>
          )}
          {isLikeListActive && <LikeList />}
          {(isFollowListActive.followers || isFollowListActive.following) && <FollowList />}
        </UserContext.Provider>
      </BrowserRouter>
    </div>
  );
}

export default App;
