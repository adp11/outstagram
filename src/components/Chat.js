// import { getAuth } from "firebase/auth";
// import {
//   addDoc,
//   arrayUnion, collection, doc, getDoc, serverTimestamp, updateDoc,
// } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import uniqid from "uniqid";
// import { db } from "../firebase";
// import UserContext from "./Contexts/UserContext";
// import Snackbar from "./Snackbar";
// import { computeHowLongAgo } from "../utils";

function Chat() {
  return (
    <div className="Chat">
      <div className="chat-container">
        <div className="active-chats-header">
          <div className="bold">andrew.pham__</div>
          <svg aria-label="New message" color="#262626" fill="#262626" height="24" role="img" viewBox="0 0 24 24" width="24">
            <path d="M12.202 3.203H5.25a3 3 0 00-3 3V18.75a3 3 0 003 3h12.547a3 3 0 003-3v-6.952" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d="M10.002 17.226H6.774v-3.228L18.607 2.165a1.417 1.417 0 012.004 0l1.224 1.225a1.417 1.417 0 010 2.004z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.848" x2="20.076" y1="3.924" y2="7.153" />
          </svg>
        </div>

        <div className="active-chats-list">
          <div className="active-chat">
            <img src={`${window.location.origin}/images/logo.png`} alt="user pic" style={{ width: "56px", height: "56px", borderRadius: "50%" }} />
            <div>
              <div className="bold medium">Loc Pham</div>
              <div className="grey medium">
                last message sent
                <span className="bold" style={{ color: "black" }}> · </span>
                <span>37m</span>
              </div>
            </div>
          </div>
          <div className="active-chat">
            <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" style={{ width: "56px", height: "56px", borderRadius: "50%" }} />
            <div>
              <div className="bold medium">Quoc Pham</div>
              <div className="grey medium">
                last message sent
                <span className="bold" style={{ color: "black" }}> · </span>
                <span>37m</span>
              </div>
            </div>
          </div>
        </div>

        <div className="full-chat-header">
          <img
            src={`${window.location.origin}/images/logo.png`}
            alt="user pic in search"
            style={{
              width: "24px", height: "24px", borderRadius: "50%", marginRight: "10px",
            }}
          />
          <div className="bold">Loc Pham</div>
          <svg aria-label="View Thread Details" className="_ab6-" color="#262626" fill="#262626" height="24" role="img" viewBox="0 0 24 24" width="24">
            <circle cx="12.001" cy="12.005" fill="none" r="10.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <circle cx="11.819" cy="7.709" r="1.25" />
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="10.569" x2="13.432" y1="16.777" y2="16.777" />
            <polyline fill="none" points="10.569 11.05 12 11.05 12 16.777" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>

        <div className="full-chat">
          <div className="messages">
            <div className="self-message">
              <div className="medium">hello</div>
            </div>
            <div className="other-message">
              <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
              <div className="medium">hello</div>
            </div>
            <div className="other-message">
              <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
              <div className="medium">hello</div>
            </div>
            <div className="self-message">
              <div className="medium">Advantages: If you have simple, fixed lists of data that you want to keep within your documents, this is easy to set up and streamlines your data structure.</div>
            </div>
            <div className="other-message">
              <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
              <div className="medium">Advantages: If you have simple, fixed lists of data that you want to keep within your documents, this is easy to set up and streamlines your data structure.</div>
            </div>
            <div className="self-message">
              <div className="medium">Advantages: If you have simple, fixed lists of data that you want to keep within your documents, this is easy to set up and streamlines your data structure.</div>
            </div>
            <div className="self-message">
              <div className="medium">Advantages: If you have simple, fixed lists of data that you want to keep within your documents, this is easy to set up and streamlines your data structure.</div>
            </div>
            <div className="other-message">
              <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
              <div className="medium">hello</div>
            </div>
          </div>
          <form className="post-message-box">
            <textarea type="text" placeholder="Message..." />
            {/* <svg aria-label="Add Photo or Video" className="_8-yf5 " color="#262626" fill="#262626" height="24" role="img" viewBox="0 0 24 24" width="24">
              <path d="M6.549 5.013A1.557 1.557 0 108.106 6.57a1.557 1.557 0 00-1.557-1.557z" fillRule="evenodd" />
              <path d="M2 18.605l3.901-3.9a.908.908 0 011.284 0l2.807 2.806a.908.908 0 001.283 0l5.534-5.534a.908.908 0 011.283 0l3.905 3.905" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
              <path d="M18.44 2.004A3.56 3.56 0 0122 5.564h0v12.873a3.56 3.56 0 01-3.56 3.56H5.568a3.56 3.56 0 01-3.56-3.56V5.563a3.56 3.56 0 013.56-3.56z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <svg aria-label="Drop Heart" color="#262626" fill="#262626" height="24" width="24">
              <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938m0-2a6.04 6.04 0 00-4.797 2.127 6.052 6.052 0 00-4.787-2.127A6.985 6.985 0 00.5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 003.518 3.018 2 2 0 002.174 0 45.263 45.263 0 003.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 00-6.708-7.218z" />
            </svg> */}
            <span className="submit-btn bold" type="submit" style={{ color: "#0095f6"}}>Send</span>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;
