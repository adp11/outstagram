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
  // bool states
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

  // data states (some states need to reset before unmounting/closing to prevent bugs that later involve reference to those states' value)
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

  // extra states
  const scrollY = useRef(0);
  const unsubscribeFromRealTimeMessages = {};
  const didFetchActiveRooms = false;

  // 3 refs below as not able to access state in socket event handlers
  const newsfeedRef = useRef(newsfeed);
  function setNewsfeedHelper(data) {
    newsfeedRef.current = data;
    setNewsfeed(data);
  }

  const visitedUserDataRef = useRef(visitedUserData);
  function setVisitedUserDataHelper(data) {
    visitedUserDataRef.current = data;
    setVisitedUserData(data);
  }

  const userDataRef = useRef(userData);
  function setUserDataHelper(data) {
    userDataRef.current = data;
    setUserData(data);
  }

  const providerValue = useMemo(
    () => ({
      userData, allUserData, newsfeed, visitedUserData, beforeFullPost, fullPostIndex, fullPostInfo, likeListInfo, followListInfo, isLikeListActive, isFollowListActive, isFullPostActive, abruptPostView, isSearchChatActive, scrollY, isFullImageActive, isRoomPageNotFoundActive, unsubscribeFromRealTimeMessages, didFetchActiveRooms, darkMode, setNewsfeedHelper, setUserDataHelper, setFullPostIndex, setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, setVisitedUserDataHelper, setIsFullPostActive, setBeforeFullPost, setFullPostInfo, setAllUserData, setLikeListInfo, setIsLikeListActive, setFollowListInfo, setIsFollowListActive, setIsProfilePageNotFoundActive, setIsPostPageNotFoundActive, setAbruptPostView, setIsSearchChatActive, setIsFullImageActive, setIsRoomPageNotFoundActive, setDarkMode,
    }),
    [userData, allUserData, newsfeed, visitedUserData, beforeFullPost, fullPostIndex, fullPostInfo, likeListInfo, followListInfo, isLikeListActive, isFollowListActive, isFullPostActive, abruptPostView, isSearchChatActive, scrollY, isFullImageActive, didFetchActiveRooms, isRoomPageNotFoundActive, darkMode],
  );

  useEffect(() => {
    if (isLoggedIn) {
      const socket = io("http://localhost:4000", { transports: ["websocket"] });

      // client-side
      socket.on("connect", () => {
        console.log(socket.id);
      });

      // order of if conditions matters here (change in follow list wouldn't rerender UI when on visitedUserData (self profile) if 2nd if condition was first)
      socket.on("userDataChange", (data) => {
        if (data.user && visitedUserDataRef.current && data.user._id === visitedUserDataRef.current._id) {
          console.log("visited user change");
          setVisitedUserDataHelper(data.user);
        } else if (data.user && data.user._id === userDataRef.current._id) { // self user change
          console.log("self user change");
          setUserDataHelper(data.user);
        } else if (data.addedUser) { // new user signed up/added
          console.log("new user added");
          setAllUserData((prevAllUserData) => [...prevAllUserData, data.addedUser]);
        }
      });

      socket.on("newsfeedChange", (data) => {
        // only care about post change in db if the author's post is in current user's following list
        const dataAuthorInFollowing = userDataRef.current.following.findIndex((followee) => followee._id === data.author._id) > -1;

        if (userDataRef.current._id === data.author._id || dataAuthorInFollowing) {
          const dataChangePos = newsfeedRef.current.findIndex((post) => post._id === data._id);
          if (dataChangePos > -1) { // modified
            console.log("post modified in newsfeed");
            const tempNewsfeed = [...newsfeedRef.current];
            tempNewsfeed.splice(dataChangePos, 1, data);
            setNewsfeedHelper(tempNewsfeed);
          } else { // added
            console.log("post added in newsfeed");
            setNewsfeedHelper([data].concat(newsfeedRef.current));
          }
        }
      });
    } else { // reset all states basically
      setUserDataHelper(null);
      setVisitedUserDataHelper(null);
      setAllUserData([]);
      setNewsfeedHelper([]);
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
              {!isProfilePageNotFoundActive && <Route path="/u/:uid" element={<Profile />} />}
              {isProfilePageNotFoundActive && <Route path="/u/:uid" element={<PageNotFound />} />}
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
