import { getAuth } from "firebase/auth";
import {
  arrayUnion, doc, serverTimestamp, updateDoc,
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import uniqid from "uniqid";
import { db } from "../firebase";
import UserContext from "./Contexts/UserContext";
import Snackbar from "./Snackbar";

function Newsfeed() {
  const {
    newsfeed, setIsFullPostActive, setBeforeFullPost, scrollY, userData,
  } = useContext(UserContext);
  const [submitCommentError, setSubmitCommentError] = useState(null);

  // Prevent user from writing comments on multiple posts on their newsfeed
  const [postComments, setPostComments] = useState({});

  function handleViewAllComments() {
    scrollY.current = window.scrollY;
    setIsFullPostActive(true);
    setBeforeFullPost({
      newsfeed: true,
      profile: false,
    });
  }

  useEffect(() => {
    console.log(newsfeed, "check newsfeed in Newsfeed.js after update 'modified'");
  }, [newsfeed]);

  // Quick dirty workaround with [cmtId] since array elements are not supported with serverTimestamp()
  async function handleSubmitPostComment(e, index) {
    e.preventDefault();
    const postInfo = newsfeed[index];
    if (postComments[postInfo.postId] && postComments[postInfo.postId].trim()) {
      const postRef = doc(db, `users/${postInfo.authorId}/posts/${postInfo.postId}`);
      const cmtId = uniqid();
      await updateDoc(postRef, {
        comments: arrayUnion({
          sourceId: getAuth().currentUser.uid,
          sourcePhotoUrl: userData.photoURL,
          sourceUsername: userData.username,
          sourceComment: postComments[postInfo.postId],
          sourceCommentTime: cmtId,
        }),
        [cmtId]: serverTimestamp(),
      });
      setPostComments({ ...postComments, [postInfo.postId]: "" });
    } else {
      setSubmitCommentError("Posting empty comments error");
    }
  }

  async function handleLikePost(index) { // toggle
    // console.log(`newsfeed: ${newsfeed[0].postId}`);
    // console.log("just cliked like", `post index: ${index}`);
    const postInfo = newsfeed[index];
    // console.log(postInfo, "postInfo");
    const postRef = doc(db, `users/${postInfo.authorId}/posts/${postInfo.postId}`);
    const targetIndex = postInfo.likes.findIndex((like) => like.sourceId === getAuth().currentUser.uid);
    // console.log(targetIndex, "targetIndex", getAuth().currentUser.uid, "uid");
    if (targetIndex !== -1) {
      await updateDoc(postRef, {
        likes: postInfo.likes.filter((like, idx) => idx !== targetIndex),
      });
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion({
          sourceId: getAuth().currentUser.uid,
          sourcePhotoUrl: userData.photoURL,
          sourceUsername: userData.username,
          sourceDisplayname: userData.displayName,
        }),
      });
    }
  }

  return (
    <div className="Newsfeed">
      <div className="newsfeed-container">
        {(newsfeed.length > 0) ? newsfeed.map((post, index) => (
          <div className="NewsfeedPost" key={post.postId}>
            <div className="user-profile">
              <img className="user-avatar" src={post.authorPhotoUrl} alt="" />
              <span className="username bold medium">{post.authorUsername}</span>
            </div>
            <div className="post-picture">
              <img src={post.imageUrl} alt="" style={{ width: "100%", height: "auto" }} />
            </div>
            <div className="post-btns">
              <svg onClick={() => { handleLikePost(index); }} className="like" color="#262626" fill="#262626" height="24" width="24">
                <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938m0-2a6.04 6.04 0 00-4.797 2.127 6.052 6.052 0 00-4.787-2.127A6.985 6.985 0 00.5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 003.518 3.018 2 2 0 002.174 0 45.263 45.263 0 003.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 00-6.708-7.218z" />
              </svg>

              <Link to={`p/${post.postId}`} onClick={handleViewAllComments}>
                <svg className="comment" color="black" fill="#8e8e8e" height="24" viewBox="0 0 24 24" width="24">
                  <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </Link>

              <svg className="share" color="black" fill="#8e8e8e" height="24" role="img" viewBox="0 0 24 24" width="24">
                <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083" />
                <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            {post.likes.length > 0 ? (
              <div className="post-likes medium">
                Liked by
                {" "}
                <span className="username medium bold">{post.likes[post.likes.length - 1].sourceUsername}</span>
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
                <div className="post-likes medium bold">
                  {post.likes.length}
                  {" "}
                  likes
                </div>
              )}
            <div className="post-caption medium">
              <span className="username bold medium">{post.authorUsername}</span>
              {" "}
              Another day in paradise… And it’s only Monday ☠️☠️.
            </div>
            <Link to={`p/${post.postId}`} onClick={handleViewAllComments}>
              <div className="post-all-comments grey medium">View all 10 comments</div>
            </Link>
            <div className="comment-snippet">
              <div className="comment medium">
                <span className="username bold medium">thaonhi.le</span>
                {" "}
                Comment 1
              </div>
              <div className="comment medium">
                <span className="username bold medium">random.username</span>
                {" "}
                Comment 2
              </div>
            </div>

            <div className="grey extrasmall" style={{ margin: "0 20px" }}>{post.creationTime.seconds}</div>

            <form onSubmit={(e) => { handleSubmitPostComment(e, index); }} className="post-comment-box">
              <textarea onChange={(e) => { setPostComments({ ...postComments, [post.postId]: e.target.value }); }} type="text" placeholder="Add a comment..." value={postComments[post.postId] || ""} />
              <span onClick={(e) => { handleSubmitPostComment(e, index); }} className="submit-btn" type="submit">Post</span>
            </form>
          </div>
        ))
          : (
            <div style={{ display: "grid", placeItems: "center", height: "calc(100vh - 90px)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img src={`${window.location.origin}/images/no-newsfeed.jpg`} alt="No Newsfeed" style={{ width: "70px", height: "auto" }} />
                <p className="bold">Follow people to explore Instagram.</p>
              </div>
            </div>
          )}
      </div>
      {submitCommentError && <Snackbar snackBarMessage={submitCommentError} setSnackBarMessage={setSubmitCommentError} />}
    </div>
  );
}

export default Newsfeed;
