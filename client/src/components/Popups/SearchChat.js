import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../Contexts/UserContext";
import ChatContext from "../Contexts/ChatContext";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";
const SERVER_URL = "https://adp11-outstagram.herokuapp.com";

function SearchChat() {
  const { userData, allUserData, setIsSearchChatActive } = useContext(UserContext);
  const {
    activeRoomList, setActiveRoomListHelper, setMessages, setWhichRoomActiveHelper,
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
    1. Update messages for self/sender by setState(frontend data)
    2. Update activeRoomList for both and messages for other/receiver by setState(realtime data) in socket Chat.js
    3. Return value "data" in fetch(): room document + justCreated
  */
  function createRoom(otherInfo) {
    setIsLoading(true);
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
    fetch(`${SERVER_URL}/api/rooms`, options)
      .then((response) => {
        if (!response.ok) {
          return response.json().then(({ message }) => {
            throw new Error(message || response.status);
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("data from json()", data);
        if (data.justCreated) {
        // update activeRoomList by pushing
          const tempActiveRoomList = [...activeRoomList];
          tempActiveRoomList.unshift({
            _id: data._id,
            members: {
              self: userData._id,
              other: otherInfo,
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
      })
      // .catch((err) => {
      //   console.log("error happened in catch", err);
      //   setIsLoading(false);
      //   setIsSearchChatActive(false);
      //   // alert(err.message);
      // });
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
