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
    userData, followListInfo, isFollowListActive, setFollowListInfo, setIsFollowListActive, visitedUserData, setVisitedUserDataHelper, setUserDataHelper, setIsProfilePageNotFoundActive,
  } = useContext(UserContext);

  const [whichFollow, setWhichFollow] = useState(isFollowListActive.followers ? followListInfo.followers : followListInfo.following);

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
        .then((data) => { if (data.errMsg) alert(data.errMsg); });
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
        .then((data) => { if (data.errMsg) alert(data.errMsg); });
    }
  }

  async function handleVisitProfile(_id) {
    if (_id === userData._id) {
      setIsFollowListActive({
        followers: false,
        following: false,
      });
      setFollowListInfo({ followers: [], following: [] });
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
          if (data.errMsg === "No user found") {
            navigate(`/u/${_id}`);
            setIsProfilePageNotFoundActive(true);
          } else if (data.errMsg) {
            alert(data.errMsg);
          } else {
            setIsFollowListActive({
              followers: false,
              following: false,
            });
            setFollowListInfo({ followers: [], following: [] });
            navigate(`/u/${_id}`);
            setVisitedUserDataHelper(data);
          }
        });
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
    if (isFollowListActive.following) {
      setWhichFollow(visitedUserData.following);
    } else if (isFollowListActive.followers) {
      setWhichFollow(visitedUserData.followers);
    }
  }, [visitedUserData]);

  return (
    <div className="FollowList">
      <div className="container" style={{ padding: "0px", maxHeight: "80%" }}>
        {whichFollow.length > 0 && (
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
          {whichFollow.length > 0
            ? whichFollow.map((follow) => (
              <div
                className="item"
                style={{
                  display: "flex", alignItems: "center", width: "100%", padding: "0px 15px",
                }}
                key={follow._id}
              >
                {/* eslint-disable-next-line */}
              <img src={follow.photoURL} alt="user's pic" className="src-avatar" onClick={() => { handleVisitProfile(follow._id); }} />
                <div>
                  {/* eslint-disable-next-line */}
                <div className="bold medium cut1 username">{follow.username}</div>
                  <div className="grey medium">{follow.displayName}</div>
                </div>
                {(userData.following.findIndex((followee) => followee._id === follow._id) !== -1) ? (
                // eslint-disable-next-line
                <button type="button" style={{ padding: "5px 10px", backgroundColor: "transparent", border: "1px #dbdbdb solid", borderRadius: "3px", fontWeight: "500", fontSize: "14px", marginLeft: "auto" }}onClick={() => {handleFollowToggle(follow._id, "unfollow")}}>Following</button>
                ) : (follow._id === userData._id) ? (
                  <div /> // null element
                ) : (
                //  eslint-disable-next-line
                <button type="button" style={{ padding: "5px 10px", backgroundColor: "#0095f6", border: "none", color: "white", fontWeight: "600", fontSize: "14px", borderRadius: "5px", flex: "0", width: "90px", marginLeft: "auto" }} onClick={() => {handleFollowToggle(follow._id, "follow");}}>Follow</button>
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
                  <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354" />
                </svg>
                <p className="bold" style={{ fontSize: "18px" }}>{ isFollowListActive.followers ? "No followers yet" : "No following yet"}</p>
                <p className="grey medium">{isFollowListActive.followers ? "Quick tip: Comment on posts you've read to get noticed." : "Quick tip: Click Follow on people's profile to explore Outstagram."}</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default FollowList;
