import React, { useEffect, useContext, useState } from "react";

function Profile() {
  return (
    <div className="Profile">
      <div className="profile-container">
        <div className="profile-summary">
          <img src={`${window.location.origin}/images/logo.png`} alt="" className="user-avatar" />
          <div className="user-info">
            <div>
              <span style={{ fontSize: "25px", lineHeight: "32px", marginRight: "30px" }}>andrew.pham__</span>
              {/* eslint-disable-next-line */}
            <button style={{ padding: "5px 10px", backgroundColor: "transparent", border: "1px #dbdbdb solid", borderRadius: "10px", fontWeight: "500" }}>Edit Profile</button>
            </div>
            <div className="user-stats">
              <div className="posts">
                <span>3</span>
                posts
              </div>
              <div className="followers">
                <span>421</span>
                followers
              </div>
              <div className="following">
                <span>688</span>
                following
              </div>
            </div>
            <div className="user-bio">
              <div className="bold">Loc Pham</div>
              <div>
                Vietnamese standards and lifestyle. @kimdurbeck linktr.ee/kimdurbeck.
              </div>
            </div>
          </div>
        </div>

        <div className="profile-nav">
          <svg color="#262626" fill="#262626" height="12" role="img" viewBox="0 0 24 24" width="12">
            <rect fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" width="18" x="3" y="3" />
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="9.015" x2="9.015" y1="3" y2="21" />
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="14.985" x2="14.985" y1="3" y2="21" />
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="9.015" y2="9.015" />
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="14.985" y2="14.985" />
          </svg>
          POSTS
        </div>

        <div className="profile-posts">
          <div className="profile-post">
            <img className="post-picture" src={`${window.location.origin}/images/p0.jpg`} alt="user's post" />
            <div className="profile-post-stats">
              <span>
                <svg stroke="black" fill="white" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path fill="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z" />

                </svg>
              </span>
              <span>304</span>
              <span>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path fill="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M87.49 380c1.19-4.38-1.44-10.47-3.95-14.86a44.86 44.86 0 00-2.54-3.8 199.81 199.81 0 01-33-110C47.65 139.09 140.73 48 255.83 48 356.21 48 440 117.54 459.58 209.85a199 199 0 014.42 41.64c0 112.41-89.49 204.93-204.59 204.93-18.3 0-43-4.6-56.47-8.37s-26.92-8.77-30.39-10.11a31.09 31.09 0 00-11.12-2.07 30.71 30.71 0 00-12.09 2.43l-67.83 24.48a16 16 0 01-4.67 1.22 9.6 9.6 0 01-9.57-9.74 15.85 15.85 0 01.6-3.29z" />

                </svg>
              </span>
              <span>2</span>
            </div>
          </div>
          <div className="profile-post">
            <img className="post-picture" src={`${window.location.origin}/images/p0.jpg`} alt="user's post" />
            <div className="profile-post-stats">
              <span>
                <svg stroke="black" fill="white" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path fill="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z" />
                </svg>
              </span>
              <span>304</span>
              <span>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path fill="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M87.49 380c1.19-4.38-1.44-10.47-3.95-14.86a44.86 44.86 0 00-2.54-3.8 199.81 199.81 0 01-33-110C47.65 139.09 140.73 48 255.83 48 356.21 48 440 117.54 459.58 209.85a199 199 0 014.42 41.64c0 112.41-89.49 204.93-204.59 204.93-18.3 0-43-4.6-56.47-8.37s-26.92-8.77-30.39-10.11a31.09 31.09 0 00-11.12-2.07 30.71 30.71 0 00-12.09 2.43l-67.83 24.48a16 16 0 01-4.67 1.22 9.6 9.6 0 01-9.57-9.74 15.85 15.85 0 01.6-3.29z" />

                </svg>
              </span>
              <span>2</span>
            </div>
          </div>
          <div className="profile-post">
            <img className="post-picture" src={`${window.location.origin}/images/p0.jpg`} alt="user's post" />
            <div className="profile-post-stats">
              <span>
                <svg stroke="black" fill="white" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path fill="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z" />
                </svg>
              </span>
              <span>304</span>
              <span>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path fill="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M87.49 380c1.19-4.38-1.44-10.47-3.95-14.86a44.86 44.86 0 00-2.54-3.8 199.81 199.81 0 01-33-110C47.65 139.09 140.73 48 255.83 48 356.21 48 440 117.54 459.58 209.85a199 199 0 014.42 41.64c0 112.41-89.49 204.93-204.59 204.93-18.3 0-43-4.6-56.47-8.37s-26.92-8.77-30.39-10.11a31.09 31.09 0 00-11.12-2.07 30.71 30.71 0 00-12.09 2.43l-67.83 24.48a16 16 0 01-4.67 1.22 9.6 9.6 0 01-9.57-9.74 15.85 15.85 0 01.6-3.29z" />

                </svg>
              </span>
              <span>2</span>
            </div>
          </div>
          <div className="profile-post">
            <img className="post-picture" src={`${window.location.origin}/images/p0.jpg`} alt="user's post" />
            <div className="profile-post-stats">
              <span>
                <svg stroke="black" fill="white" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path fill="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z" />

                </svg>
              </span>
              <span>304</span>
              <span>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path fill="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M87.49 380c1.19-4.38-1.44-10.47-3.95-14.86a44.86 44.86 0 00-2.54-3.8 199.81 199.81 0 01-33-110C47.65 139.09 140.73 48 255.83 48 356.21 48 440 117.54 459.58 209.85a199 199 0 014.42 41.64c0 112.41-89.49 204.93-204.59 204.93-18.3 0-43-4.6-56.47-8.37s-26.92-8.77-30.39-10.11a31.09 31.09 0 00-11.12-2.07 30.71 30.71 0 00-12.09 2.43l-67.83 24.48a16 16 0 01-4.67 1.22 9.6 9.6 0 01-9.57-9.74 15.85 15.85 0 01.6-3.29z" />

                </svg>
              </span>
              <span>2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
