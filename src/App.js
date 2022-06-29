import "./App.css";
import React, {
  useEffect, useState, useMemo, useRef,
} from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, onSnapshot, query,
} from "firebase/firestore";
import io from "socket.io-client";
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
  // const socket = io("http://localhost:4000", { transports: ["websocket"] });
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

  const scrollY = useRef(0);
  const unsubscribeFromRealTimeMessages = {};
  const didFetchActiveRooms = false;

  const providerValue = useMemo(
    () => ({
      userData, allUserData, newsfeed, visitedUserData, beforeFullPost, fullPostIndex, fullPostInfo, likeListInfo, followListInfo, isLikeListActive, isFollowListActive, isFullPostActive, abruptPostView, isSearchChatActive, scrollY, isFullImageActive, isRoomPageNotFoundActive, unsubscribeFromRealTimeMessages, didFetchActiveRooms, darkMode, setNewsfeed, setFullPostIndex, setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, setUserData, setVisitedUserData, setIsFullPostActive, setBeforeFullPost, setFullPostInfo, setAllUserData, setLikeListInfo, setIsLikeListActive, setFollowListInfo, setIsFollowListActive, setIsProfilePageNotFoundActive, setIsPostPageNotFoundActive, setAbruptPostView, setIsSearchChatActive, setIsFullImageActive, setIsRoomPageNotFoundActive, setDarkMode,
    }),
    [userData, allUserData, newsfeed, visitedUserData, beforeFullPost, fullPostIndex, fullPostInfo, likeListInfo, followListInfo, isLikeListActive, isFollowListActive, isFullPostActive, abruptPostView, isSearchChatActive, scrollY, isFullImageActive, didFetchActiveRooms, isRoomPageNotFoundActive, darkMode],
  );

  useEffect(() => {
    if (isLoggedIn) {
      const socket = io("http://localhost:4000", { transports: ["websocket"] });

      // socket.on("userDataChange", (data) => {
      //   if (data._id === userData._id) { // if change happens to self user, then replace
      //     setUserData(data.fullDocument);
      //   } else { // new user signed up/added

      //   }
      // });

      socket.on("newsfeedChange", (data) => {
        // only care about post change in db if the author's post is in current user's following list
        console.log("post change has been sent to frontend", data.createdAt);
        if (userData._id === data.author._id || userData.following.includes(data.author._id)) {
          const dataChangePos = newsfeed.findIndex((post) => post._id === data._id);
          let tempNewsfeed;
          if (dataChangePos > -1) { // modified
            console.log("post modified in newsfeed");
            tempNewsfeed = newsfeed.splice(dataChangePos, 1, data);
          } else { // added
            console.log("post added in newsfeed");
            tempNewsfeed = [data].concat(newsfeed);
          }
          setNewsfeed(tempNewsfeed);
        }
      });
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
      // add code for detach listening from socket and realtime mongo
    }

    // window.scrollTo(0, 0); // optional: prevent browser remember scroll position and auto scroll upon user refreshes the page.
  }, [isLoggedIn]);

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
              {(beforeFullPost.newsfeed && !abruptPostView) && (
              <Route
                path="/p/:postId"
                element={(
                  <>
                    <Newsfeed />
                    <ProfilePreview />
                  </>
)}
              />
              )}
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
