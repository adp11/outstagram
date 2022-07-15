import React, {
  useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDownloadURL, ref, uploadBytesResumable,
} from "firebase/storage";
import { v4 as uuid } from "uuid";
import { storage } from "../firebase";
import UserContext from "./Contexts/UserContext";
import Snackbar from "./Popups/Snackbar";
import { computeHowLongAgo, quickSort } from "../utils";
import ChatContext from "./Contexts/ChatContext";
import SearchChat from "./Popups/SearchChat";
import FullImage from "./Popups/FullImage";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

function Chat() {
  const {
    userData, isFullImageActive, isSearchChatActive, darkMode,
    setIsSearchChatActive, setVisitedUserDataHelper, setIsFullImageActive, setIsProfilePageNotFoundActive, socketRef,
  } = useContext(UserContext);

  const [activeRoomList, setActiveRoomList] = useState(quickSort(userData.rooms));
  const [whichRoomActive, setWhichRoomActive] = useState(null);
  const [messages, setMessages] = useState([]);

  const [texts, setTexts] = useState({});
  const [previewImageURL, setPreviewImageURL] = useState(null);
  const [fullImageURL, setFullImageURL] = useState(null);

  const [sendImageError, setSendImageError] = useState(null);
  const [notImplementedError, setNotImplementedError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const [didDisplayRoomList, setDidDisplayRoomList] = useState(true);

  const params = useParams();
  const navigate = useNavigate();
  const messagesRef = useRef();

  // not able to access state inside event handlers
  const activeRoomListRef = useRef(activeRoomList);
  function setActiveRoomListHelper(data) {
    activeRoomListRef.current = data;
    setActiveRoomList(data);
  }

  const whichRoomActiveRef = useRef(whichRoomActive);
  function setWhichRoomActiveHelper(data) {
    whichRoomActiveRef.current = data;
    setWhichRoomActive(data);
  }

  async function handleSubmitImage(file) {
    const messageId = uuid();
    try {
      // 1 - Upload the image to Cloud Storage
      const filePath = `${userData._id}/rooms/${file.name}`;
      const newImageRef = ref(storage, filePath);
      const fileSnapshot = await uploadBytesResumable(newImageRef, file);

      // 2 - Generate a public URL for the file.
      const publicImageURL = await getDownloadURL(newImageRef);

      // 3 - Add to db
      const options = {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          _id: messageId,
          from: userData._id,
          to: whichRoomActive.otherId,
          message: "[img]",
          imageURL: publicImageURL,
          storageURL: fileSnapshot.metadata.fullPath,
        }),
      };

      fetch(`http://localhost:4000/rooms/${whichRoomActive.roomId}`, options)
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
          setMessages(messages.concat({
            _id: messageId,
            from: {
              _id: userData._id,
              photoURL: userData.photoURL,
              username: userData.username,
              displayName: userData.displayName,
            },
            message: "[img]",
            imageURL: publicImageURL,
            storageURL: fileSnapshot.metadata.fullPath,
          }));
          setPreviewImageURL(null);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log("error happened in catch", err);
          setPreviewImageURL(null);
          setIsLoading(false);
          alert(err.message);
        });
    } catch (error) {
      setSendImageError(`Uploading Error: ${error}`);
      setPreviewImageURL(null);
      setIsLoading(false);
    }
  }

  function handleMediaFileSelected(e) {
    const fileSelected = e.target.files[0];
    if (!fileSelected.type.match("image.*")) { // prevent invalid file type
      setSendImageError("You can only share images");
      return;
    }
    setPreviewImageURL(URL.createObjectURL(fileSelected));
    setIsLoading(true);
    handleSubmitImage(fileSelected);
  }

  function handleSubmitMessage(e, heart = false) {
    e.preventDefault();
    const messageId = uuid();
    const lastMessageSent = heart ? "[heartdropped]" : texts[whichRoomActive.roomId];
    const options = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _id: messageId,
        from: userData._id,
        to: whichRoomActive.otherId,
        message: lastMessageSent,
      }),
    };
    fetch(`http://localhost:4000/rooms/${whichRoomActive.roomId}`, options)
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
        setTexts({ ...texts, [whichRoomActive.roomId]: "" });
        // if set new activeRoomList (use frontend data), it would be here

        // set new messages (use frontend data)
        setMessages(messages.concat({
          _id: messageId,
          from: {
            _id: userData._id,
            photoURL: userData.photoURL,
            username: userData.username,
            displayName: userData.displayName,
          },
          message: lastMessageSent,
        }));
      })
      .catch((err) => {
        console.log("error happened in catch", err);
        alert(err.message);
      });
  }

  function handleVisitProfile(_id) {
    const options = {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    };
    fetch(`http://localhost:4000/users/${_id}`, options)
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
        setVisitedUserDataHelper(data);
        navigate(`/u/${_id}`);
      })
      .catch((err) => {
        console.log("error happened in catch", err);
        setIsProfilePageNotFoundActive(true);
        navigate(`/u/${_id}`);
        alert(err.message);
      });
  }

  function handleViewFullRoom(room) {
    const options = {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    };
    fetch(`http://localhost:4000/rooms/${room._id}`, options)
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
        setMessages(data.messages);
        setWhichRoomActiveHelper({
          roomId: room._id,
          otherId: room.members.other._id,
          otherPhotoURL: room.members.other.photoURL,
          otherDisplayname: room.members.other.displayName,
        });
        navigate(`/r/${room._id}`);
      })
      .catch((err) => {
        console.log("error happened in catch", err);
        alert(err.message);
      });
  }

  const providerValue = useMemo(() => ({
    messages, activeRoomList, fullImageURL, setMessages, setWhichRoomActiveHelper, setActiveRoomListHelper, handleViewFullRoom, setFullImageURL,
  }), [messages, activeRoomList, fullImageURL]);

  useEffect(() => {
    if (messagesRef.current) { // to the bottom of the messages display
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // prevent setActiveRoomList() again upon mounting
    if (didDisplayRoomList) {
      setDidDisplayRoomList(undefined);
    } else {
      setActiveRoomListHelper(quickSort(userData.rooms));
    }
  }, [userData.rooms]);

  useEffect(() => {
    // set socket for chat
    if (!socketRef.current) {
      navigate("/");
    } else {
      socketRef.current.on("messaging", (data) => {
        if (whichRoomActiveRef.current && data.populatedRoom._id === whichRoomActiveRef.current.roomId && data.to === userData._id) {
          setMessages(data.populatedRoom.messages);
        }
      });
    }

    return () => {
      // delete null rooms before unmounting
      activeRoomListRef.current.forEach((room) => {
        if (room.lastMessageSent === null) {
          const options = {
            method: "DELETE",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              selfId: room.members.self,
              otherId: room.members.other._id,
            }),
          };
          fetch(`http://localhost:4000/rooms/${room._id}`, options)
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
            })
            .catch((err) => {
              console.log("error happened in catch", err);
              alert(err.message);
            });
        }
      });

      // reset unreadChatNotifs to 0 before leaving /rooms
      const options = {
        method: "PUT",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          type: "chat",
        }),
      };
      fetch(`http://localhost:4000/users/${userData._id}/notifications`, options)
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
        })
        .catch((err) => {
          console.log("error happened in catch", err);
          alert(err.message);
        });
    };
  }, []);

  return (
    <ChatContext.Provider value={providerValue}>
      <div className={`Chat ${(isSearchChatActive || isFullImageActive) ? "blur opac" : ""}`} style={{ position: (isSearchChatActive || isFullImageActive) && "fixed" }}>
        <div className="chat-container">
          <div className="active-chats-header">
            <div onClick={() => { handleVisitProfile(userData._id); }} className="bold cut username">{userData.username}</div>
            <svg className="send-message" onClick={() => { setIsSearchChatActive(true); }} aria-label="New message" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
              <path d="M12.202 3.203H5.25a3 3 0 00-3 3V18.75a3 3 0 003 3h12.547a3 3 0 003-3v-6.952" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M10.002 17.226H6.774v-3.228L18.607 2.165a1.417 1.417 0 012.004 0l1.224 1.225a1.417 1.417 0 010 2.004z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.848" x2="20.076" y1="3.924" y2="7.153" />
            </svg>
          </div>

          <div className="active-chats-list">
            {activeRoomList.map((room) => (
              // eslint-disable-next-line
              <div onClick={() => { handleViewFullRoom(room); }} className="active-chat" style={{backgroundColor: (whichRoomActive && (room._id === whichRoomActive.roomId) && !darkMode) ? "#efefef" : (whichRoomActive && (room._id === whichRoomActive.roomId) && darkMode) ? "#262626": ""}} key={room._id}>
                <img
                  src={room.members.other.photoURL}
                  alt="user pic"
                  style={{
                    width: "56px", height: "56px", borderRadius: "50%",
                  }}
                />
                <div>
                  <div className="bold medium">{room.members.other.displayName}</div>
                  {/* eslint-disable-next-line */}
                  <div className="grey medium" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "3px" }}>
                    <span className="cut">{room.lastMessageSent}</span>
                    <span className="bold" style={{ color: "black" }}> · </span>
                    <span>{room.updatedAt && computeHowLongAgo(room.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(params.roomId && whichRoomActive) ? (
            <div className="full-chat-header">
              {/* eslint-disable-next-line */}
              <img
                onClick={() => { handleVisitProfile(whichRoomActive.otherId); }}
                src={whichRoomActive.otherPhotoURL}
                alt="user pic in search"
                style={{
                  width: "24px", height: "24px", borderRadius: "50%", marginRight: "10px",
                }}
                className="user-avatar"
              />
              {/* eslint-disable-next-line */}
              <div onClick={() => { handleVisitProfile(whichRoomActive.otherId); }} className="bold username">{whichRoomActive.otherDisplayname}</div>
              <div className="more">
                <svg onClick={() => { setIsDropdownActive(!isDropdownActive); }} aria-label="View Thread Details" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
                  <circle cx="12.001" cy="12.005" fill="none" r="10.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <circle cx="11.819" cy="7.709" r="1.25" />
                  <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="10.569" x2="13.432" y1="16.777" y2="16.777" />
                  <polyline fill="none" points="10.569 11.05 12 11.05 12 16.777" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                {isDropdownActive && (
                /* eslint-disable-next-line */
                <div
                  className="dropdown"
                  style={{
                    position: "absolute", top: "40px", left: "-60px", width: "150px",
                  }}
                  onClick={() => { setNotImplementedError("Sorry! This feature is not yet implemented."); setIsDropdownActive(false); }}
                >
                  <div style={{ color: "#ed4956", fontWeight: "500", paddingLeft: "20px" }}>
                    Delete chat
                  </div>
                </div>
                )}
              </div>
            </div>
          ) : (
            <div className="full-chat-header" />
          )}

          {(params.roomId && whichRoomActive) ? (
            <div className="full-chat">
              <div className="messages" ref={messagesRef}>
                {messages.map((message) => (
                  (message.from._id === userData._id ? (
                    <div className="self-message" key={message._id} style={{ backgroundColor: (message.message === "[heartdropped]" || message.imageURL) && "transparent", padding: (message.message === "[heartdropped]" || message.imageURL) && "0" }}>
                      {message.message === "[heartdropped]"
                        ? (
                          <svg aria-label="Like" color="#ed4956" fill="#ed4956" height="44" role="img" viewBox="0 0 48 48" width="44">
                            <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z" />
                          </svg>
                        )
                        : (message.imageURL) ? (
                        // eslint-disable-next-line
                        <img onClick={() => {setIsFullImageActive(true); setFullImageURL(message.imageURL)}} src={message.imageURL} alt="img" style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "10px" }} />)
                          : (
                            <div className="medium">{message.message}</div>
                          )}
                    </div>
                  ) : (
                    <div className="other-message" key={message._id}>
                      <img src={whichRoomActive.otherPhotoURL} alt="user pic in search" style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
                      {message.message === "[heartdropped]"
                        ? (
                          <svg aria-label="Like" color="#ed4956" fill="#ed4956" height="44" role="img" viewBox="0 0 48 48" width="44">
                            <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z" />
                          </svg>
                        )
                        : (message.imageURL) ? (
                        // eslint-disable-next-line
                        <img  onClick={() => {setIsFullImageActive(true); setFullImageURL(message.imageURL)}} src={message.imageURL} alt="img" style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "10px" }} />)
                          : (
                            <div className="medium">{message.message}</div>
                          )}
                    </div>
                  ))
                ))}
                {(previewImageURL && isLoading) && (
                <div className="self-message" key={previewImageURL} style={{ backgroundColor: "transparent", padding: "0", position: "relative" }}>
                  <img src={previewImageURL} className="preview-image" alt="preview" style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "10px" }} />
                  <img
                    src={LOADING_IMAGE_URL}
                    alt="loading"
                    style={{
                      width: "15px", height: "15px", position: "absolute", right: "0",
                    }}
                  />
                </div>
                )}
              </div>

              <form onSubmit={handleSubmitMessage} className="post-message-box">
                <textarea onKeyDown={(e) => { if (e.key === "Enter") handleSubmitMessage(e); }} onChange={(e) => { setTexts({ ...texts, [whichRoomActive.roomId]: e.target.value }); }} type="text" placeholder="Message..." value={(whichRoomActive && texts[whichRoomActive.roomId]) || ""} />
                {(whichRoomActive && texts[whichRoomActive.roomId] && texts[whichRoomActive.roomId].trim()) ? (
                  <div style={{ display: "flex", gap: "10px", width: "60px" }}>
                    {/* eslint-disable-next-line */}
                    <span onClick={handleSubmitMessage} className="submit-btn bold" type="submit" style={{ color: "#0095f6" }}>Send</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "10px", width: "60px" }}>
                    <label htmlFor="file-upload" style={{ width: "24px", height: "24px", position: "relative" }}>
                      <input
                        onChange={handleMediaFileSelected}
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        capture="camera"
                        style={{ visibility: "hidden" }}
                      />
                      <svg className="send-image" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24" style={{ position: "absolute", left: "0" }}>
                        <path d="M6.549 5.013A1.557 1.557 0 108.106 6.57a1.557 1.557 0 00-1.557-1.557z" fillRule="evenodd" />
                        <path d="M2 18.605l3.901-3.9a.908.908 0 011.284 0l2.807 2.806a.908.908 0 001.283 0l5.534-5.534a.908.908 0 011.283 0l3.905 3.905" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
                        <path d="M18.44 2.004A3.56 3.56 0 0122 5.564h0v12.873a3.56 3.56 0 01-3.56 3.56H5.568a3.56 3.56 0 01-3.56-3.56V5.563a3.56 3.56 0 013.56-3.56z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </label>
                    <svg onClick={(e) => { handleSubmitMessage(e, true); }} className="drop-heart" color="currentColor" fill="currentColor" height="24" width="24">
                      <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938m0-2a6.04 6.04 0 00-4.797 2.127 6.052 6.052 0 00-4.787-2.127A6.985 6.985 0 00.5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 003.518 3.018 2 2 0 002.174 0 45.263 45.263 0 003.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 00-6.708-7.218z" />
                    </svg>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div
              className="full-chat"
              style={{
                alignItems: "center", justifyContent: "center", position: "relative", bottom: "30px", borderTop: "none",
              }}
            >
              <svg aria-label="Direct" color="currentColor" fill="currentColor" height="96" role="img" viewBox="0 0 96 96" width="96">
                <circle cx="48" cy="48" fill="none" r="47" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="69.286" x2="41.447" y1="33.21" y2="48.804" />
                <polygon fill="none" points="47.254 73.123 71.376 31.998 24.546 32.002 41.448 48.805 47.254 73.123" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <div style={{ fontSize: "25px" }}>Your Messages</div>
              <p className="medium grey">Send private photos and messages to a friend.</p>
              {/* eslint-disable-next-line */}
            <div className="bold medium send-message" style={{ color: "#fff", backgroundColor: "#0095f6", padding: "5px 10px", borderRadius: "5px" }} onClick={() => { setIsSearchChatActive(true); }}>
              Send message
            </div>
            </div>
          )}
        </div>
      </div>
      {isSearchChatActive && <SearchChat />}
      {isFullImageActive && <FullImage />}
      {sendImageError && <Snackbar snackBarMessage={sendImageError} setSnackBarMessage={setSendImageError} />}
      {notImplementedError && <Snackbar snackBarMessage={notImplementedError} setSnackBarMessage={setNotImplementedError} />}
    </ChatContext.Provider>
  );
}

export default Chat;
