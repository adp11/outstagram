import { getAuth } from "firebase/auth";
import {
  addDoc,
  arrayUnion, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where,
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import uniqid from "uniqid";
import UserContext from "./Contexts/UserContext";
import { db } from "../firebase";
import Snackbar from "./Snackbar";
import { computeHowLongAgo } from "../utils";
import ChatContext from "./Contexts/ChatContext";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

function SearchChat() {
  const [isLoading, setIsLoading] = useState(false);
  const { setIsSearchChatActive, allUserData, userData } = useContext(UserContext);
  const modifedAllUserData = allUserData.filter((data) => (data.uid !== userData.uid));
  const [searchResults, setSearchResults] = useState(modifedAllUserData);
  const {
    messages, setMessages, setWhichRoomActive, setActiveRoomList, activeRoomList, handleViewFullRoom,
  } = useContext(ChatContext);
  const navigate = useNavigate();

  function handleQuery(value) {
    if (value) {
      const filtered = modifedAllUserData.filter((data) => (data.username.toLowerCase().includes(value) || data.displayName.toLowerCase().includes(value)));
      setSearchResults(filtered);
    } else {
      setSearchResults(modifedAllUserData);
    }
  }

  async function createChatRoom(otherUid) {
    const tempActiveRoomList = [...activeRoomList];
    setIsLoading(true);
    const roomsRef = collection(db, `users/${userData.uid}/rooms`);
    const q = query(roomsRef, where("members", "array-contains", otherUid));

    const querySnapshot = await getDocs(q);
    // room already existed, then open all messages from that chat room
    if (querySnapshot.size > 0) {
      querySnapshot.forEach((document) => {
        const { roomId } = document.data();
        // push that active chat on top of the list
        const toBeRemoved = tempActiveRoomList.findIndex((chat) => chat.roomId === roomId);
        tempActiveRoomList.splice(toBeRemoved, 1);
        tempActiveRoomList.unshift(document.data());

        setActiveRoomList(tempActiveRoomList);

        setIsLoading(false);
        setIsSearchChatActive(false);
        handleViewFullRoom(document.data());
      });

    // otherwise, create a new room
    } else {
      const roomRef = doc(collection(db, `users/${userData.uid}/rooms`));
      let roomInfo;
      let otherInfo;

      // retrieve the other user's info
      const docRef1 = doc(db, `users/${otherUid}`);
      const docSnap1 = await getDoc(docRef1);

      if (docSnap1.exists()) {
        otherInfo = docSnap1.data();
        // create room for self
        roomInfo = {
          roomId: `r_${roomRef.id}`,
          members: [userData.uid, otherUid],
          membersInfo: {
            self: {
              photoURL: userData.photoURL,
              username: userData.username,
              displayName: userData.displayName,
            },
            other: {
              photoURL: otherInfo.photoURL,
              username: otherInfo.username,
              displayName: otherInfo.displayName,
            },
          },
          lastMessageSent: "",
          lastMessageSentTime: null,
        };
        await setDoc(doc(db, `users/${userData.uid}/rooms/r_${roomRef.id}`), {
          ...roomInfo,
          creationTime: serverTimestamp(),
        });
      }
      console.log("finished creating for self");

      // retrieve back creationTime to create room for the other too (since serverTimestamp() cannot be assigned)
      const docRef2 = doc(db, `users/${userData.uid}/rooms/r_${roomRef.id}`);
      const docSnap2 = await getDoc(docRef2);

      if (docSnap2.exists()) {
        roomInfo.creationTime = docSnap2.data().creationTime;

        // create room for the other
        // roomInfo2 = {
        //   roomId: `r_${roomRef.id}`,
        //   members: [otherUid, userData.uid],
        //   membersInfo: {
        //     self: {
        //       photoURL: otherInfo.photoURL,
        //       username: otherInfo.username,
        //       displayName: otherInfo.displayName,
        //     },
        //     other: {
        //       photoURL: userData.photoURL,
        //       username: userData.username,
        //       displayName: userData.displayName,
        //     },
        //   },
        //   creationTime: roomInfo.creationTime,
        //   lastMessageSent: "",
        //   lastMessageSentTime: null,
        // };
        await setDoc(doc(db, `users/${otherUid}/rooms/r_${roomRef.id}`), {
          roomId: `r_${roomRef.id}`,
          members: [otherUid, userData.uid],
          membersInfo: {
            self: {
              photoURL: otherInfo.photoURL,
              username: otherInfo.username,
              displayName: otherInfo.displayName,
            },
            other: {
              photoURL: userData.photoURL,
              username: userData.username,
              displayName: userData.displayName,
            },
          },
          creationTime: roomInfo.creationTime,
          lastMessageSent: "",
          lastMessageSentTime: null,
        });
      }
      console.log("finished creating for other");
      tempActiveRoomList.unshift(roomInfo);
      setActiveRoomList(tempActiveRoomList);
      setIsLoading(false);
      setIsSearchChatActive(false);
      handleViewFullRoom(roomInfo);
    }
  }

  return (
    <div className="SearchChat">
      {/* eslint-disable-next-line */}
      <div className="container" style={{ maxHeight: "400px", padding: "10px 20px" }}>
        <div style={{ width: "100%", textAlign: "center", position: "relative" }}>
          <span className="bold">New message</span>
          <svg
            onClick={() => { setIsSearchChatActive(false); }}
            aria-label="Close"
            color="#262626"
            fill="#262626"
            height="18"
            role="img"
            viewBox="0 0 24 24"
            width="18"
            style={{
              position: "absolute", right: "0px", top: "3px", fontSize: "30px",
            }}
          >
            {/* eslint-disable-next-line */}
            <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></polyline>
            {/* eslint-disable-next-line */}
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354"></line>
          </svg>
        </div>
        {/* onFocus={() => { setIsSearchActive(true); }} onChange={(e) => { handleQuery(e.target.value.toLowerCase()); }} */}
        <input type="search" placeholder="Search..." maxLength="20" onChange={(e) => { handleQuery(e.target.value.trim().toLowerCase()); }} />
        {isLoading ? (
          <img src={LOADING_IMAGE_URL} alt="loading" style={{ width: "24px", height: "24px" }} />
        ) : (
          <div className="dropdown" style={{ overflow: "auto", width: "100%" }}>
            {searchResults.map((result) => (
              <div onClick={() => { createChatRoom(result.uid); }} className="search-result" key={result.uid}>
                <img src={result.photoURL} alt="user pic in search" className="user-avatar-in-search" />
                <div>
                  <div className="bold medium cut1">{result.username}</div>
                  <div className="grey medium">{result.displayName}</div>
                </div>
              </div>
            ))}
            {/* <div className="no-result bold grey" style={{ textAlign: "center" }}>No users found.</div> */}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchChat;
