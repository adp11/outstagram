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
  console.log("in App.js");
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
  const [isFullPostByLink, setIsFullPostByLink] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // data states (some states need to reset before unmounting/closing to prevent subtle bugs that later involve reference to those states' value)
  const [userData, setUserData] = useState(null);
  const [visitedUserData, setVisitedUserData] = useState(null);
  const [allUserData, setAllUserData] = useState([]);
  const [newsfeed, setNewsfeed] = useState([]);
  const [beforeFullPost, setBeforeFullPost] = useState({
    profile: false,
    newsfeed: false,
  });
  const [fullPostIndex, setFullPostIndex] = useState(null);
  const [fullPostInfo, setFullPostInfo] = useState(null);
  const [likeListInfo, setLikeListInfo] = useState({});
  const [followListInfo, setFollowListInfo] = useState({
    followers: [],
    following: [],
  });

  // extra chat states
  const scrollY = useRef(0);
  const unsubscribeFromRealTimeMessages = {};

  // 4 refs below as not able to access state in socket event handlers
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

  const fullPostInfoRef = useRef(fullPostInfo);
  function setFullPostInfoRef(data) {
    fullPostInfoRef.current = data;
    setFullPostInfo(data);
  }

  const socketRef = useRef(null);

  const providerValue = useMemo(
    () => ({
      socketRef, userDataRef, userData, allUserData, newsfeed, visitedUserData, beforeFullPost, fullPostIndex, fullPostInfo, likeListInfo, followListInfo, isLikeListActive, isFollowListActive, isFullPostActive, isFullPostByLink, isSearchChatActive, scrollY, isFullImageActive, isRoomPageNotFoundActive, unsubscribeFromRealTimeMessages, darkMode, setNewsfeedHelper, setUserDataHelper, setFullPostIndex, setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, setVisitedUserDataHelper, setIsFullPostActive, setBeforeFullPost, setFullPostInfoRef, setAllUserData, setLikeListInfo, setIsLikeListActive, setFollowListInfo, setIsFollowListActive, setIsProfilePageNotFoundActive, setIsPostPageNotFoundActive, setIsFullPostByLink, setIsSearchChatActive, setIsFullImageActive, setIsRoomPageNotFoundActive, setDarkMode,
    }),
    [userData, allUserData, newsfeed, visitedUserData, beforeFullPost, fullPostIndex, fullPostInfo, likeListInfo, followListInfo, isLikeListActive, isFollowListActive, isFullPostActive, isFullPostByLink, isSearchChatActive, scrollY, isFullImageActive, isRoomPageNotFoundActive, darkMode],
  );

  useEffect(() => {
    if (isLoggedIn) {
      socketRef.current = io("http://localhost:4000");

      // client-side
      socketRef.current.on("connect", () => {
        console.log("socket connected when logged in and realtime is on", socketRef.current.id);
        /* Logic: 2 cases for operationType "update" but only 1 case for operationType "insert". It is EITHER those first two OR the last one
        */
        socketRef.current.on("disconnect", () => {
          console.log("socket disconnected from client");
        });
        socketRef.current.on("userDataChange", (data) => {
          if (data.user && data.user._id === userDataRef.current._id) {
            console.log("self user change");
            setUserDataHelper(data.user);
          }

          // could be current user visiting someone else' profile OR self profile
          if (data.user && visitedUserDataRef.current && data.user._id === visitedUserDataRef.current._id) {
            console.log("visited user change");
            setVisitedUserDataHelper(data.user);
          } else if (data.addedUser) { // new user signed up/added
            console.log("new user added");
            setAllUserData((prevAllUserData) => [...prevAllUserData, data.addedUser]);
          }
        });

        /* Notices for the first half and second half that triggered newsfeedChange
        1. If current user just followed an Id, that user (data.for) gets a new newsfeed (data.refreshedNewsfeed)
        2. If just unfollowed, that user (data.for) removes that followee Id (data.removedPostsOf) from current newsfeed
        3. If like/comment on existing posts in db, set() by replacing if those's authors are in current user's following list (last "else if")
        4. If new posts added to db, set() by adding if those's authors ... (last "else if")
      */
        socketRef.current.on("newsfeedChange", (data) => {
          if (data.removedPostId) {
            setNewsfeedHelper(newsfeedRef.current.filter((post) => post._id !== data.removedPostId));
          } else if (data.for === userDataRef.current._id) { // first half
            if (data.refreshedNewsfeed) {
              console.log("newsfeed refreshed all");
              setNewsfeedHelper(data.refreshedNewsfeed);
            } else {
              console.log("newsfeed got some removed");
              setNewsfeedHelper(newsfeedRef.current.filter((post) => post.author._id !== data.removedPostsOf));
            }
          } else if (data.for === undefined) { // second half
            const dataAuthorInFollowing = userDataRef.current.following.findIndex((followee) => followee._id === data.author._id) > -1;

            if (userDataRef.current._id === data.author._id || dataAuthorInFollowing) {
              const dataChangePos = newsfeedRef.current.findIndex((post) => post._id === data._id);
              if (dataChangePos > -1) {
                console.log("post modified in newsfeed");
                const tempNewsfeed = [...newsfeedRef.current];
                tempNewsfeed.splice(dataChangePos, 1, data);
                setNewsfeedHelper(tempNewsfeed);
              } else {
                console.log("post added in newsfeed");
                setNewsfeedHelper([data].concat(newsfeedRef.current));
              }
            }

            if (fullPostInfoRef.current && (fullPostInfoRef.current._id === data._id)) {
              setFullPostInfoRef(data);
            }
          }
        });
      });
    } else { // reset all states basically
      console.log("reset ALL STATES???");
      if (socketRef.current) {
        console.log("closing socket from client", socketRef.current.id);
        socketRef.current.disconnect();
      }
      setUserDataHelper(null);
      setVisitedUserDataHelper(null);
      setAllUserData([]);
      setNewsfeedHelper([]);
      setFullPostIndex(null);
      setFullPostInfoRef(null);
      setIsProfilePageNotFoundActive(false);
      setIsPostPageNotFoundActive(false);
      setIsRoomPageNotFoundActive(false);
      setIsFullPostByLink(false);
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
              <Route path="/rooms" element={<Chat />} />
              {!isProfilePageNotFoundActive && <Route path="/u/:uid" element={<Profile />} />}
              {isProfilePageNotFoundActive && <Route path="/u/:uid" element={<PageNotFound />} />}
              {!isRoomPageNotFoundActive && <Route path="/r/:roomId" element={<Chat />} />}
              {isRoomPageNotFoundActive && <Route path="/r/:roomId" element={<PageNotFound />} />}
              {/* act as a background while fullpost is on */}
              {(beforeFullPost.newsfeed && !isFullPostByLink) && (
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
              {((beforeFullPost.profile) && !isFullPostByLink) && <Route path="/p/:postId" element={<Profile />} />}
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
