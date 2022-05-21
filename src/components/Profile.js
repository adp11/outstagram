import { getAuth } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import React, { useContext, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../firebase";
import UserContext from "./Contexts/UserContext";

const DUMMY_AVATAR_URL = "https://dummyimage.com/200x200/979999/000000.png&text=...";

// no setNewsfeed because same function of onSnapshot
function Profile() {
  const {
    userData, setUserData, visitedUserData, setVisitedUserData, setIsEditProfileActive, setIsFullPostActive, setBeforeFullPost, scrollY,
  } = useContext(UserContext);
  const { uid } = getAuth().currentUser;
  const params = useParams();
  const [isFollowing, setIsFollowing] = useState(
    userData.following.findIndex((user) => user.uid === params.uid) !== -1,
  );

  let userAvatar;
  let username;
  let totalPosts;
  let totalFollowers;
  let totalFollowing;
  let userBio;
  let userDisplayName;
  let whichUser;
  let button;

  function handleClick() {
    scrollY.current = window.scrollY;
    setIsFullPostActive(true);
    setBeforeFullPost({
      newsfeed: false,
      profile: true,
    });
  }

  async function updateFollowingData(tempUserData) {
    const docRef = doc(db, `users/uid_${uid}`);
    await updateDoc(docRef, { following: tempUserData.following });
  }

  async function updateFollowersData(tempVisitedUserData) {
    const docRef = doc(db, `users/${params.uid}`);
    await updateDoc(docRef, { followers: tempVisitedUserData.followers });
  }

  function handleFollowToggle() {
    const positionInFollowing = userData.following.findIndex((user) => user.uid === params.uid);
    const positionInFollowers = visitedUserData.followers.findIndex((user) => user.uid === uid);
    const tempUserData = { ...userData };
    const tempVisitedUserData = { ...visitedUserData };

    // if following
    if (positionInFollowing === -1) {
      // update current user's following data
      tempUserData.following.push({
        uid: params.uid,
        photoURL: visitedUserData.photoURL || DUMMY_AVATAR_URL,
        username: visitedUserData && visitedUserData.username,
        userDisplayName: visitedUserData && visitedUserData.displayName,
      });
      setUserData(tempUserData);
      updateFollowingData(tempUserData);

      // update visited user's followers data
      tempVisitedUserData.followers.push({
        uid,
        photoURL: userData.photoURL || DUMMY_AVATAR_URL,
        username: userData && userData.username,
        userDisplayName: userData && userData.displayName,
      });
      setVisitedUserData(tempVisitedUserData);
      updateFollowersData(tempVisitedUserData);

      setIsFollowing(true);
      // if unfollowing
    } else {
      // update current user's following data
      tempUserData.following.splice(positionInFollowing, 1);
      setUserData(tempUserData);
      updateFollowingData(tempUserData);

      // update visited user's followers data
      tempVisitedUserData.followers.splice(positionInFollowers, 1);
      setVisitedUserData(tempVisitedUserData);
      updateFollowersData(tempVisitedUserData);

      setIsFollowing(false);
    }
  }

  if (params.uid === `uid_${uid}` || params.postId) {
    userAvatar = userData.photoURL || DUMMY_AVATAR_URL;
    username = userData && userData.username;
    userBio = (userData && userData.bio) || "none";
    userDisplayName = userData.displayName;
    totalPosts = userData && userData.totalPosts;
    totalFollowers = userData && userData.followers.length;
    totalFollowing = userData && userData.following.length;
    whichUser = userData;
    button = (
      <button
        type="button"
        onClick={() => { setIsEditProfileActive(true); }}
        style={{
          padding: "5px 10px", backgroundColor: "transparent", border: "1px #dbdbdb solid", borderRadius: "3px", fontWeight: "500",
        }}
      >
        Edit Profile
      </button>
    );
  } else {
    userAvatar = visitedUserData.photoURL || DUMMY_AVATAR_URL;
    username = visitedUserData && visitedUserData.username;
    userBio = (visitedUserData && visitedUserData.bio) || "none";
    userDisplayName = visitedUserData && visitedUserData.displayName;
    totalPosts = visitedUserData && visitedUserData.totalPosts;
    totalFollowers = visitedUserData && visitedUserData.followers.length;
    totalFollowing = visitedUserData && visitedUserData.following.length;
    whichUser = visitedUserData;
    if (isFollowing) {
      button = (
        <button
          onClick={handleFollowToggle}
          type="button"
          style={{
            padding: "5px 15px", backgroundColor: "transparent", border: "1px #dbdbdb solid", fontSize: "14px", borderRadius: "5px", width: "80px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg aria-label="Following" className="_8-yf5 " color="#262626" fill="#262626" height="20" role="img" viewBox="0 0 95.28 70.03" width="20">
            <path d="M64.23 69.98c-8.66 0-17.32-.09-26 0-3.58.06-5.07-1.23-5.12-4.94-.16-11.7 8.31-20.83 20-21.06 7.32-.15 14.65-.14 22 0 11.75.22 20.24 9.28 20.1 21 0 3.63-1.38 5.08-5 5-8.62-.1-17.28 0-25.98 0zm19-50.8A19 19 0 1164.32 0a19.05 19.05 0 0118.91 19.18zM14.76 50.01a5 5 0 01-3.37-1.31L.81 39.09a2.5 2.5 0 01-.16-3.52l3.39-3.7a2.49 2.49 0 013.52-.16l7.07 6.38 15.73-15.51a2.48 2.48 0 013.52 0l3.53 3.58a2.49 2.49 0 010 3.52L18.23 48.57a5 5 0 01-3.47 1.44z" />

          </svg>
        </button>
      );
    } else {
      button = (
      // eslint-disable-next-line
        <button
          onClick={handleFollowToggle}
          type="button"
          style={{
            padding: "5px 15px", backgroundColor: "#0095f6", border: "none", color: "white", fontWeight: "600", fontSize: "14px", borderRadius: "5px", width: "90px",
          }}
        >
          Follow
        </button>
      );
    }
  }

  return (
    <div className="Profile">
      <div className="profile-container">
        <div className="profile-summary">
          <img src={userAvatar} alt="" className="user-avatar" />
          <div className="user-info">
            <div>
              <span style={{ fontSize: "25px", lineHeight: "32px", marginRight: "30px" }}>{username}</span>
              {button}
            </div>
            <div className="user-stats">
              <div className="posts">
                <span>{totalPosts}</span>
                posts
              </div>
              <div className="followers">
                <span>{totalFollowers}</span>
                followers
              </div>
              <div className="following">
                <span>{totalFollowing}</span>
                following
              </div>
            </div>
            <div className="user-bio">
              <div className="bold">{userDisplayName}</div>
              <div>{userBio}</div>
            </div>
          </div>
        </div>

        {(whichUser && whichUser.postSnippets.length > 0) && (
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
        )}

        <div className="profile-posts">
          {whichUser && whichUser.postSnippets.length > 0 ? whichUser.postSnippets.slice(0).reverse().map((post) => (
            <Link to={`/p/${post.postId}`} onClick={handleClick} key={post.postId}>
              <div className="profile-post" key={post.postId}>
                <img className="post-picture" src={post.imageUrl} alt="user's post" />
                <div className="profile-post-stats">
                  <span>
                    <svg stroke="black" fill="white" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path fill="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z" />

                    </svg>
                  </span>
                  <span>{post.totalComments}</span>
                  <span>
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path fill="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M87.49 380c1.19-4.38-1.44-10.47-3.95-14.86a44.86 44.86 0 00-2.54-3.8 199.81 199.81 0 01-33-110C47.65 139.09 140.73 48 255.83 48 356.21 48 440 117.54 459.58 209.85a199 199 0 014.42 41.64c0 112.41-89.49 204.93-204.59 204.93-18.3 0-43-4.6-56.47-8.37s-26.92-8.77-30.39-10.11a31.09 31.09 0 00-11.12-2.07 30.71 30.71 0 00-12.09 2.43l-67.83 24.48a16 16 0 01-4.67 1.22 9.6 9.6 0 01-9.57-9.74 15.85 15.85 0 01.6-3.29z" />

                    </svg>
                  </span>
                  <span>{post.totalLikes}</span>
                </div>
              </div>
            </Link>
          )) : (
            <div style={{ display: "flex", width: "100vw", margin: "50px 0" }}>
              <div style={{
                flex: "1",
                maxWidth: "900px",
                minWidth: "500px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
              >
                <img src={`${window.location.origin}/images/no-post.png`} alt="No Newsfeed" style={{ width: "100px", height: "auto" }} />
                <p className="bold" style={{ fontSize: "20px" }}>No Posts Yet</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
