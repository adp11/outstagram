import {
  addDoc, collection, doc, getDoc, serverTimestamp, updateDoc,
} from "firebase/firestore";
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import uniqid from "uniqid";
import { db } from "../../firebase";
import UserContext from "../Contexts/UserContext";

function LikeList() {
  const {
    userData, likeListInfo, beforeFullPost, isLikeListActive, visitedUserData, setIsLikeListActive, setVisitedUserDataHelper, setLikeListInfo, setUserDataHelper, setIsFullPostActive, setBeforeFullPost, setFullPostInfo, setFullPostIndex, setIsProfilePageNotFoundActive,
  } = useContext(UserContext);

  const navigate = useNavigate();

  async function handleFollowToggle(followId, type) {
    if (type === "unfollow") {
      const options = {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "unfollow",
          selfId: userData._id,
          otherId: followId,
        }),
      };
      fetch("http://localhost:4000/follow", options)
        .then((response) => response.json())
        .then((data) => { if (data.errorMsg) alert(data.errorMsg); });
    } else {
      const options = {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "follow",
          selfId: userData._id,
          otherId: followId,
        }),
      };
      fetch("http://localhost:4000/follow", options)
        .then((response) => response.json())
        .then((data) => { if (data.errorMsg) alert(data.errorMsg); });
    }
  }

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

  async function handleVisitProfile(_id) {
    if (likeListInfo.fromFullPost) {
      handleCloseFullPost();
    }
    if (_id === userData._id) {
      setIsLikeListActive(false);
      setLikeListInfo({});
      navigate(`/u/${_id}`);
      setVisitedUserDataHelper(userData);
    } else {
      const options = {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      };
      fetch(`http://localhost:4000/users/${_id}`, options)
        .then((response) => response.json())
        .then((data) => {
          if (data.errorMsg) {
            navigate(`/u/${_id}`);
            setIsProfilePageNotFoundActive(true);
          } else {
            setIsLikeListActive(false);
            setLikeListInfo({});
            navigate(`/u/${_id}`);
            setVisitedUserDataHelper(data);
          }
        });
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

  return (
    <div className="LikeList">
      <div className="container" style={{ padding: "0px", maxHeight: "80%" }}>
        {likeListInfo.postLikes.length > 0 && (
        <div style={{
          width: "100%", textAlign: "center", padding: "10px", borderBottom: "1px #dbdbdb solid", position: "relative",
        }}
        >
          <span className="bold">Likes</span>
          <svg
            onClick={() => { setIsLikeListActive(false); setLikeListInfo({}); }}
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
            <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354" />
          </svg>
        </div>
        )}

        <div className="list" style={{ width: "100%", overflow: "auto", marginBottom: "10px" }}>
          {likeListInfo.postLikes.length > 0
            ? likeListInfo.postLikes.map((like) => (
              <div
                className="item"
                style={{
                  display: "flex", alignItems: "center", width: "100%", padding: "0px 15px",
                }}
                key={like._id}
              >
                <img src={like.photoURL} alt="user's pic" className="src-avatar" onClick={() => { handleVisitProfile(like._id); }} />
                <div>
                  <div className="bold medium cut1 username" onClick={() => { handleVisitProfile(like._id); }}>{like.username}</div>
                  <div className="grey medium">{like.displayName}</div>
                </div>

                {(userData.following.findIndex((followee) => followee._id === like._id) !== -1) ? (
                  <button
                    type="button"
                    style={{
                      padding: "5px 10px", backgroundColor: "transparent", border: "1px #dbdbdb solid", borderRadius: "3px", fontWeight: "500", fontSize: "14px", marginLeft: "auto",
                    }}
                    onClick={() => { handleFollowToggle(like._id, "unfollow"); }}
                  >
                    Following
                  </button>
                ) : (like._id === userData._id) ? (
                  <div /> // null element
                ) : (
                  <button
                    type="button"
                    style={{
                      padding: "5px 10px", backgroundColor: "#0095f6", border: "none", color: "white", fontWeight: "600", fontSize: "14px", borderRadius: "5px", flex: "0", width: "90px", marginLeft: "auto",
                    }}
                    onClick={() => { handleFollowToggle(like._id, "follow"); }}
                  >
                    Follow
                  </button>
                )}
              </div>
            )) : (
              <div style={{ textAlign: "center", position: "relative", padding: "10px 30px" }}>
                <svg
                  onClick={() => { setIsLikeListActive(false); setLikeListInfo({}); }}
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
                  <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354" />
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
