import { getAuth, signOut } from "firebase/auth";
import React, { useEffect, useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserContext from "./Contexts/UserContext";

function ProfilePreview() {
  const {
    userData, setIsLoggedIn, scrollY, setIsFollowListActive, setFollowListInfo,
  } = useContext(UserContext);
  const navigate = useNavigate();

  function logOut() {
    signOut(getAuth());
  }

  function handleViewFollowList(followListInfo, type) {
    scrollY.current = window.scrollY;
    if (type === "followers") {
      setIsFollowListActive({
        followers: true,
        following: false,
      });
      setFollowListInfo({
        followers: followListInfo,
        following: [],
      });
    } else {
      setIsFollowListActive({
        followers: false,
        following: true,
      });
      setFollowListInfo({
        followers: [],
        following: followListInfo,
      });
    }
  }

  return (
    <div className="ProfilePreview">
      <div className="user-profile">
        <Link to={`/uid_${getAuth().currentUser.uid}`}>
          <div>
            <img src={userData && userData.photoURL} alt="profile" />
          </div>
        </Link>
        <Link to={`/uid_${getAuth().currentUser.uid}`}>
          <div>
            <div className="medium bold cut1">{userData && userData.username}</div>
            <div className="medium grey">{userData && userData.displayName}</div>
          </div>
        </Link>

        <div className="logout-shortcut" onClick={() => { logOut(); setIsLoggedIn(false); }}>
          Log out
        </div>
      </div>
      <div className="stats medium">
        <div className="posts" onClick={() => { navigate(`/uid_${getAuth().currentUser.uid}`); }}>
          <div className="bold medium">{userData && userData.totalPosts}</div>
          <div className="grey medium">Posts</div>
        </div>
        <div className="followers" onClick={() => { handleViewFollowList(userData.followers, "followers"); }}>
          <div className="bold medium">{userData && userData.followers.length}</div>
          <div className="grey medium">Followers</div>
        </div>
        <div className="following" onClick={() => { handleViewFollowList(userData.following, "following"); }}>
          <div className="bold medium">{userData && userData.following.length}</div>
          <div className="grey medium">Following</div>
        </div>
      </div>

    </div>
  );
}

export default ProfilePreview;
