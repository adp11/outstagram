import {
  collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where,
} from "firebase/firestore";
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../Contexts/UserContext";
import { db } from "../../firebase";
import ChatContext from "../Contexts/ChatContext";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

function SearchChat() {
  const { userData, allUserData, setIsSearchChatActive } = useContext(UserContext);
  const {
    activeRoomList, setActiveRoomListHelper, handleViewFullRoom, setMessages, setWhichRoomActiveHelper,
  } = useContext(ChatContext);

  const navigate = useNavigate();

  const modifedAllUserData = allUserData.filter((data) => (data._id !== userData._id)); // exclude self

  const [searchResults, setSearchResults] = useState(modifedAllUserData);
  const [isLoading, setIsLoading] = useState(false);

  function handleQuery(value) {
    if (value) {
      const filtered = modifedAllUserData.filter((data) => (data.username.toLowerCase().includes(value) || data.displayName.toLowerCase().includes(value)));
      setSearchResults(filtered);
    } else {
      setSearchResults(modifedAllUserData);
    }
  }

  /*
    1. Update activeRoomList and messages for self/sender by setState(frontend data)
    2. Update activeRoomList and messages for other/receiver by setState(realtime data) in socket Chat.js
    3. Return value "data" in fetch(): room document + justCreated
  */
  async function createRoom(otherInfo) {
    setIsLoading(true);
    console.log("info for creating room", otherInfo);
    const options = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selfId: userData._id,
        otherId: otherInfo._id,
      }),
    };
    fetch("http://localhost:4000/rooms", options)
      .then((response) => response.json())
      .then((data) => {
        if (data.errorMsg) {
          alert(data.errorMsg);
          setIsLoading(false);
          setIsSearchChatActive(false);
        } else if (data.justCreated) {
          console.log("room just created");
          // update activeRoomList by pushing
          const tempActiveRoomList = [...activeRoomList];
          tempActiveRoomList.unshift({
            _id: data._id,
            members: {
              self: userData._id,
              other: otherInfo, // (_id, photoURL, displayName, username)
            },
            lastMessageSent: null,
          });
          setActiveRoomListHelper(tempActiveRoomList);

          // turn on whichRoomActive and update messages
          setIsSearchChatActive(false);
          setMessages(data.messages);
          setWhichRoomActiveHelper({
            roomId: data._id,
            otherId: otherInfo._id,
            otherDisplayname: otherInfo.displayName,
            otherPhotoURL: otherInfo.photoURL,
          });

          setIsLoading(false);
          navigate(`/r/${data._id}`);
        } else if (!data.justCreated) {
          console.log("room retrieved");
          // update activeRoomList by replacing
          const tempActiveRoomList = [...activeRoomList];
          const toBeRemoved = tempActiveRoomList.findIndex((room) => room._id === data._id);
          const theRoom = tempActiveRoomList[toBeRemoved];
          if (toBeRemoved > 0) {
            tempActiveRoomList.splice(toBeRemoved, 1);
            tempActiveRoomList.unshift(theRoom);
            setActiveRoomListHelper(tempActiveRoomList);
          }

          // turn on whichRoomActive and update messages
          setIsSearchChatActive(false);
          setMessages(data.messages);
          setWhichRoomActiveHelper({
            roomId: data._id,
            otherId: otherInfo._id,
            otherDisplayname: otherInfo.displayName,
            otherPhotoURL: otherInfo.photoURL,
          });

          setIsLoading(false);
          navigate(`/r/${data._id}`);
        }
      });
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
            color="currentColor"
            fill="currentColor"
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
        <input type="search" placeholder="Search..." maxLength="20" onChange={(e) => { handleQuery(e.target.value.trim().toLowerCase()); }} />
        {isLoading ? (
          <img src={LOADING_IMAGE_URL} alt="loading" style={{ width: "24px", height: "24px" }} />
        ) : (
          <div className="dropdown" style={{ overflow: "auto", width: "100%" }}>
            {searchResults.map((result) => (
              <div onClick={() => { createRoom(result); }} className="search-result" key={result._id}>
                <img src={result.photoURL} alt="user pic in search" className="user-avatar-in-search" />
                <div>
                  <div className="bold medium cut1">{result.username}</div>
                  <div className="grey medium">{result.displayName}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchChat;
