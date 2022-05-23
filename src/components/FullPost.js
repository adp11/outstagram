import { getAuth } from "firebase/auth";
import {
  arrayUnion, doc, getDoc, serverTimestamp, updateDoc,
} from "firebase/firestore";
import React, {
  useEffect, useContext, useState, useRef,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import uniqid from "uniqid";
import { db } from "../firebase";
import UserContext from "./Contexts/UserContext";
import Snackbar from "./Snackbar";

const DUMMY_AVATAR_URL = "https://dummyimage.com/200x200/979999/000000.png&text=...";

function FullPost() {
  const {
    userData, newsfeed, setIsFullPostActive, fullPostIndex, setFullPostIndex, beforeFullPost, setBeforeFullPost, fullPostInfo, setFullPostInfo,
  } = useContext(UserContext);
  const navigate = useNavigate();

  // Prevent user from writing comments on multiple posts on their newsfeed
  const [postComments, setPostComments] = useState({});
  const [submitCommentError, setSubmitCommentError] = useState(null);

  // Conditional rendering
  const [authorUsername, setAuthorUsername] = useState(null);
  const [authorPhotoURL, setAuthorPhotoURL] = useState(null);
  const [postPictureURL, setPostPictureURL] = useState(null);
  const [postCaption, setPostCaption] = useState(null);
  const [postCreationTime, setPostCreationTime] = useState(null);
  const [fromWhich, setFromWhich] = useState(null);
  const textareaRef = useRef();

  function handleCloseFullPost() {
    if (beforeFullPost.profile) {
      navigate(`/uid_${getAuth().currentUser.uid}`);
      setFullPostInfo(null);
    } else {
      navigate("/");
      setFullPostIndex(null);
    }
    setIsFullPostActive(false);
    setBeforeFullPost({
      profile: false,
      newsfeed: false,
    });
  }

  async function updatePostSnippets(type, postInfo) {
    const userRef = doc(db, `users/${postInfo.authorId}`);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const tempData = docSnap.data();
      const snippetPos = tempData.postSnippets.findIndex((snippet) => snippet.postId === postInfo.postId);
      if (type === "unlike") {
        tempData.postSnippets[snippetPos].totalLikes -= 1;
        await updateDoc(userRef, {
          postSnippets: tempData.postSnippets,
        });
      } else if (type === "like") {
        tempData.postSnippets[snippetPos].totalLikes += 1;
        await updateDoc(userRef, {
          postSnippets: tempData.postSnippets,
        });
      } else if (type === "comment") {
        tempData.postSnippets[snippetPos].totalComments += 1;
        await updateDoc(userRef, {
          postSnippets: tempData.postSnippets,
        });
      }
    }
  }

  // Quick dirty workaround with [cmtId] since array elements are not supported with serverTimestamp()
  async function handleSubmitPostComment(e) {
    e.preventDefault();
    let postInfo;
    let newComments;

    if (beforeFullPost.newsfeed) {
      postInfo = newsfeed[fullPostIndex];
    } else {
      postInfo = fullPostInfo;
    }

    if (postComments[postInfo.postId] && postComments[postInfo.postId].trim()) {
      const postRef = doc(db, `users/${postInfo.authorId}/posts/${postInfo.postId}`);
      const cmtId = uniqid();
      newComments = postInfo.comments.concat({
        sourceId: getAuth().currentUser.uid,
        sourcePhotoURL: userData.photoURL,
        sourceUsername: userData.username,
        sourceComment: postComments[postInfo.postId],
        sourceCommentTime: cmtId,
      });
      await updateDoc(postRef, {
        comments: newComments,
        [cmtId]: serverTimestamp(),
      });
      setPostComments({ ...postComments, [postInfo.postId]: "" });
      updatePostSnippets("comment", postInfo);

      if (beforeFullPost.profile) {
        setFullPostInfo({ ...fullPostInfo, comments: newComments });
      }
    } else {
      setSubmitCommentError("Posting empty comments error");
    }
  }

  async function handleLikePost() { // toggle
    let postInfo;
    let newLikes;
    // if FullPost comes from Newsfeed, then postInfo is based on index of that post in Newsfeed
    // if FullPost comes from Profile, then postInfo is based on postId (then fullPostInfo)
    if (beforeFullPost.newsfeed) {
      postInfo = newsfeed[fullPostIndex];
    } else {
      postInfo = fullPostInfo;
    }
    const postRef = doc(db, `users/${postInfo.authorId}/posts/${postInfo.postId}`);
    const targetIndex = postInfo.likes.findIndex((like) => like.sourceId === getAuth().currentUser.uid);
    if (targetIndex !== -1) {
      newLikes = postInfo.likes.filter((like, idx) => idx !== targetIndex);
      await updateDoc(postRef, {
        likes: newLikes,
      });
      updatePostSnippets("unlike", postInfo);
      // FullPost coming from Profile doesn't get realtime update (newsfeed[fullPostIndex] is auto-updated) --> manual update by setFullPostInfo()
      if (beforeFullPost.profile) {
        setFullPostInfo({ ...fullPostInfo, likes: newLikes });
      }
    } else {
      newLikes = postInfo.likes.concat({
        sourceId: getAuth().currentUser.uid,
        sourcePhotoURL: userData.photoURL,
        sourceUsername: userData.username,
        sourceDisplayname: userData.displayName,
      });
      await updateDoc(postRef, {
        likes: newLikes,
      });
      updatePostSnippets("like", postInfo);
      if (beforeFullPost.profile) {
        setFullPostInfo({ ...fullPostInfo, likes: newLikes });
      }
    }
  }

  // setFromWhich as a result of realtime update in newsfeed
  useEffect(() => {
    setFromWhich(newsfeed[fullPostIndex]);
  }, [newsfeed]);

  // setFromWhich as a result of change in FullPostInfo
  useEffect(() => {
    setFromWhich(fullPostInfo);
  }, [fullPostInfo]);

  useEffect(() => {
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
    if (beforeFullPost.newsfeed && fullPostIndex !== null) {
      setAuthorUsername(newsfeed[fullPostIndex].authorUsername);
      setAuthorPhotoURL(newsfeed[fullPostIndex].authorPhotoURL);
      setPostPictureURL(newsfeed[fullPostIndex].imageURL);
      setPostCaption(newsfeed[fullPostIndex].postCaption);
      setPostCreationTime(newsfeed[fullPostIndex].creationTime.seconds);
      setFromWhich(newsfeed[fullPostIndex]);
    } else if (beforeFullPost.profile && fullPostInfo !== null) {
      setAuthorUsername(fullPostInfo.authorUsername);
      setAuthorPhotoURL(fullPostInfo.authorPhotoURL);
      setPostPictureURL(fullPostInfo.imageURL);
      setPostCaption(fullPostInfo.postCaption);
      setPostCreationTime(fullPostInfo.creationTime.seconds);
      setFromWhich(fullPostInfo);
    }
  }, [fullPostInfo, fullPostIndex]);

  return (
    <div className="FullPost">
      {/* eslint-disable-next-line */}
      <i
        onClick={handleCloseFullPost}
        className="fa-solid fa-xmark"
        style={{
          position: "fixed", left: "97%", top: "2%", fontSize: "30px",
        }}
      />
      <div className="fullpost-container">
        <div>
          <img className="post-picture" src={postPictureURL} alt="" style={{ objectFit: "contain" }} />
        </div>

        <div className="post-info">
          <div className="user-profile">
            <img className="user-avatar" src={authorPhotoURL} alt="" style={{ marginRight: "15px" }} />
            <span className="username bold medium">{authorUsername}</span>
            <span className="medium bold" style={{ color: "#0095f6", marginLeft: "10px" }}>Following</span>
          </div>
          <div className="comment-section">
            {postCaption && (
            <div className="post-caption">
              <img className="user-avatar" src={authorPhotoURL} alt="" style={{ marginRight: "15px" }} />
              <div>
                <span className="username bold medium">{authorUsername}</span>
                {" "}
                <span className="medium">{postCaption}</span>
                <small style={{ display: "block", marginTop: "10px" }} className="grey small">{postCreationTime}</small>
              </div>
            </div>
            )}

            {fromWhich && fromWhich.comments.map((comment) => (
              <div className="post-comment" key={comment.sourceCommentTime}>
                <img src={comment.sourcePhotoURL} alt="" className="user-avatar" style={{ marginRight: "15px" }} />
                <div>
                  <span className="username bold medium">
                    {comment.sourceUsername}
                  </span>
                  {" "}
                  <span className="user-comment medium">{comment.sourceComment}</span>
                  {" "}
                  <small className="grey" style={{ display: "block", marginTop: "10px" }}>{postCreationTime}</small>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 0", display: "flex", gap: "20px" }} className="post-btns">
            <svg onClick={handleLikePost} className="like" color="#262626" fill="#262626" height="24" width="24">
              <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938m0-2a6.04 6.04 0 00-4.797 2.127 6.052 6.052 0 00-4.787-2.127A6.985 6.985 0 00.5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 003.518 3.018 2 2 0 002.174 0 45.263 45.263 0 003.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 00-6.708-7.218z" />

            </svg>
            <svg onClick={() => { textareaRef.current.focus(); }} className="comment" color="black" fill="#8e8e8e" height="24" viewBox="0 0 24 24" width="24">
              <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />

            </svg>
            <svg className="share" color="black" fill="#8e8e8e" height="24" role="img" viewBox="0 0 24 24" width="24">
              <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083" />
              <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <svg height="24" width="24" style={{ marginLeft: "auto" }} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />

            </svg>
          </div>

          {fromWhich && (fromWhich.likes.length > 0 ? (
            <div className="post-likes medium">
              Liked by
              {" "}
              <span className="username medium bold">{fromWhich.likes[fromWhich.likes.length - 1].sourceUsername}</span>
              {" "}
              and
              {" "}
              <span className="medium bold">
                {fromWhich.likes.length - 1}
                {" "}
                others
              </span>
            </div>
          )
            : (
              <div className="post-likes medium bold">
                {fromWhich.likes.length}
                {" "}
                likes
              </div>
            ))}

          <form onSubmit={handleSubmitPostComment} className="post-comment-box">
            <textarea ref={textareaRef} onChange={(e) => { setPostComments({ ...postComments, [fromWhich.postId]: e.target.value }); }} type="text" placeholder="Add a comment..." value={(fromWhich && postComments[fromWhich.postId]) || ""} />
            <span onClick={handleSubmitPostComment} className="submit-btn" type="submit">Post</span>
          </form>

        </div>
      </div>
      {submitCommentError && <Snackbar snackBarMessage={submitCommentError} setSnackBarMessage={setSubmitCommentError} />}
    </div>
  );
}

export default FullPost;
