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

function SearchChat() {
  return (
    <div className="SearchChat">
      {/* eslint-disable-next-line */}
      <div className="container" style={{ maxHeight: "400px", padding: "10px 20px" }}>
        <div style={{ width: "100%", textAlign: "center", position: "relative" }}>
          <span className="bold">New message</span>
          <svg
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
        <input type="search" placeholder="Search..." maxLength="20" />
        <div className="dropdown" style={{ overflow: "auto", width: "100%" }}>
          <div className="search-result">
            <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" className="user-avatar-in-search" />
            <div>
              <div className="bold medium cut1">andrew.pham__</div>
              <div className="grey medium">Loc Pham</div>
            </div>
          </div>
          <div className="search-result">
            <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" className="user-avatar-in-search" />
            <div>
              <div className="bold medium cut1">andrew.pham__</div>
              <div className="grey medium">Loc Pham</div>
            </div>
          </div>
          <div className="search-result">
            <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" className="user-avatar-in-search" />
            <div>
              <div className="bold medium cut1">andrew.pham__</div>
              <div className="grey medium">Loc Pham</div>
            </div>
          </div>
          <div className="search-result">
            <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" className="user-avatar-in-search" />
            <div>
              <div className="bold medium cut1">andrew.pham__</div>
              <div className="grey medium">Loc Pham</div>
            </div>
          </div>
          <div className="search-result">
            <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" className="user-avatar-in-search" />
            <div>
              <div className="bold medium cut1">andrew.pham__</div>
              <div className="grey medium">Loc Pham</div>
            </div>
          </div>
          <div className="search-result">
            <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" className="user-avatar-in-search" />
            <div>
              <div className="bold medium cut1">andrew.pham__</div>
              <div className="grey medium">Loc Pham</div>
            </div>
          </div>
          <div className="search-result">
            <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" className="user-avatar-in-search" />
            <div>
              <div className="bold medium cut1">andrew.pham__</div>
              <div className="grey medium">Loc Pham</div>
            </div>
          </div>
          {/* <div className="no-result bold grey" style={{ textAlign: "center" }}>No users found.</div> */}
        </div>
      </div>
    </div>
  );
}

export default SearchChat;
