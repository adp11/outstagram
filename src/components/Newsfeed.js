import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserContext from "./Contexts/UserContext";
import Snackbar from "./Popups/Snackbar";
import { computeHowLongAgo } from "../utils";

function Newsfeed() {
  const {
    newsfeed, setIsFullPostActive, setBeforeFullPost, setFullPostInfoRef, scrollY, userData, setVisitedUserDataHelper, setIsLikeListActive, setLikeListInfo, setIsProfilePageNotFoundActive,
  } = useContext(UserContext);
  const [submitCommentError, setSubmitCommentError] = useState(null);
  const navigate = useNavigate();

  // Prevent user from writing comments on multiple posts on their newsfeed
  const [postComments, setPostComments] = useState({});
  const [notImplementedError, setNotImplementedError] = useState(false);

  function handleViewFullPost(postInfo) {
    scrollY.current = window.scrollY;
    setIsFullPostActive(true);
    setBeforeFullPost({
      newsfeed: true,
      profile: false,
    });
    setFullPostInfoRef(postInfo);
  }

  function handleViewLikeList(postLikes) {
    scrollY.current = window.scrollY;
    setIsLikeListActive(true);
    setLikeListInfo({
      postLikes,
      fromNewsfeed: true,
    });
  }

  function handleSubmitPostComment(e, postInfo) {
    e.preventDefault();

    if (postComments[postInfo._id] && postComments[postInfo._id].trim()) {
      const options = {
        method: "PUT",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "comment",
          commenterId: userData._id,
          postId: postInfo._id,
          authorId: postInfo.author._id,
          isSelfComment: postInfo.author._id === userData._id,
          content: postComments[postInfo._id],
        }),
      };

      fetch("http://localhost:4000/comment", options)
        .then((response) => response.json())
        .then((data) => {
          if (data.errorMsg) alert(data.errorMsg);
          else {
            setPostComments({ ...postComments, [postInfo._id]: "" });
          }
        });
    } else {
      setSubmitCommentError("Posting empty comments error");
    }
  }

  function handleLikePost(postInfo) {
    let options;
    const targetIndex = postInfo.likes.findIndex((like) => like._id === userData._id);
    if (targetIndex > -1) {
      options = {
        method: "PUT",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "unlike",
          likerId: userData._id,
          postId: postInfo._id,
          authorId: postInfo.author._id,
        }),
      };
    } else {
      options = {
        method: "PUT",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "like",
          isSelfLike: postInfo.author._id === userData._id,
          likerId: userData._id,
          postId: postInfo._id,
          authorId: postInfo.author._id,
        }),
      };
    }
    fetch("http://localhost:4000/like", options)
      .then((response) => response.json())
      .then((data) => { if (data.errorMsg) alert(data.errorMsg); });
  }

  function handleVisitProfile(_id) {
    if (_id === userData._id) {
      setVisitedUserDataHelper(userData);
      navigate(`/u/${_id}`);
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
            setIsProfilePageNotFoundActive(true);
            navigate(`/u/${_id}`);
          } else {
            setVisitedUserDataHelper(data);
            navigate(`/u/${_id}`);
          }
        });
    }
  }

  return (
    <div className="Newsfeed">
      <div className="newsfeed-container">
        {(newsfeed.length > 0) ? newsfeed.map((post) => (
          <div className="NewsfeedPost" key={post._id}>
            <div className="user-profile">
              <img className="user-avatar" src={post.author.photoURL} alt="" onClick={() => { handleVisitProfile(post.author._id); }} />
              <span className="username bold medium" onClick={() => { handleVisitProfile(post.author._id); }}>{post.author.username}</span>
            </div>

            <Link to={`/p/${post._id}`} onClick={() => { handleViewFullPost(post); }}>
              <div className="post-picture">
                {/* eslint-disable-next-line */}
                <img src={post.imageURL} alt="A post image from this user" style={{ width: "100%", height: "auto" }} />
              </div>
            </Link>

            <div className="post-btns">
              {(post.likes.findIndex((like) => like._id === userData._id) === -1) ? (
                <svg onClick={() => { handleLikePost(post); }} color="currentColor" fill="currentColor" height="24" width="24">
                  <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938m0-2a6.04 6.04 0 00-4.797 2.127 6.052 6.052 0 00-4.787-2.127A6.985 6.985 0 00.5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 003.518 3.018 2 2 0 002.174 0 45.263 45.263 0 003.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 00-6.708-7.218z" />
                </svg>
              ) : <svg onClick={() => { handleLikePost(post); }} color="#ed4956" fill="#ed4956" height="24" role="img" viewBox="0 0 48 48" width="24"><path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z" /></svg>}

              <svg onClick={() => { handleViewFullPost(post); navigate(`/p/${post._id}`); }} className="comment" color="currentColor" fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
                <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
              </svg>

              <svg onClick={() => { setNotImplementedError("Sorry! This feature is not yet implemented. "); }} className="share" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
                <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083" />
                <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>

            {post.likes.length > 0 ? (
              <div className="post-likes medium" onClick={() => { handleViewLikeList(post.likes); }}>
                Liked by
                {" "}
                <span className="username medium bold">{post.likes[post.likes.length - 1].username}</span>
                {" "}
                and
                {" "}
                <span className="medium bold">
                  {post.likes.length - 1}
                  {" "}
                  others
                </span>
              </div>
            )
              : (
                <div className="post-likes medium bold" onClick={() => { handleViewLikeList(post.likes); }}>
                  {post.likes.length}
                  {" "}
                  likes
                </div>
              )}
            {post.postCaption && (
            <div className="post-caption medium">
              <span className="username bold medium" onClick={() => { handleVisitProfile(post.author._id); }}>{post.author.username}</span>
              {" "}
              {post.postCaption}
            </div>
            )}
            <Link to={`/p/${post._id}`} onClick={() => { handleViewFullPost(post); }}>
              <div className="post-all-comments grey medium">
                View all
                {" "}
                {post.comments.length}
                {" "}
                comments
              </div>
            </Link>
            <div className="comment-snippet">
              <div className="comment medium">
                <span className="username bold medium" onClick={() => { handleVisitProfile(post.comments[post.comments.length - 2].commenter._id); }}>
                  {post.comments[post.comments.length - 2] && post.comments[post.comments.length - 2].commenter.username}
                </span>
                {" "}
                {post.comments[post.comments.length - 2] && post.comments[post.comments.length - 2].content}
              </div>
              <div className="comment medium">
                <span className="username bold medium" onClick={() => { handleVisitProfile(post.comments[post.comments.length - 1].commenter._id); }}>
                  {post.comments[post.comments.length - 1] && post.comments[post.comments.length - 1].commenter.username}
                </span>
                {" "}
                {post.comments[post.comments.length - 1] && post.comments[post.comments.length - 1].content}
              </div>
            </div>

            <div className="grey extrasmall" style={{ margin: "0 20px" }}>{computeHowLongAgo(post.createdAt, false)}</div>

            <form onSubmit={(e) => { handleSubmitPostComment(e, post); }} className="post-comment-box">
              <textarea onChange={(e) => { setPostComments({ ...postComments, [post._id]: e.target.value }); }} onKeyDown={(e) => { if (e.key === "Enter") handleSubmitPostComment(e, post); }} type="text" placeholder="Add a comment..." value={postComments[post._id] || ""} />
              <span onClick={(e) => { handleSubmitPostComment(e, post); }} className="submit-btn" type="submit">Post</span>
            </form>
          </div>
        ))
          : (
            <div style={{ display: "grid", placeItems: "center", height: "calc(100vh - 90px)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <svg style={{ width: "70px", height: "70px" }} viewBox="0 0 24 24">
                  <path fill="currentColor" d="M15.5,12C18,12 20,14 20,16.5C20,17.38 19.75,18.21 19.31,18.9L22.39,22L21,23.39L17.88,20.32C17.19,20.75 16.37,21 15.5,21C13,21 11,19 11,16.5C11,14 13,12 15.5,12M15.5,14A2.5,2.5 0 0,0 13,16.5A2.5,2.5 0 0,0 15.5,19A2.5,2.5 0 0,0 18,16.5A2.5,2.5 0 0,0 15.5,14M10,4A4,4 0 0,1 14,8C14,8.91 13.69,9.75 13.18,10.43C12.32,10.75 11.55,11.26 10.91,11.9L10,12A4,4 0 0,1 6,8A4,4 0 0,1 10,4M2,20V18C2,15.88 5.31,14.14 9.5,14C9.18,14.78 9,15.62 9,16.5C9,17.79 9.38,19 10,20H2Z" />
                </svg>
                <p className="bold">Follow people to explore Outstagram.</p>
              </div>
            </div>
          )}
      </div>
      {notImplementedError && <Snackbar snackBarMessage={notImplementedError} setSnackBarMessage={setNotImplementedError} />}
      {submitCommentError && <Snackbar snackBarMessage={submitCommentError} setSnackBarMessage={setSubmitCommentError} />}
    </div>
  );
}

export default Newsfeed;
