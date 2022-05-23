import { getAuth, signOut } from "firebase/auth";
import React, { useEffect, useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserContext from "./Contexts/UserContext";

function ProfilePreview() {
  const { userData, setIsLoggedIn } = useContext(UserContext);
  const navigate = useNavigate();

  function logOut() {
    signOut(getAuth());
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
            <div className="medium bold cut">{userData && userData.username}</div>
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
          <div className="followers">
            <div className="bold medium">{userData && userData.followers.length}</div>
            <div className="grey medium">Followers</div>
          </div>
          <div className="following">
            <div className="bold medium">{userData && userData.following.length}</div>
            <div className="grey medium">Following</div>
          </div>
        </div>

    </div>
  );
}

export default ProfilePreview;
