import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, {
  useContext, useEffect, useRef, useState,
} from "react";
import { useNavigate } from "react-router-dom";
import uniqid from "uniqid";
import { db } from "../firebase";
import UserContext from "./Contexts/UserContext";

// lots of custom override css rules
function LikeList() {
  const {
    likeListInfo, setIsLikeListActive, userData, setVisitedUserData, setLikeListInfo, setUserData, setIsFullPostActive, setBeforeFullPost, beforeFullPost, setFullPostInfo, setFullPostIndex,
  } = useContext(UserContext);

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

      // Set the "capital" field of the city 'DC'
    } else if (notificationType === "like") {
      //
    }
  }

  async function handleFollowToggle(likeInfo, type) {
    let tempCurrentUserData;
    let tempTargetUserData;

    if (type === "unfollow") {
      console.log("start unfollow");
      const positionInFollowing = userData.following.findIndex((user) => user.uid === likeInfo.sourceId);
      tempCurrentUserData = { ...userData };

      // update current user's following data
      tempCurrentUserData.following.splice(positionInFollowing, 1);
      setUserData(tempCurrentUserData);
      updateFollowingData(tempCurrentUserData);

      // update likeSourceId user's followers data
      const docRef = doc(db, `users/${likeInfo.sourceId}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        tempTargetUserData = { ...docSnap.data() };
        const positionInFollowers = tempTargetUserData.followers.findIndex((user) => user.uid === userData.uid);
        tempTargetUserData.followers.splice(positionInFollowers, 1);
        await updateDoc(docRef, { followers: tempTargetUserData.followers });
      }
      console.log("end unfollow");
    } else {
      console.log("start follow");
      const {
        sourceDisplayname, sourceId, sourcePhotoURL, sourceUsername,
      } = likeInfo;

      // update current user's following data
      tempCurrentUserData = { ...userData };
      tempCurrentUserData.following.push({
        uid: sourceId,
        photoURL: sourcePhotoURL,
        username: sourceUsername,
        userDisplayName: sourceDisplayname,
      });
      setUserData(tempCurrentUserData);
      updateFollowingData(tempCurrentUserData);

      // update likeSourceId user's followers data
      const docRef = doc(db, `users/${sourceId}`);
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
      console.log("end follow");
    }
  }

  // workaround (tiny modifications) as cannot pass this function from FullPost component
  function handleCloseFullPost() {
    setIsFullPostActive(false);
    if (beforeFullPost.selfProfile) {
      setFullPostInfo(null);
    } else if (beforeFullPost.visitedProfile) {
      setFullPostInfo(null);
    } else {
      setFullPostIndex(null);
    }

    setBeforeFullPost({
      selfProfile: false,
      visitedProfile: false,
      newsfeed: false,
    });
  }

  async function handleVisitProfile(uid) {
    const docRef = doc(db, `users/${uid}`);
    const docSnap = await getDoc(docRef);

    if (likeListInfo.fromFullPost) {
      handleCloseFullPost();
    }
    if (docSnap.exists()) {
      setIsLikeListActive(false);
      setLikeListInfo({});
      navigate(`/${uid}`);
      setVisitedUserData(docSnap.data());
    }
  }

  useEffect(() => {
    function escape(e) {
      if (e.key === "Escape") {
        setIsLikeListActive(false);
        setLikeListInfo({});
      }
    }

    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const { postLikes } = likeListInfo;

  return (
    <div className="LikeList">
      <div className="container" style={{ padding: "0px", maxHeight: "80%" }}>
        {postLikes.length > 0 && (
        // eslint-disable-next-line
        <div style={{ width: "100%", textAlign: "center", padding: "10px", borderBottom: "1px #dbdbdb solid", position: "relative" }}>
          <span className="bold">Likes</span>
          <svg
            onClick={() => { setIsLikeListActive(false); setLikeListInfo({}); }}
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
        </div>
        )}

        <div className="list" style={{ width: "100%", overflow: "auto", marginBottom: "10px" }}>
          {postLikes.length > 0 ? postLikes.map((like) => (
            //  eslint-disable-next-line
            <div className="item" style={{ display: "flex", alignItems: "center", width: "100%", padding: "0px 15px" }} key={like.sourceId}>
              <img src={like.sourcePhotoURL} alt="user's pic" className="src-avatar" onClick={() => { handleVisitProfile(like.sourceId); }} />
              <div>
                <div className="bold medium cut1 username" onClick={() => { handleVisitProfile(like.sourceId); }}>{like.sourceUsername}</div>
                <div className="grey medium">{like.sourceDisplayname}</div>
              </div>

              {(userData.following.findIndex((followee) => followee.uid === like.sourceId) !== -1) ? (
                //  eslint-disable-next-line
                <button type="button" style={{ padding: "5px 10px", backgroundColor: "transparent", border: "1px #dbdbdb solid", borderRadius: "3px", fontWeight: "500", fontSize: "14px", marginLeft: "auto" }}onClick={() => {handleFollowToggle(like, "unfollow")}}>Following</button>
              ) : (like.sourceId === userData.uid) ? (
                <div /> // null element
              ) : (
                //  eslint-disable-next-line
                <button type="button" style={{ padding: "5px 10px", backgroundColor: "#0095f6", border: "none", color: "white", fontWeight: "600", fontSize: "14px", borderRadius: "5px", flex: "0", width: "90px", marginLeft: "auto" }} onClick={() => {handleFollowToggle(like, "follow");}}>Follow</button>
              )}
            </div>
          )) : (
            <div style={{ textAlign: "center", position: "relative", padding: "10px 30px" }}>
              <svg
                onClick={() => { setIsLikeListActive(false); setLikeListInfo({}); }}
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
              <p className="bold" style={{ fontSize: "18px" }}>No likes yet</p>
              <p className="grey medium">Tap the heart on any Post to show it some love. When you do, it'll show up here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LikeList;
