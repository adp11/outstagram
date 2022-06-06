import {
  addDoc, collection, doc, getDoc, serverTimestamp, updateDoc,
} from "firebase/firestore";
import React, {
  useContext, useEffect, useState,
} from "react";
import { useNavigate } from "react-router-dom";
import uniqid from "uniqid";
import { db } from "../../firebase";
import UserContext from "../Contexts/UserContext";

// Notice: many CSS inline rules in LikeList/FollowList
function FollowList() {
  const {
    userData, followListInfo, isFollowListActive, setFollowListInfo, setIsFollowListActive, setVisitedUserData, setUserData,
  } = useContext(UserContext);

  const [whichFollow, setWhichFollow] = useState(null);
  const navigate = useNavigate();

  async function updateFollowingData(tempCurrentUserData) {
    const docRef = doc(db, `users/${tempCurrentUserData.uid}`);
    await updateDoc(docRef, { following: tempCurrentUserData.following });
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

  async function handleFollowToggle(followInfo, type) {
    let tempCurrentUserData;
    let tempTargetUserData;

    if (type === "unfollow") {
      const positionInFollowing = userData.following.findIndex((user) => user.uid === followInfo.uid);
      tempCurrentUserData = { ...userData };

      // update current user's following data
      tempCurrentUserData.following.splice(positionInFollowing, 1);
      setUserData(tempCurrentUserData);
      updateFollowingData(tempCurrentUserData);

      // update target user's followers data
      const docRef = doc(db, `users/${followInfo.uid}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        tempTargetUserData = { ...docSnap.data() };
        const positionInFollowers = tempTargetUserData.followers.findIndex((user) => user.uid === userData.uid);
        tempTargetUserData.followers.splice(positionInFollowers, 1);
        await updateDoc(docRef, { followers: tempTargetUserData.followers });
      }
    } else {
      const {
        uid, photoURL, userDisplayName, username,
      } = followInfo;

      // update current user's following data
      tempCurrentUserData = { ...userData };
      tempCurrentUserData.following.push({
        uid,
        photoURL,
        username,
        userDisplayName,
      });
      setUserData(tempCurrentUserData);
      updateFollowingData(tempCurrentUserData);

      // update target user's followers data
      const docRef = doc(db, `users/${uid}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        tempTargetUserData = { ...docSnap.data() };
        tempTargetUserData.followers.push({
          uid: userData.uid,
          photoURL: userData.photoURL,
          username: userData.username,
          userDisplayName: userData.displayName,
        });
        await updateDoc(docRef, { followers: tempTargetUserData.followers });
      }
      updateNotifications(tempTargetUserData, "follow");
    }
  }

  async function handleVisitProfile(uid) {
    const docRef = doc(db, `users/${uid}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setIsFollowListActive({
        followers: false,
        following: false,
      });
      setFollowListInfo({ followers: [], following: [] });
      navigate(`/${uid}`);
      setVisitedUserData(docSnap.data());
    }
  }

  useEffect(() => {
    function escape(e) {
      if (e.key === "Escape") {
        setIsFollowListActive({
          followers: false,
          following: false,
        });
        setFollowListInfo({ followers: [], following: [] });
      }
    }

    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    if (isFollowListActive.followers) {
      setWhichFollow(followListInfo.followers);
    } else if (isFollowListActive.following) {
      setWhichFollow(followListInfo.following);
    }
  }, [isFollowListActive]);

  return (
    <div className="FollowList">
      <div className="container" style={{ padding: "0px", maxHeight: "80%" }}>
        {whichFollow && whichFollow.length > 0 && (
        // eslint-disable-next-line
        <div style={{ width: "100%", textAlign: "center", padding: "10px", borderBottom: "1px #dbdbdb solid", position: "relative" }}>
          <span className="bold">{isFollowListActive.followers ? "Followers" : "Following"}</span>
          <svg
            onClick={() => { setIsFollowListActive({ followers: false, following: false }); setFollowListInfo({ followers: [], following: [] }); }}
            aria-label="Close"
            color="currentColor"
            fill="currentColor"
            height="18"
            role="img"
            viewBox="0 0 24 24"
            width="18"
            style={{
              position: "absolute", right: "10px", top: "10px", fontSize: "30px",
            }}
          >
            {/* eslint-disable-next-line */}
            <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></polyline>
            {/* eslint-disable-next-line */}
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354"></line>
          </svg>
        </div>
        )}

        <div className="list" style={{ width: "100%", overflow: "auto", marginBottom: "10px" }}>
          {whichFollow && whichFollow.length > 0 ? whichFollow.map((follow) => (
            <div
              className="item"
              style={{
                display: "flex", alignItems: "center", width: "100%", padding: "0px 15px",
              }}
              key={follow.uid}
            >
              {/* eslint-disable-next-line */}
              <img src={follow.photoURL} alt="user's pic" className="src-avatar" onClick={() => { handleVisitProfile(follow.uid); }} />
              <div>
                {/* eslint-disable-next-line */}
                <div className="bold medium cut1 username">{follow.username}</div>
                <div className="grey medium">{follow.userDisplayName}</div>
              </div>
              {(userData.following.findIndex((followee) => followee.uid === follow.uid) !== -1) ? (
                // eslint-disable-next-line
                <button type="button" style={{ padding: "5px 10px", backgroundColor: "transparent", border: "1px #dbdbdb solid", borderRadius: "3px", fontWeight: "500", fontSize: "14px", marginLeft: "auto" }}onClick={() => {handleFollowToggle(follow, "unfollow")}}>Following</button>
              ) : (follow.uid === userData.uid) ? (
                <div /> // null element
              ) : (
                //  eslint-disable-next-line
                <button type="button" style={{ padding: "5px 10px", backgroundColor: "#0095f6", border: "none", color: "white", fontWeight: "600", fontSize: "14px", borderRadius: "5px", flex: "0", width: "90px", marginLeft: "auto" }} onClick={() => {handleFollowToggle(follow, "follow");}}>Follow</button>
              )}
            </div>
          )) : (
            <div style={{ textAlign: "center", position: "relative", padding: "10px 30px" }}>
              <svg
                onClick={() => { setIsFollowListActive({ followers: false, following: false }); setFollowListInfo({ followers: [], following: [] }); }}
                aria-label="Close"
                color="#262626"
                fill="#262626"
                height="18"
                role="img"
                viewBox="0 0 24 24"
                width="18"
                style={{
                  position: "absolute", right: "10px", top: "10px", fontSize: "30px",
                }}
              >
                {/* eslint-disable-next-line */}
            <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></polyline>
                {/* eslint-disable-next-line */}
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354"></line>
              </svg>
              <p className="bold" style={{ fontSize: "18px" }}>{ isFollowListActive.followers ? "No followers yet" : "No following yet"}</p>
              <p className="grey medium">{isFollowListActive.followers ? "Quick tip: Comment on posts you've read to get noticed." : "Quick tip: Click Follow on people's profile to explore Instagram."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowList;
