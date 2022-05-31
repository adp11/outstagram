import { getAuth } from "firebase/auth";
import {
  addDoc,
  arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import React, {
  useEffect, useContext, useState, useRef, useMemo,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import uniqid from "uniqid";
import { db, storage } from "../firebase";
import { computeHowLongAgo } from "../utils";
import UserContext from "./Contexts/UserContext";
import Snackbar from "./Snackbar";

const DUMMY_AVATAR_URL = "https://dummyimage.com/200x200/979999/000000.png&text=...";

function FullPost() {
  const {
    userData, visitedUserData, newsfeed, setIsFullPostActive, fullPostIndex, setFullPostIndex, beforeFullPost, setBeforeFullPost, fullPostInfo, setFullPostInfo, setVisitedUserData, setAllUserData, allUserData, setUserData, setIsLikeListActive, setLikeListInfo, scrollY, isLikeListActive, setIsPostPageNotFoundActive, abruptPostView, isFullPostActive, setAbruptPostView,
  } = useContext(UserContext);
  const navigate = useNavigate();
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const [toResize, setToResize] = useState(false);

  // Prevent user from writing comments on multiple posts on their newsfeed
  const [postComments, setPostComments] = useState({});
  const [submitCommentError, setSubmitCommentError] = useState(null);

  const [clipboardMessage, setClipboardMessage] = useState(null);

  console.log(isFullPostActive, "isFullPostActive");
  // Conditional rendering
  const [componentVars, setComponentVars] = useState({
    authorId: "",
    authorUsername: "",
    authorPhotoURL: "",
    postPictureURL: "",
    filePath: "",
    postCaption: "",
    postCreationTime: "",
    postCmts: [],
    postLikes: [],
    postId: "",
    fromWhich: null,
  });
  const textareaRef = useRef();

  async function updateNotifications({ authorId, postId, imageURL }, notificationType, commentContent = null) {
    const collectionPath = `users/${authorId}/notifications`;
    // update to Notifications subcollection
    const notifRef = await addDoc(collection(db, collectionPath), {
      creationTime: serverTimestamp(),
    });

    if (notificationType === "like") {
      await updateDoc(notifRef, {
        notifId: uniqid(),
        sourceDisplayname: userData.displayName,
        sourceId: userData.uid,
        sourceUsername: userData.username,
        sourcePhotoURL: userData.photoURL,
        type: "like",
        sourceAuthorId: authorId,
        sourcePostId: postId,
        sourcePostPictureURL: imageURL,
      });
    } else {
      await updateDoc(notifRef, {
        notifId: uniqid(),
        sourceDisplayname: userData.displayName,
        sourceId: userData.uid,
        sourceUsername: userData.username,
        sourcePhotoURL: userData.photoURL,
        type: "comment",
        content: commentContent,
        sourceAuthorId: authorId,
        sourcePostId: postId,
        sourcePostPictureURL: imageURL,
      });
    }

    // update to totalNotifs snippet
    const docRef = doc(db, `users/${authorId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const tempTotalNotifs = docSnap.data().totalNotifs + 1;
      await updateDoc(docRef, {
        totalNotifs: tempTotalNotifs,
      });
    }
  }

  function handleViewLikeList(postLikes) {
    scrollY.current = window.scrollY;
    setIsLikeListActive(true);
    setLikeListInfo({
      postLikes,
      fromFullPost: true,
    });
  }

  function handleCloseFullPost(redirect = true) {
    setAbruptPostView(false);
    setIsFullPostActive(false);
    if (beforeFullPost.selfProfile && redirect) {
      navigate(`/${userData.uid}`);
      setFullPostInfo(null);
    } else if (beforeFullPost.visitedProfile && redirect) {
      navigate(`/${visitedUserData.uid}`);
      setFullPostInfo(null);
    } else {
      navigate("/");
      setFullPostIndex(null);
    }

    setBeforeFullPost({
      selfProfile: false,
      visitedProfile: false,
      newsfeed: false,
    });
  }

  async function handleDeletePost(authorId, postId, filePath) {
    // delete in Firestore db
    setIsDropdownActive(false);
    handleCloseFullPost();
    await deleteDoc(doc(db, `users/${authorId}/posts/${postId}`));
    console.log("deleting ...");

    // delete in Storage
    const imageRef = ref(storage, filePath);
    deleteObject(imageRef).then(() => {
      // File deleted successfully (could've set a snackbar for visual feedback)
    }).catch((error) => {
      // Uh-oh, an error occurred!
    });

    // update post snippets
    const tempUserData = { ...userData };
    tempUserData.totalPosts -= 1;
    tempUserData.postSnippets = tempUserData.postSnippets.filter((postSnippet) => postSnippet.postId !== postId);
    setUserData(tempUserData);
    console.log(tempUserData, "tempUserData");
    const docRef = doc(db, `users/${authorId}`);
    await setDoc(docRef, tempUserData);
  }

  async function updatePostSnippets(type, postInfo) {
    const userRef = doc(db, `users/${postInfo.authorId}`);
    const docSnap = await getDoc(userRef);
    let tempData;
    if (docSnap.exists()) {
      tempData = docSnap.data();
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

    // UI rerender for postSnippets in userData/allUserData
    if (beforeFullPost.selfProfile || (beforeFullPost.newsfeed && postInfo.authorId === userData.uid)) {
      setUserData(tempData);
      console.log(tempData, "tempData in self");
    } else if (beforeFullPost.visitedProfile) {
      setVisitedUserData(tempData);
      console.log(tempData, "tempData in visited");
    } else if (beforeFullPost.newsfeed && postInfo.authorId !== userData.uid) {
      const tempAllUserData = [...allUserData];
      const userPos = allUserData.findIndex((user) => user.uid === postInfo.authorId);
      console.log(userPos, "userPos");
      tempAllUserData.splice(userPos, 1, tempData);
      console.log(tempAllUserData, "tempAllUserData");
      setAllUserData(tempAllUserData);
    }
  }

  // Quick workaround with [cmtId] since array elements are not supported with serverTimestamp()
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
      const commentContent = postComments[postInfo.postId];
      newComments = postInfo.comments.concat({
        sourceId: userData.uid,
        sourcePhotoURL: userData.photoURL,
        sourceUsername: userData.username,
        sourceComment: commentContent,
        sourceCommentTime: cmtId,
      });
      await updateDoc(postRef, {
        [cmtId]: serverTimestamp(),
        comments: newComments,
      });
      setPostComments({ ...postComments, [postInfo.postId]: "" });
      updatePostSnippets("comment", postInfo);

      if (beforeFullPost.selfProfile || beforeFullPost.visitedProfile) {
        const docSnap = await getDoc(postRef);
        if (docSnap.exists()) {
          setFullPostInfo(docSnap.data());
        }
        // setFullPostInfo({ ...fullPostInfo, comments: newComments }) won't work bc of serverTimestamp()
      }
      if (postInfo.authorId !== userData.uid) {
        updateNotifications(postInfo, "comment", commentContent);
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
    const targetIndex = postInfo.likes.findIndex((like) => like.sourceId === userData.uid);
    if (targetIndex !== -1) {
      newLikes = postInfo.likes.filter((like, idx) => idx !== targetIndex);
      await updateDoc(postRef, {
        likes: newLikes,
      });
      updatePostSnippets("unlike", postInfo);
      // FullPost coming from Profile doesn't get realtime update (newsfeed[fullPostIndex] is auto-updated) --> manual update by setFullPostInfo()
      if (beforeFullPost.selfProfile || beforeFullPost.visitedProfile) {
        setFullPostInfo({ ...fullPostInfo, likes: newLikes });
      }
    } else {
      newLikes = postInfo.likes.concat({
        sourceId: userData.uid,
        sourcePhotoURL: userData.photoURL,
        sourceUsername: userData.username,
        sourceDisplayname: userData.displayName,
      });
      await updateDoc(postRef, {
        likes: newLikes,
      });
      updatePostSnippets("like", postInfo);
      if (beforeFullPost.selfProfile || beforeFullPost.visitedProfile) {
        setFullPostInfo({ ...fullPostInfo, likes: newLikes });
      }
      if (postInfo.authorId !== userData.uid) {
        updateNotifications(postInfo, "like");
      }
    }
  }

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
    async function helper(document) {
      const paramsPostId = window.location.pathname.substring(3); // window.href.pathname = "/p/:postId"
      const q = query(collection(db, `users/${document.data().uid}/posts`), where("postId", "==", paramsPostId));
      const qSnapshot = await getDocs(q);
      console.log(qSnapshot.size, "qSnapshot.size");
      if (qSnapshot.size === 0) {
        return false;
      }
      qSnapshot.forEach((document2) => {
        const {
          authorId, authorUsername, authorPhotoURL, imageURL, filePath, postCaption, creationTime, comments, likes, postId,
        } = document2.data();
        setComponentVars({
          authorId,
          authorUsername,
          authorPhotoURL,
          postPictureURL: imageURL,
          filePath,
          postCaption,
          postCreationTime: computeHowLongAgo(creationTime.seconds),
          postCmts: comments,
          postLikes: likes,
          postId,
          fromWhich: document2.data(),
        });
      });
      return true;
    }

    async function handleVisitFullPost() {
      let postIdFound = false;
      let count = 0;
      const querySnapshot = await getDocs(collection(db, "users"));
      querySnapshot.forEach(async (document) => {
        const result = await helper(document);
        count += 1;
        if (result) {
          // console.log("success");
          postIdFound = true;
        } else if (!result && count === querySnapshot.size && !postIdFound) {
          // console.log("Display 404");
          setIsFullPostActive(false);
          navigate(window.location.pathname);
          setIsPostPageNotFoundActive(true);
        }
      });
    }

    console.log("componentVars triggered");
    if (beforeFullPost.newsfeed && fullPostIndex !== null) {
      setComponentVars({
        authorId: newsfeed[fullPostIndex].authorId,
        authorUsername: newsfeed[fullPostIndex].authorUsername,
        authorPhotoURL: newsfeed[fullPostIndex].authorPhotoURL,
        postPictureURL: newsfeed[fullPostIndex].imageURL,
        filePath: newsfeed[fullPostIndex].filePath,
        postCaption: newsfeed[fullPostIndex].postCaption,
        postCreationTime: computeHowLongAgo(newsfeed[fullPostIndex].creationTime.seconds),
        postCmts: newsfeed[fullPostIndex].comments,
        postLikes: newsfeed[fullPostIndex].likes,
        postId: newsfeed[fullPostIndex].postId,
        fromWhich: newsfeed[fullPostIndex],
      });
    } else if ((beforeFullPost.selfProfile || beforeFullPost.visitedProfile) && fullPostInfo !== null) {
      setComponentVars({
        authorId: fullPostInfo.authorId,
        authorUsername: fullPostInfo.authorUsername,
        authorPhotoURL: fullPostInfo.authorPhotoURL,
        postPictureURL: fullPostInfo.imageURL,
        filePath: fullPostInfo.filePath,
        postCaption: fullPostInfo.postCaption,
        postCreationTime: computeHowLongAgo(fullPostInfo.creationTime.seconds),
        postCmts: fullPostInfo.comments,
        postLikes: fullPostInfo.likes,
        postId: fullPostInfo.postId,
        fromWhich: fullPostInfo,
      });
    } else if (abruptPostView) {
      handleVisitFullPost();
    }
  }, [fullPostInfo, newsfeed[fullPostIndex]]);

  const {
    authorId, authorUsername, authorPhotoURL, postPictureURL, filePath, postCaption, postCreationTime, postCmts, postLikes, postId, fromWhich,
  } = componentVars;

  // const providerValue = useMemo(() => handleCloseFullPost());

  async function handleVisitProfile(uid) {
    handleCloseFullPost(false); // prevent nagivate() 2 times
    console.log("visiting profile", uid);
    const docRef = doc(db, `users/${uid}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      navigate(`/${uid}`);
      setVisitedUserData(docSnap.data());
    }
  }

  function handleImageSize({ target: img }) {
    console.log(img.naturalHeight, "img.naturalHeight");
    console.log(img.naturalWidth, "img.naturalWidth");
    if (Math.abs(img.naturalHeight - img.naturalWidth) < 100) {
      setToResize(true);
    }
  }

  return (
    <div className={`FullPost ${(isLikeListActive) ? "blur" : ""}`}>
      {/* eslint-disable-next-line */}
      <img src={`${window.location.origin}/images/x-mark.png`} style={{ position: "fixed", left: "97%", top: "2%", fontSize: "30px", width: "30px", height: "30px" }} onClick={handleCloseFullPost}></img>

      <div className="fullpost-container">
        <div>
          <img onLoad={handleImageSize} className="post-picture" src={postPictureURL} alt="" style={{ objectFit: toResize ? "cover" : "contain" }} />
        </div>

        <div className="post-info">
          <div className="user-profile">
            <img className="user-avatar" src={authorPhotoURL} alt="" style={{ marginRight: "15px" }} onClick={() => { handleVisitProfile(authorId); }} />
            <span className="username bold medium" onClick={() => { handleVisitProfile(authorId); }}>{authorUsername}</span>
            {/* <span className="medium bold" style={{ color: "#0095f6", marginLeft: "10px" }}>Following</span> */}
          </div>
          <div className="comment-section">
            {postCaption && (
              <div className="post-caption">
                <img className="user-avatar" src={authorPhotoURL} alt="" style={{ marginRight: "15px" }} onClick={() => { handleVisitProfile(authorId); }} />
                <div>
                  <span className="username bold medium" onClick={() => { handleVisitProfile(authorId); }}>{authorUsername}</span>
                  {" "}
                  <span className="medium">{postCaption}</span>
                  <small style={{ display: "block", marginTop: "10px" }} className="grey small">{postCreationTime}</small>
                </div>
              </div>
            )}

            {postCmts.map((comment) => (
              <div className="post-comment" key={comment.sourceCommentTime}>
                <img src={comment.sourcePhotoURL} alt="" className="user-avatar" style={{ marginRight: "15px" }} onClick={() => { handleVisitProfile(comment.sourceId); }} />
                <div>
                  <span className="username bold medium" onClick={() => { handleVisitProfile(comment.sourceId); }}>
                    {comment.sourceUsername}
                  </span>
                  {" "}
                  <span className="user-comment medium">{comment.sourceComment}</span>
                  {" "}
                  <small className="grey" style={{ display: "block", marginTop: "10px" }}>{(fromWhich && fromWhich[comment.sourceCommentTime]) && computeHowLongAgo(fromWhich[comment.sourceCommentTime].seconds)}</small>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 0", display: "flex", gap: "20px" }} className="post-btns">
            {(postLikes.findIndex((like) => `${like.sourceId}` === userData.uid) === -1) ? (
              <svg onClick={handleLikePost} color="#262626" fill="#262626" height="24" width="24">
                <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938m0-2a6.04 6.04 0 00-4.797 2.127 6.052 6.052 0 00-4.787-2.127A6.985 6.985 0 00.5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 003.518 3.018 2 2 0 002.174 0 45.263 45.263 0 003.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 00-6.708-7.218z" />
              </svg>
            ) : <svg onClick={handleLikePost} color="#ed4956" fill="#ed4956" height="24" role="img" viewBox="0 0 48 48" width="24"><path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z" /></svg>}

            <svg onClick={() => { textareaRef.current.focus(); }} className="comment" color="black" fill="#8e8e8e" height="24" viewBox="0 0 24 24" width="24">
              <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
            </svg>

            <svg className="share" color="black" fill="#8e8e8e" height="24" role="img" viewBox="0 0 24 24" width="24">
              <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083" />
              <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
            </svg>

            <div style={{ marginLeft: "auto", position: "relative" }}>
              <svg height="24" width="24" viewBox="0 0 24 24" aria-hidden="true" onClick={() => { setIsDropdownActive(!isDropdownActive); }}>
                <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
              {(isDropdownActive && authorId === userData.uid) ? (
                <div className="dropdown" style={{ width: "150px", top: "-100px", right: "-50px" }}>
                  <div onClick={() => { console.log("is about to delete"); handleDeletePost(authorId, postId, filePath); }}>
                    <i className="fa-solid fa-trash-can" />
                    {" "}
                    Delete
                  </div>
                  <div onClick={() => { console.log("clipped"); navigator.clipboard.writeText(window.location.href); setIsDropdownActive(false); setClipboardMessage("Saved to clipboard!"); }}>
                    <i className="fa-solid fa-link" />
                    {" "}
                    Copy link
                  </div>
                </div>
              ) : (isDropdownActive && authorId !== userData.uid) ? (
                <div className="dropdown" style={{ width: "150px", top: "-50px", right: "-50px" }}>
                  <div onClick={() => { console.log("clipped"); navigator.clipboard.writeText(window.location.href); setIsDropdownActive(false); setClipboardMessage("Saved to clipboard!"); }}>
                    <i className="fa-solid fa-link" />
                    {" "}
                    Copy link
                  </div>
                </div>
              ) : <div />}
            </div>
          </div>

          {postLikes.length > 10 ? (
            <div className="post-likes medium" onClick={() => { handleViewLikeList(postLikes); }}>
              Liked by
              {" "}
              <span className="username medium bold">{postLikes[postLikes.length - 1].sourceUsername}</span>
              {" "}
              and
              {" "}
              <span className="medium bold">
                {postLikes.length - 1}
                {" "}
                others
              </span>
            </div>
          )
            : (
              <div className="post-likes medium bold" onClick={() => { handleViewLikeList(postLikes); }}>
                {postLikes.length}
                {" "}
                likes
              </div>
            )}

          <form onSubmit={handleSubmitPostComment} className="post-comment-box">
            <textarea ref={textareaRef} onChange={(e) => { setPostComments({ ...postComments, [postId]: e.target.value }); }} type="text" placeholder="Add a comment..." value={(postComments[postId]) || ""} />
            <span onClick={handleSubmitPostComment} className="submit-btn" type="submit">Post</span>
          </form>
        </div>
      </div>

      {submitCommentError && <Snackbar snackBarMessage={submitCommentError} setSnackBarMessage={setSubmitCommentError} />}
      {clipboardMessage && <Snackbar snackBarMessage={clipboardMessage} setSnackBarMessage={setClipboardMessage} />}
    </div>
  );
}

export default FullPost;
