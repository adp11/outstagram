import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserContext from "./Contexts/UserContext";

function ProfilePreview() {
  const {
    userData, setIsLoggedIn, scrollY, setIsFollowListActive, setFollowListInfo, setVisitedUserDataHelper,
  } = useContext(UserContext);
  const navigate = useNavigate();

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
        <Link to={`/u/${userData._id}`}>
          <div>
            <img src={userData.photoURL} alt="profile" />
          </div>
        </Link>
        <Link to={`/u/${userData._id}`}>
          <div>
            <div className="medium bold cut1">{userData.username}</div>
            <div className="medium grey">{userData.displayName}</div>
          </div>
        </Link>

        <div className="logout-shortcut" onClick={() => { setIsLoggedIn(false); }}>
          Log out
        </div>
      </div>
      <div className="stats medium">
        <div className="posts" onClick={() => { setVisitedUserDataHelper(userData); navigate(`/u/${userData._id}`); }}>
          <div className="bold medium">{userData.postSnippets.length}</div>
          <div className="grey medium">Posts</div>
        </div>
        <div className="followers" onClick={() => { handleViewFollowList(userData.followers, "followers"); }}>
          <div className="bold medium">{userData.followers.length}</div>
          <div className="grey medium">Followers</div>
        </div>
        <div className="following" onClick={() => { handleViewFollowList(userData.following, "following"); }}>
          <div className="bold medium">{userData.following.length}</div>
          <div className="grey medium">Following</div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePreview;
