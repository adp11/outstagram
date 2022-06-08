import "./App.css";
import React, {
  useEffect, useState, useMemo, useRef,
} from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, onSnapshot, query,
} from "firebase/firestore";
import { insert } from "./utils";
import { db } from "./firebase";
import Nav from "./components/Nav/Nav";
import Newsfeed from "./components/Newsfeed";
import ProfilePreview from "./components/ProfilePreview";
import Profile from "./components/Profile";
import Auth from "./components/Auth/Auth";
import AddPost from "./components/Popups/AddPost";
import FullPost from "./components/Popups/FullPost";
import UserContext from "./components/Contexts/UserContext";
import EditProfile from "./components/Popups/EditProfile";
import PageNotFound from "./components/PageNotFound";
import LikeList from "./components/Popups/LikeList";
import FollowList from "./components/Popups/FollowList";
import Chat from "./components/Chat";

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
  const [isRoomPageNotFoundActive, setIsRoomPageNotFoundActive] = useState(false);
  const [isSearchChatActive, setIsSearchChatActive] = useState(false);
  const [isFullImageActive, setIsFullImageActive] = useState(false);
  const [abruptPostView, setAbruptPostView] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

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
  const unsubscribeFromRealTimeMessages = {};
  const didFetchActiveRooms = false;

  /*
    1. fetchNewsfeed() is meant to real-time listen to remote db
    2. Logic in getRealTimeUpdates(): there are 3 stages of change to db (creationTime: null (added), creationTime: [value] (modified), 10-key object: [full values] (modified))
    3. 10 outermost keys at least in a PROPER "change.doc.data()" object
  */

  function getRealTimeUpdates(q) {
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") {
          const deletePosition = tempNewsfeed.findIndex((post) => post.postId === change.doc.id);
          tempNewsfeed.splice(deletePosition, 1);
        } else if (change.type === "added") {
          const data = change.doc.data();
          if (Object.keys(data).length >= 10) {
            insert(tempNewsfeed, change.doc.data(), "creationTime"); // recent to old - big to small UnixTime
          }
        } else {
          const modifiedPosition = tempNewsfeed.findIndex((post) => post.postId === change.doc.id);
          const data = change.doc.data();
          if (modifiedPosition !== -1) {
            tempNewsfeed.splice(modifiedPosition, 1, data);
          } else if (modifiedPosition === -1 && Object.keys(data).length >= 10) {
            insert(tempNewsfeed, change.doc.data(), "creationTime");
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

  async function fetchUserData() {
    const docRef = doc(db, `users/uid_${getAuth().currentUser.uid}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserData(docSnap.data());
    }
  }

  /*
  1. allUserData is used in search box and search chat only
  2. fetAllUserData() is NOT real-time listening to remote db (e.g. new users signed up)
  */
  async function fetchAllUserData() {
    const querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach((document) => {
      const toBePushed = { ...document.data(), uid: document.id };
      tempAllUserData.push(toBePushed);
    });
    setAllUserData([...tempAllUserData]); // setAllUserData(tempAllUserData) won't work
  }

  const providerValue = useMemo(
    () => ({
      userData, allUserData, newsfeed, visitedUserData, beforeFullPost, fullPostIndex, fullPostInfo, likeListInfo, followListInfo, isLikeListActive, isFollowListActive, isFullPostActive, abruptPostView, isSearchChatActive, scrollY, isFullImageActive, isRoomPageNotFoundActive, unsubscribeFromRealTimeMessages, didFetchActiveRooms, darkMode, setFullPostIndex, fetchNewsfeed, setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, setUserData, setVisitedUserData, setIsFullPostActive, setBeforeFullPost, setFullPostInfo, setAllUserData, setLikeListInfo, setIsLikeListActive, setFollowListInfo, setIsFollowListActive, setIsProfilePageNotFoundActive, setIsPostPageNotFoundActive, setAbruptPostView, setIsSearchChatActive, setIsFullImageActive, setIsRoomPageNotFoundActive, setDarkMode,
    }),
    [userData, allUserData, newsfeed, visitedUserData, beforeFullPost, fullPostIndex, fullPostInfo, likeListInfo, followListInfo, isLikeListActive, isFollowListActive, isFullPostActive, abruptPostView, isSearchChatActive, scrollY, isFullImageActive, didFetchActiveRooms, isRoomPageNotFoundActive, darkMode],
  );

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserData();
      fetchAllUserData();
    } else { // reset all states basically
      setUserData(null);
      setVisitedUserData(null);
      setAllUserData([]);
      setNewsfeed([]);
      setFullPostIndex(null);
      setFullPostInfo(null);
      setIsProfilePageNotFoundActive(false);
      setIsPostPageNotFoundActive(false);
      setIsRoomPageNotFoundActive(false);
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
      fetchAllUserData();
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
              <Route path="/chat" element={<Chat />} />
              {!isProfilePageNotFoundActive && <Route path="/:uid" element={<Profile />} />}
              {isProfilePageNotFoundActive && <Route path="/:uid" element={<PageNotFound />} />}
              {!isRoomPageNotFoundActive && <Route path="/chat/:roomId" element={<Chat />} />}
              {isRoomPageNotFoundActive && <Route path="/chat/:roomId" element={<PageNotFound />} />}
              {/* act as a background while fullpost is on */}
              {(beforeFullPost.newsfeed && !abruptPostView) && <Route path="/p/:postId" element={(<><Newsfeed /><ProfilePreview /></>)} />}
              {/* act as a background while fullpost is on */}
              {((beforeFullPost.selfProfile || beforeFullPost.visitedProfile) && !abruptPostView) && <Route path="/p/:postId" element={<Profile />} />}
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
