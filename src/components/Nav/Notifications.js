import {
  addDoc,
  collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import React, { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import uniqid from "uniqid";
import { db } from "../../firebase";
import { computeHowLongAgo } from "../../utils";
import UserContext from "../Contexts/UserContext";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

function Notifications() {
  const {
    userData, scrollY, setUserData, setVisitedUserData, setBeforeFullPost, setIsFullPostActive, setFullPostInfo,
  } = useContext(UserContext);
  const [notificationList, setNotificationList] = useState([]);
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const params = useParams();
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

  async function handleFollowToggle(notifInfo, type) {
    let tempCurrentUserData;
    let tempTargetUserData;

    if (type === "unfollow") {
      const positionInFollowing = userData.following.findIndex((user) => user.uid === notifInfo.sourceId);
      tempCurrentUserData = { ...userData };

      // update current user's following data
      tempCurrentUserData.following.splice(positionInFollowing, 1);
      setUserData(tempCurrentUserData);
      updateFollowingData(tempCurrentUserData);

      // update target user's followers data
      const docRef = doc(db, `users/${notifInfo.sourceId}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        tempTargetUserData = { ...docSnap.data() };
        const positionInFollowers = tempTargetUserData.followers.findIndex((user) => user.uid === userData.uid);
        tempTargetUserData.followers.splice(positionInFollowers, 1);
        await updateDoc(docRef, { followers: tempTargetUserData.followers });
      }
    } else {
      const {
        sourceId, sourcePhotoURL, sourceUsername, sourceDisplayname,
      } = notifInfo;

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

      // update target user's followers data
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
    }
  }

  async function handleCloseNotifications(toClose = true) {
    if (toClose) {
      setIsDropdownActive(!isDropdownActive);
      setNotificationList([]);
    }
    setUserData({ ...userData, totalNotifs: 0 });

    // update to totalNotifs snippet
    const docRef = doc(db, `users/${userData.uid}`);
    await updateDoc(docRef, {
      totalNotifs: 0,
    });
  }

  async function handleViewNotifications() {
    setIsDropdownActive(!isDropdownActive);
    setIsLoading(true);

    const q = query(collection(db, `users/${userData.uid}/notifications`), orderBy("creationTime", "desc"));
    const querySnapshot = await getDocs(q);
    const tempNotificationList = [];
    querySnapshot.forEach((document) => {
      tempNotificationList.push(document.data());
    });

    setNotificationList(tempNotificationList);
    setIsLoading(false);
    handleCloseNotifications(false);
  }

  async function handleVisitProfile(uid) {
    const docRef = doc(db, `users/${uid}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setIsDropdownActive(false);
      setVisitedUserData(docSnap.data());
      navigate(`/${uid}`);
    }
  }

  async function handleVisitFullPost({ sourceAuthorId, sourcePostId }) {
    let docRef;
    let docSnap;

    // cannot reuse handleVisitProfile() because of its async function and invalid 'params.postId' below
    docRef = doc(db, `users/${sourceAuthorId}`);
    docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setIsDropdownActive(false);
      setVisitedUserData(docSnap.data());
      navigate(`/${sourceAuthorId}`);
    }
    // cannot reuse handleVisitProfile() because of its async function and invalid 'params.postId' below

    scrollY.current = window.scrollY;
    setIsFullPostActive(true);
    if (params.uid === sourceAuthorId || params.postId) {
      setBeforeFullPost({
        newsfeed: false,
        selfProfile: true,
        visitedProfile: false,
      });
      docRef = doc(db, `users/${sourceAuthorId}/posts/${sourcePostId}`);
    } else {
      setBeforeFullPost({
        newsfeed: false,
        selfProfile: false,
        visitedProfile: true,
      });
      docRef = doc(db, `users/${sourceAuthorId}/posts/${sourcePostId}`);
    }

    docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setFullPostInfo(docSnap.data());
    }
    navigate(`/p/${sourcePostId}`);
  }

  return (
    <div className="Notifications">
      {isDropdownActive ? (
        <svg aria-label="Activity Feed" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 48 48" width="24" onClick={handleCloseNotifications}>
          <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z" />
        </svg>

      ) : (
        <div style={{ position: "relative" }}>
          <svg color="currentColor" fill="currentColor" height="24" width="24" onClick={handleViewNotifications}>
            <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938m0-2a6.04 6.04 0 00-4.797 2.127 6.052 6.052 0 00-4.787-2.127A6.985 6.985 0 00.5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 003.518 3.018 2 2 0 002.174 0 45.263 45.263 0 003.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 00-6.708-7.218z" />
          </svg>
          {/* {(userData && userData.totalNotifs > 0) && (
            <div
              className="extrasmall bold"
              style={{
                position: "absolute", width: "17px", height: "17px", borderRadius: "50%", backgroundColor: "#ed4956", color: "#fff", textAlign: "center", top: "-4px", right: "-10px",
              }}
            >
              {userData.totalNotifs > 9 ? "9+" : `${userData.totalNotifs}`}
            </div>
          )} */}
        </div>
      )}

      {(isDropdownActive) && (
      <div className="dropdown">
        {isLoading
          ? (<img src={LOADING_IMAGE_URL} alt="loading" style={{ width: "24px", height: "24px", margin: "20px 50%" }} />)
          : (
            notificationList.length > 0 ? notificationList.map((notification) => (
              <div className="notification" key={notification.notifId}>
                {/* eslint-disable-next-line */}
                <img src={notification.sourcePhotoURL} alt="src-pic" className="src-avatar" onClick={() => { handleVisitProfile(notification.sourceId); }} />
                <div className="notification-content">
                  <span className="username bold medium" onClick={() => { handleVisitProfile(notification.sourceId); }}>{notification.sourceUsername}</span>
                  {" "}
                  {notification.type === "follow" && <span className="src-action medium">started following you.</span>}
                  {notification.type === "like" && <span className="src-action medium">liked your photo.</span>}
                  {notification.type === "comment" && (
                  <span className="src-action medium">
                    commented:
                    {" "}
                    <span style={{ display: "inline-block", marginRight: "10px" }}>{notification.content}</span>
                  </span>
                  )}
                  {" "}
                  <span className="src-action-ago grey medium">{computeHowLongAgo(notification.creationTime.seconds, true)}</span>
                </div>

                {(notification.type === "follow") ? ((userData.following.findIndex((followee) => followee.uid === notification.sourceId) !== -1) ? (
                  // eslint-disable-next-line
                  <button type="button" style={{ padding: "5px 10px", backgroundColor: "transparent", border: "1px #dbdbdb solid", borderRadius: "3px", fontWeight: "500", fontSize: "14px", marginLeft: "auto" }}onClick={() => {handleFollowToggle(notification, "unfollow")}}>Following</button>
                ) : (
                  //  eslint-disable-next-line
                  <button type="button" style={{ padding: "5px 10px", backgroundColor: "#0095f6", border: "none", color: "white", fontWeight: "600", fontSize: "14px", borderRadius: "5px", flex: "0", width: "90px", marginLeft: "auto" }} onClick={() => {handleFollowToggle(notification, "follow");}}>Follow</button>
                )) : (
                  //  eslint-disable-next-line
                  <img src={notification.sourcePostPictureURL} alt="src-pic" className="src-action-on" onClick={() => { handleVisitFullPost(notification); }} />
                )}
              </div>
            )) : (
              <p className="grey medium" style={{ textAlign: "center", padding: "15px", border: "none" }}>No notifications.</p>
            )
          )}
      </div>
      )}
    </div>
  );
}

export default Notifications;
