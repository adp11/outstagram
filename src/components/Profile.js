import {
  addDoc, collection, doc, getDoc, serverTimestamp, updateDoc,
} from "firebase/firestore";
import React, {
  useContext, useEffect, useRef, useState,
} from "react";
import uniqid from "uniqid";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import UserContext from "./Contexts/UserContext";

const IMAGE_PLACEHOLDER_URL = `${window.location.origin}/images/white_flag.gif`;

// no setNewsfeed because same function of onSnapshot
function Profile() {
  const {
    userData, setUserData, visitedUserData, setVisitedUserData, setIsEditProfileActive, setIsFullPostActive, setBeforeFullPost, scrollY, setFullPostInfo, beforeFullPost, setIsFollowListActive, setFollowListInfo, setIsProfilePageNotFoundActive,
  } = useContext(UserContext);
  const params = useParams();
  const profilePostsRef = useRef(null);

  const [isFollowing, setIsFollowing] = useState(null);
  const navigate = useNavigate();

  async function handleViewFullPost(postId) {
    let docRef;
    scrollY.current = window.scrollY;
    setIsFullPostActive(true);
    if (params.uid === userData.uid || params.postId) {
      setBeforeFullPost({
        newsfeed: false,
        selfProfile: true,
        visitedProfile: false,
      });
      docRef = doc(db, `users/${userData.uid}/posts/${postId}`);
    } else {
      setBeforeFullPost({
        newsfeed: false,
        selfProfile: false,
        visitedProfile: true,
      });
      docRef = doc(db, `users/${visitedUserData.uid}/posts/${postId}`);
    }

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setFullPostInfo(docSnap.data());
    }
  }

  async function updateFollowingData(tempUserData) {
    const docRef = doc(db, `users/${userData.uid}`);
    await updateDoc(docRef, { following: tempUserData.following });
  }

  async function updateFollowersData(tempVisitedUserData) {
    const docRef = doc(db, `users/${params.uid}`);
    await updateDoc(docRef, { followers: tempVisitedUserData.followers });
  }

  async function updateNotifications({ uid }, notificationType) {
    const collectionPath = `users/${uid}/notifications`;
    if (notificationType === "follow") {
      // update to Notifications subcollection
      const notifRef = await addDoc(collection(db, collectionPath), {
        creationTime: serverTimestamp(),
      });

      await updateDoc(notifRef, {
        notifId: uniqid(),
        sourceDisplayname: userData.displayName,
        sourceId: userData.uid,
        sourceUsername: userData.username,
        sourcePhotoURL: userData.photoURL,
        type: "follow",
      });

      // update to totalNotifs snippet
      const docRef = doc(db, `users/${uid}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          totalNotifs: docSnap.data().totalNotifs + 1,
        });
      }
    }
  }

  function handleFollowToggle() {
    const positionInFollowing = userData.following.findIndex((user) => user.uid === params.uid);
    const positionInFollowers = visitedUserData.followers.findIndex((user) => user.uid === userData.uid);
    const tempUserData = { ...userData };
    const tempVisitedUserData = { ...visitedUserData };

    // if following
    if (positionInFollowing === -1) {
      // update current user's following data
      tempUserData.following.push({
        uid: params.uid,
        photoURL: visitedUserData.photoURL,
        username: visitedUserData && visitedUserData.username,
        userDisplayName: visitedUserData && visitedUserData.displayName,
      });
      setUserData(tempUserData);
      updateFollowingData(tempUserData);

      // update visited user's followers data
      tempVisitedUserData.followers.push({
        uid: userData.uid,
        photoURL: userData.photoURL,
        username: userData && userData.username,
        userDisplayName: userData && userData.displayName,
      });
      setVisitedUserData(tempVisitedUserData);
      updateFollowersData(tempVisitedUserData);

      setIsFollowing(true);
      updateNotifications(tempVisitedUserData, "follow");
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

  // Conditional rendering
  const [componentVars, setComponentVars] = useState({
    userAvatar: "",
    username: "",
    totalPosts: [],
    totalFollowers: [],
    totalFollowing: [],
    userBio: "",
    userDisplayName: "",
    whichUser: null,
  });

  useEffect(() => {
    async function handleVisitVisitedProfile() {
      if (!visitedUserData) {
        console.log("visiting profile", params.uid);
        let tempVisitedUserData;
        const docRef = doc(db, `users/${params.uid}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          navigate(`/${params.uid}`);
          tempVisitedUserData = docSnap.data();
          setVisitedUserData(tempVisitedUserData);
          setComponentVars({
            userAvatar: tempVisitedUserData.photoURL,
            username: tempVisitedUserData.username,
            totalPosts: tempVisitedUserData.totalPosts,
            totalFollowers: tempVisitedUserData.followers.length,
            totalFollowing: tempVisitedUserData.following.length,
            userBio: tempVisitedUserData.bio,
            userDisplayName: tempVisitedUserData.displayName,
            whichUser: tempVisitedUserData,
          });
        } else {
          navigate(`/${params.uid}`);
          setIsProfilePageNotFoundActive(true);
        }
      } else {
        setComponentVars({
          userAvatar: visitedUserData.photoURL,
          username: visitedUserData.username,
          totalPosts: visitedUserData.totalPosts,
          totalFollowers: visitedUserData.followers.length,
          totalFollowing: visitedUserData.following.length,
          userBio: visitedUserData.bio,
          userDisplayName: visitedUserData.displayName,
          whichUser: visitedUserData,
        });
      }
    }

    if (userData) {
      const isCurrentUserFollowing = userData.following.findIndex((user) => user.uid === params.uid) !== -1;
      setIsFollowing(isCurrentUserFollowing);
    }

    if (userData && (params.uid === userData.uid || beforeFullPost.selfProfile)) {
      setComponentVars({
        userAvatar: userData.photoURL,
        username: userData.username,
        totalPosts: userData.totalPosts,
        totalFollowers: userData.followers.length,
        totalFollowing: userData.following.length,
        userBio: userData.bio,
        userDisplayName: userData.displayName,
        whichUser: userData,
      });
    } else if (userData && (params.uid !== userData.uid || beforeFullPost.visitedProfile)) {
      handleVisitVisitedProfile(); // handle abrupt link access to visitedUserData
    }
  }, [userData, visitedUserData, params.uid]);

  const {
    userAvatar, username, totalPosts, totalFollowers, totalFollowing, userBio, userDisplayName, whichUser,
  } = componentVars;

  return (
    <div className="Profile">
      <div className="profile-container">
        <div className="profile-summary">
          <img src={userAvatar || IMAGE_PLACEHOLDER_URL} alt="" className="user-avatar" />
          <div className="user-info">
            <div style={{ display: "flex" }}>
              <span className="cut2" style={{ fontSize: "25px", lineHeight: "32px", marginRight: "30px" }}>{username}</span>

              {(userData && (params.uid === userData.uid || beforeFullPost.selfProfile))
                // eslint-disable-next-line
                ? <button type="button" onClick={() => { setIsEditProfileActive(true); scrollY.current = window.scrollY; }} style={{ padding: "5px 10px", backgroundColor: "transparent", border: "1px #dbdbdb solid", borderRadius: "3px", fontWeight: "500" }}>Edit Profile</button>

                : (isFollowing !== null && isFollowing === true)
                // eslint-disable-next-line
                ? (
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    style={{
                      padding: "5px 15px", backgroundColor: "transparent", border: "1px #dbdbdb solid", fontSize: "14px", borderRadius: "5px", width: "80px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg aria-label="Following" className="_8-yf5 " color="#262626" fill="#262626" height="20" role="img" viewBox="0 0 95.28 70.03" width="20">
                      <path d="M64.23 69.98c-8.66 0-17.32-.09-26 0-3.58.06-5.07-1.23-5.12-4.94-.16-11.7 8.31-20.83 20-21.06 7.32-.15 14.65-.14 22 0 11.75.22 20.24 9.28 20.1 21 0 3.63-1.38 5.08-5 5-8.62-.1-17.28 0-25.98 0zm19-50.8A19 19 0 1164.32 0a19.05 19.05 0 0118.91 19.18zM14.76 50.01a5 5 0 01-3.37-1.31L.81 39.09a2.5 2.5 0 01-.16-3.52l3.39-3.7a2.49 2.49 0 013.52-.16l7.07 6.38 15.73-15.51a2.48 2.48 0 013.52 0l3.53 3.58a2.49 2.49 0 010 3.52L18.23 48.57a5 5 0 01-3.47 1.44z" />
                    </svg>
                  </button>
                  )

                // eslint-disable-next-line
                : (isFollowing !== null && isFollowing === false) ? (
                  <button
                    onClick={handleFollowToggle}
                    type="button"
                    style={{
                      padding: "5px 15px", backgroundColor: "#0095f6", border: "none", color: "white", fontWeight: "600", fontSize: "14px", borderRadius: "5px", width: "90px",
                    }}
                  >
                    Follow
                  </button>
                  )
                    : <div />}
            </div>
            <div className="user-stats">
              <div className="posts" onClick={() => { profilePostsRef.current.scrollIntoView(); }}>
                <span>{totalPosts}</span>
                posts
              </div>
              <div className="followers" onClick={() => { handleViewFollowList(whichUser.followers, "followers"); }}>
                <span>{totalFollowers}</span>
                followers
              </div>
              <div className="following" onClick={() => { handleViewFollowList(whichUser.following, "following"); }}>
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

        <div className="profile-posts" ref={profilePostsRef}>
          {whichUser && whichUser.postSnippets.length > 0 ? whichUser.postSnippets.slice(0).reverse().map((post) => (
            <Link to={`/p/${post.postId}`} onClick={() => { handleViewFullPost(post.postId); }} key={post.postId}>
              <div className="profile-post" key={post.postId}>
                <img className="post-picture" src={post.imageURL} alt="user's post" />
                <div className="profile-post-stats">
                  <span>
                    <svg stroke="black" fill="white" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path fill="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z" />

                    </svg>
                  </span>
                  <span>{post.totalLikes}</span>
                  <span>
                    <svg stroke="black" fill="black" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path fill="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M87.49 380c1.19-4.38-1.44-10.47-3.95-14.86a44.86 44.86 0 00-2.54-3.8 199.81 199.81 0 01-33-110C47.65 139.09 140.73 48 255.83 48 356.21 48 440 117.54 459.58 209.85a199 199 0 014.42 41.64c0 112.41-89.49 204.93-204.59 204.93-18.3 0-43-4.6-56.47-8.37s-26.92-8.77-30.39-10.11a31.09 31.09 0 00-11.12-2.07 30.71 30.71 0 00-12.09 2.43l-67.83 24.48a16 16 0 01-4.67 1.22 9.6 9.6 0 01-9.57-9.74 15.85 15.85 0 01.6-3.29z" />

                    </svg>
                  </span>
                  <span>{post.totalComments}</span>
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
