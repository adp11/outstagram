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

function Profile() {
  const {
    userData, beforeFullPost, scrollY,
    setUserDataHelper, visitedUserData, setVisitedUserDataHelper, setIsEditProfileActive, setIsFullPostActive, setBeforeFullPost, setFullPostInfo, setIsFollowListActive, setFollowListInfo, setIsProfilePageNotFoundActive,
  } = useContext(UserContext);

  const params = useParams();
  const profilePostsRef = useRef(null);
  const navigate = useNavigate();

  // handle follow button undecided when first mounting
  const [isFollowing, setIsFollowing] = useState(null);

  async function handleViewFullPost(postId) {
    let docRef;
    scrollY.current = window.scrollY;
    setIsFullPostActive(true);
    if (params.uid === userData.uid || params.postId) { // handle view posts from a) profile and b) abrupt access
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

  function handleFollowToggle() {
    if (!isFollowing) { // if following
      console.log("about to follow");
      const options = {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "follow",
          selfId: userData._id,
          otherId: params.uid,
        }),
      };
      fetch("http://localhost:4000/follow", options)
        .then((response) => response.json())
        .then((data) => { if (data.errorMsg) alert(data.errorMsg); });
    } else { // if unfollowing
      console.log("about to unfollow");
      const options = {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "unfollow",
          selfId: userData._id,
          otherId: params.uid,
        }),
      };
      fetch("http://localhost:4000/follow", options)
        .then((response) => response.json())
        .then((data) => { if (data.errorMsg) alert(data.errorMsg); });
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

  useEffect(() => {
    // handle follow button undecided when first mounting (when access by link)
    if (visitedUserData) {
      setIsFollowing(userData.following.findIndex((user) => user._id === params.uid) !== -1);
    }

    // fetch a) if visitedUserData is null (which means there's abrupt access by link/not by navigation) or b) if there is visitedUserData but params.uid isn't matched (which means there is clicking back and forth between profiles (uid change))
    if (!visitedUserData || visitedUserData._id !== params.uid) {
      if (params.uid === userData._id) {
        setVisitedUserDataHelper(userData);
      } else {
        const options = {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
        };
        fetch(`http://localhost:4000/users/${params.uid}`, options)
          .then((response) => response.json())
          .then((data) => {
            if (data.errorMsg) {
              setIsProfilePageNotFoundActive(true);
            } else {
              setVisitedUserDataHelper(data);
            }
          });
      }
    }
    // why this dependency array? because of following change, visitedProfile change, click back and forth respectively
  }, [userData, visitedUserData, params.uid]);

  // reset states before unmounting (would get one UI rerender bug for newsfeedChange socket otherwise)
  useEffect(
    () => () => {
      setVisitedUserDataHelper(null);
    },
    [],
  );

  // // handle abrupt access (visit by link, not by navigation)
  // if (userData && (params.uid === userData.uid || beforeFullPost.selfProfile)) {

  // } else if (userData && (params.uid !== userData.uid || beforeFullPost.visitedProfile)) {
  //   handleVisitVisitedProfile(); // handle abrupt link access to visitedUserData
  // }

  return (
    <div className="Profile">
      <div className="profile-container">
        <div className="profile-summary">
          <img src={visitedUserData ? visitedUserData.photoURL : IMAGE_PLACEHOLDER_URL} alt="" className="user-avatar" />
          <div className="user-info">
            <div style={{ display: "flex" }}>
              <span className="cut2" style={{ fontSize: "25px", lineHeight: "32px", marginRight: "30px" }}>{visitedUserData && visitedUserData.username}</span>

              {(params.uid === userData._id || beforeFullPost.selfProfile)
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
                    <svg aria-label="Following" className="_8-yf5 " color="currentColor" fill="currentColor" height="20" role="img" viewBox="0 0 95.28 70.03" width="20">
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
                <span>{visitedUserData && visitedUserData.postSnippets.length}</span>
                posts
              </div>
              <div className="followers" onClick={() => { handleViewFollowList(visitedUserData.followers, "followers"); }}>
                <span>{visitedUserData && visitedUserData.followers.length}</span>
                followers
              </div>
              <div className="following" onClick={() => { handleViewFollowList(visitedUserData.following, "following"); }}>
                <span>{visitedUserData && visitedUserData.following.length}</span>
                following
              </div>
            </div>
            <div className="user-bio">
              <div className="bold">{visitedUserData && visitedUserData.displayName}</div>
              <div>{visitedUserData && visitedUserData.bio}</div>
            </div>
          </div>
        </div>

        {(visitedUserData && visitedUserData.postSnippets.length > 0) && (
        <div className="profile-nav">
          <svg color="currentColor" fill="currentColor" height="12" role="img" viewBox="0 0 24 24" width="12">
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
          {visitedUserData && visitedUserData.postSnippets.length > 0
            ? visitedUserData.postSnippets.slice(0).reverse().map((post) => (
              <Link to={`/p/${post._id}`} onClick={() => { handleViewFullPost(post._id); }} key={post._id}>
                <div className="profile-post" key={post._id}>
                  <img className="post-picture" src={post.imageURL} alt="user's post" />
                  <div className="profile-post-stats">
                    <span>
                      <svg color="currentColor" fill="currentColor" height="20" role="img" viewBox="0 0 48 48" width="20">
                        <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z" />
                      </svg>
                    </span>
                    <span>{post.totalLikes}</span>
                    <span>
                      <svg color="currentColor" fill="currentColor" height="20" role="img" viewBox="0 0 24 24" width="20">
                        <path d="M12.003 2.001a9.705 9.705 0 110 19.4 10.876 10.876 0 01-2.895-.384.798.798 0 00-.533.04l-1.984.876a.801.801 0 01-1.123-.708l-.054-1.78a.806.806 0 00-.27-.569 9.49 9.49 0 01-3.14-7.175 9.65 9.65 0 0110-9.7z" fill="currentColor" stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.739" />
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
                  <svg style={{ width: "100px", height: "100px" }} viewBox="0 0 24 24">
                    <path fill="currentColor" d="M21 6H17.8L16 4H10V6H15.1L17 8H21V20H5V11H3V20C3 21.1 3.9 22 5 22H21C22.1 22 23 21.1 23 20V8C23 6.9 22.1 6 21 6M8 14C8 18.45 13.39 20.69 16.54 17.54C19.69 14.39 17.45 9 13 9C10.24 9 8 11.24 8 14M13 11C14.64 11.05 15.95 12.36 16 14C15.95 15.64 14.64 16.95 13 17C11.36 16.95 10.05 15.64 10 14C10.05 12.36 11.36 11.05 13 11M5 6H8V4H5V1H3V4H0V6H3V9H5" />
                  </svg>
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
