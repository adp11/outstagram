import { deleteObject, ref } from "firebase/storage";
import React, {
  useEffect, useContext, useState, useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { storage } from "../../firebase";
import { computeHowLongAgo } from "../../utils";
import UserContext from "../Contexts/UserContext";
import Snackbar from "./Snackbar";

const IMAGE_PLACEHOLDER_URL = `${window.location.origin}/images/white_flag.gif`;

// FullPost can come from 4 sources: abrupt access, visited profile, self profile, and newsfeed
function FullPost() {
  const {
    userData, visitedUserData, scrollY, beforeFullPost, fullPostInfo, isLikeListActive, isFullPostByLink,
    setIsFullPostActive, setBeforeFullPost, setFullPostInfoRef, setVisitedUserDataHelper, setIsLikeListActive, setLikeListInfo, setIsPostPageNotFoundActive, setIsFullPostByLink, setIsProfilePageNotFoundActive,
  } = useContext(UserContext);

  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const [clipboardMessage, setClipboardMessage] = useState(null);
  const [notImplementedError, setNotImplementedError] = useState(false);
  const [toResize, setToResize] = useState(false);
  const params = useParams();
  // Prevent user from writing comments on multiple posts on their newsfeed
  const [postComments, setPostComments] = useState({});
  const [submitCommentError, setSubmitCommentError] = useState(null);

  const navigate = useNavigate();
  const textareaRef = useRef();

  function handleViewLikeList(postLikes) {
    scrollY.current = window.scrollY;
    setIsLikeListActive(true);
    setLikeListInfo({
      postLikes,
      fromFullPost: true,
    });
  }

  function handleCloseFullPost(redirect = true) {
    setIsFullPostActive(false);
    if (beforeFullPost.profile && redirect) {
      navigate(`/u/${visitedUserData._id}`);
    } else if ((beforeFullPost.newsfeed && redirect) || isFullPostByLink) { // fullPostByLink will redirect to newsfeed upon closing
      navigate("/");
    }

    setFullPostInfoRef(null);
    setIsFullPostByLink(false);
    setBeforeFullPost({
      newsfeed: false,
      profile: false,
    });
  }

  function handleDeletePost(authorId, postId, filePath) {
    setIsDropdownActive(false);
    handleCloseFullPost();
    const options = {
      method: "DELETE",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authorId,
      }),
    };
    fetch(`http://localhost:4000/posts/${postId}`, options)
      .then((response) => {
        if (!response.ok) {
          return response.json().then(({ message }) => {
            throw new Error(message || response.status);
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("data from json()", data);
        const imageRef = ref(storage, filePath);
        deleteObject(imageRef).then(() => {
          // File deleted successfully (could've set a snackbar for visual feedback)
        }).catch((error) => {
          alert(error);
        });
      })
      .catch((err) => {
        console.log("error happened in catch", err);
        alert(err.message);
      });
  }

  function handleSubmitPostComment(e) {
    e.preventDefault();

    if (postComments[fullPostInfo._id] && postComments[fullPostInfo._id].trim()) {
      const options = {
        method: "PUT",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "comment",
          commenterId: userData._id,
          authorId: fullPostInfo.author._id,
          isSelfComment: fullPostInfo.author._id === userData._id,
          content: postComments[fullPostInfo._id],
        }),
      };

      fetch(`http://localhost:4000/posts/${fullPostInfo._id}/comments`, options)
        .then((response) => {
          if (!response.ok) {
            return response.json().then(({ message }) => {
              throw new Error(message || response.status);
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("data from json()", data);
          setPostComments({ ...postComments, [fullPostInfo._id]: "" });
        })
        .catch((err) => {
          console.log("error happened in catch", err);
          alert(err.message);
        });
    } else {
      setSubmitCommentError("Posting empty comments error");
    }
  }

  function handleLikePost() {
    let options;
    const targetIndex = fullPostInfo.likes.findIndex((like) => like._id === userData._id);
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
          authorId: fullPostInfo.author._id,
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
          isSelfLike: fullPostInfo.author._id === userData._id,
          likerId: userData._id,
          authorId: fullPostInfo.author._id,
        }),
      };
    }
    fetch(`http://localhost:4000/posts/${fullPostInfo._id}/likes`, options)
      .then((response) => {
        if (!response.ok) {
          return response.json().then(({ message }) => {
            throw new Error(message || response.status);
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("data from json()", data);
      })
      .catch((err) => {
        console.log("error happened in catch", err);
        alert(err.message);
      });
  }

  function handleVisitProfile(_id) {
    handleCloseFullPost(false); // prevent nagivate() 2 times
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
        .then((response) => {
          if (!response.ok) {
            return response.json().then(({ message }) => {
              throw new Error(message || response.status);
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("data from json()", data);
          setVisitedUserDataHelper(data);
          navigate(`/u/${_id}`);
        })
        .catch((err) => {
          console.log("error happened in catch", err);
          setIsProfilePageNotFoundActive(true);
          navigate(`/u/${_id}`);
          alert(err.message);
        });
    }
  }

  function handleImageSize({ target: img }) {
    if (Math.abs(img.naturalHeight - img.naturalWidth) < 100) {
      setToResize(true);
    }
  }

  useEffect(() => {
    console.log("in full post");
    function escape(e) {
      if (e.key === "Escape") {
        setIsFullPostActive(false);
      }
    }
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    // handle access full post by link (not navigation)
    if (!fullPostInfo) {
      const options = {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      };
      fetch(`http://localhost:4000/posts/${params.postId}`, options)
        .then((response) => {
          if (!response.ok) {
            return response.json().then(({ message }) => {
              throw new Error(message || response.status);
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("data from json()", data);
          setBeforeFullPost({
            newsfeed: true,
            profile: false,
          });
          setIsFullPostActive(true);
          setFullPostInfoRef(data);
        })
        .catch((err) => {
          console.log("error happened in catch", err);
          setIsFullPostActive(false);
          setIsPostPageNotFoundActive(true);
          alert(err.message);
        });
    }
  }, [fullPostInfo]);

  return (
    <div className={`FullPost ${(isLikeListActive) ? "blur" : ""}`}>
      <svg
        aria-label="Close"
        color="#262626"
        fill="#262626"
        height="18"
        role="img"
        viewBox="0 0 24 24"
        width="18"
        onClick={handleCloseFullPost}
        style={{
          position: "fixed", right: "10px", top: "10px", fontSize: "30px", width: "30px", height: "30px",
        }}
      >
        <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="#262626" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <line fill="none" stroke="#262626" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354" />
      </svg>
      <div className="fullpost-container">
        <div>
          <img onLoad={handleImageSize} className="post-picture" src={fullPostInfo ? fullPostInfo.imageURL : IMAGE_PLACEHOLDER_URL} alt="" style={{ objectFit: ((!fullPostInfo) || (fullPostInfo.imageURL && toResize)) ? "cover" : "contain" }} />
        </div>

        <div className="post-info">
          <div className="user-profile">
            {/* eslint-disable-next-line */}
            <img className="user-avatar" src={fullPostInfo ? fullPostInfo.author.photoURL : IMAGE_PLACEHOLDER_URL} alt="" style={{ marginRight: "15px" }} onClick={() => { handleVisitProfile(fullPostInfo.author._id); }} />
            {/* eslint-disable-next-line */}
            <span className="username bold medium" onClick={() => { handleVisitProfile(fullPostInfo.author._id); }}>{fullPostInfo && fullPostInfo.author.username}</span>
          </div>
          <div className="comment-section">
            {fullPostInfo && fullPostInfo.postCaption && (
              <div className="post-caption">
                {/* eslint-disable-next-line */}
                <img className="user-avatar" src={fullPostInfo.author.photoURL} alt="" style={{ marginRight: "15px" }} onClick={() => { handleVisitProfile(fullPostInfo.author._id); }} />
                <div>
                  {/* eslint-disable-next-line */}
                  <span className="username bold medium" onClick={() => { handleVisitProfile(fullPostInfo.author._id); }}>{fullPostInfo.author.username}</span>
                  {" "}
                  <span className="medium">{fullPostInfo.postCaption}</span>
                  <small style={{ display: "block", marginTop: "10px" }} className="grey small">{computeHowLongAgo(fullPostInfo.createdAt)}</small>
                </div>
              </div>
            )}

            {fullPostInfo && fullPostInfo.comments.map((comment) => (
              <div className="post-comment" key={comment._id}>
                {/* eslint-disable-next-line */}
                <img src={comment.commenter.photoURL} alt="" className="user-avatar" style={{ marginRight: "15px" }} onClick={() => { handleVisitProfile(comment.commenter._id); }} />
                <div>
                  {/* eslint-disable-next-line */}
                  <span className="username bold medium" onClick={() => { handleVisitProfile(comment.commenter._id); }}>
                    {comment.commenter.username}
                  </span>
                  {" "}
                  <span className="user-comment medium">{comment.content}</span>
                  {" "}
                  <small className="grey" style={{ display: "block", marginTop: "10px" }}>{computeHowLongAgo(comment.createdAt)}</small>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 0", display: "flex", gap: "20px" }} className="post-btns">
            {(fullPostInfo && fullPostInfo.likes.findIndex((like) => `${like._id}` === userData._id) === -1) ? (
              <svg onClick={handleLikePost} color="currentColor" fill="currentColor" height="24" width="24">
                <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938m0-2a6.04 6.04 0 00-4.797 2.127 6.052 6.052 0 00-4.787-2.127A6.985 6.985 0 00.5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 003.518 3.018 2 2 0 002.174 0 45.263 45.263 0 003.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 00-6.708-7.218z" />
              </svg>
            ) : <svg onClick={handleLikePost} color="#ed4956" fill="#ed4956" height="24" role="img" viewBox="0 0 48 48" width="24"><path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z" /></svg>}

            <svg onClick={() => { textareaRef.current.focus(); }} className="comment" color="currentColor" fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
              <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
            </svg>

            <svg onClick={() => { setNotImplementedError("Sorry! This feature is not yet implemented. "); }} className="share" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
              <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083" />
              <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
            </svg>

            <div style={{ marginLeft: "auto", position: "relative" }}>
              <svg height="24" width="24" fill="currentColor" color="currentColor" viewBox="0 0 24 24" aria-hidden="true" onClick={() => { setIsDropdownActive(!isDropdownActive); }}>
                <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
              {(isDropdownActive && fullPostInfo.author._id === userData._id) ? (
                <div className="dropdown" style={{ width: "150px", top: "-100px", right: "-50px" }}>
                  <div onClick={() => { handleDeletePost(fullPostInfo.author._id, fullPostInfo._id, fullPostInfo.filePath); }}>
                    <i className="fa-solid fa-trash-can" />
                    {" "}
                    Delete
                  </div>
                  <div onClick={() => { navigator.clipboard.writeText(window.location.href); setIsDropdownActive(false); setClipboardMessage("Saved to clipboard!"); }}>
                    <i className="fa-solid fa-link" />
                    {" "}
                    Copy link
                  </div>
                </div>
              ) : (isDropdownActive && fullPostInfo.author._id !== userData._id) ? (
                <div className="dropdown" style={{ width: "150px", top: "-50px", right: "-50px" }}>
                  <div onClick={() => { navigator.clipboard.writeText(window.location.href); setIsDropdownActive(false); setClipboardMessage("Saved to clipboard!"); }}>
                    <i className="fa-solid fa-link" />
                    {" "}
                    Copy link
                  </div>
                </div>
              ) : <div />}
            </div>
          </div>

          {fullPostInfo && (fullPostInfo.likes.length > 10 ? (
            <div className="post-likes medium" onClick={() => { handleViewLikeList(fullPostInfo.likes); }}>
              Liked by
              {" "}
              <span className="username medium bold">{fullPostInfo.likes[fullPostInfo.likes.length - 1].username}</span>
              {" "}
              and
              {" "}
              <span className="medium bold">
                {fullPostInfo.likes.length - 1}
                {" "}
                others
              </span>
            </div>
          )
            : (
              <div className="post-likes medium bold" onClick={() => { handleViewLikeList(fullPostInfo.likes); }}>
                {fullPostInfo.likes.length}
                {" "}
                likes
              </div>
            ))}

          <form onSubmit={handleSubmitPostComment} className="post-comment-box">
            <textarea ref={textareaRef} onChange={(e) => { setPostComments({ ...postComments, [fullPostInfo._id]: e.target.value }); }} onKeyDown={(e) => { if (e.key === "Enter") handleSubmitPostComment(e); }} type="text" placeholder="Add a comment..." value={(fullPostInfo && postComments[fullPostInfo._id]) || ""} />
            <span onClick={handleSubmitPostComment} className="submit-btn" type="submit">Post</span>
          </form>
        </div>
      </div>

      {notImplementedError && <Snackbar snackBarMessage={notImplementedError} setSnackBarMessage={setNotImplementedError} />}
      {submitCommentError && <Snackbar snackBarMessage={submitCommentError} setSnackBarMessage={setSubmitCommentError} />}
      {clipboardMessage && <Snackbar snackBarMessage={clipboardMessage} setSnackBarMessage={setClipboardMessage} />}
    </div>
  );
}

export default FullPost;
