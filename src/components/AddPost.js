import React, { useEffect, useContext, useState } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getAuth } from "firebase/auth";
// import uniqid from "uniqid";
import UserContext from "./Contexts/UserContext";
import Snackbar from "./Snackbar";
import { db, storage } from "../firebase";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

function AddPost() {
  const { setIsAddPostActive, userData, setUserData } = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(false);
  const [addPostError, setAddPostError] = useState(null);
  const [previewImageURL, setPreviewImageURL] = useState(null);
  const [caption, setCaption] = useState(null);
  const [file, setFile] = useState(null);

  async function updatetPostSnippets(publicImageURL, postId) {
    if (userData) {
      userData.postSnippets.push({
        postId,
        imageURL: publicImageURL,
        totalComments: 0,
        totalLikes: 0,
      });
      userData.totalPosts += 1;
      setUserData(userData);
      const docRef = doc(db, `users/${userData.uid}`);
      await updateDoc(docRef, { postSnippets: userData.postSnippets, totalPosts: userData.totalPosts });
    }
  }

  async function handleAddPostSubmission(e) {
    e.preventDefault();
    if (file) { // prevent submitting form before uploading file
      let postRef;
      let newImageRef;
      try {
        setIsLoading(true);
        // 1 - Create a Doc of this post first to get postRef.
        const collectionPath = `users/${userData.uid}/posts`;
        postRef = await addDoc(collection(db, collectionPath), {
          creationTime: serverTimestamp(),
        });

        // 2 - Upload the image to Cloud Storage, using that postRef.
        const filePath = `${userData.uid}/${postRef.id}/${file.name}`;
        newImageRef = ref(storage, filePath);
        const fileSnapshot = await uploadBytesResumable(newImageRef, file);

        // 3 - Generate a public URL for the file.
        const publicImageURL = await getDownloadURL(newImageRef);

        // TODO: create variable to assign those fields into a 'data' and pass around
        // 4 - Update the rest of the form's input to Doc
        await updateDoc(postRef, {
          authorId: userData.uid,
          authorPhotoURL: userData.photoURL,
          authorUsername: userData.username,
          postId: postRef.id,
          postCaption: caption,
          imageURL: publicImageURL,
          storageURL: fileSnapshot.metadata.fullPath,
          filePath,
          likes: [],
          comments: [],
        });

        setIsAddPostActive(false);
        // TODO: 2 these functions should be put into code when click triggered
        updatetPostSnippets(publicImageURL, postRef.id);
        // console.log({
        //   postId: postRef.id,
        //   postCaption: caption,
        //   imageURL: publicImageURL,
        //   storageURL: fileSnapshot.metadata.fullPath,
        //   likes: {
        //     likesList: [],
        //     totalLikes: 0,
        //   },
        //   comments: {
        //     twoLastComments: [],
        //     totalComments: 0,
        //   },
        // }, "data of add post to database");
      } catch (error) {
        setAddPostError(`Uploading Error: ${error}`);

        // undo code executed inside try block
        await deleteDoc(postRef);
        await deleteObject(newImageRef);
      }
    } else {
      setAddPostError("You must upload a file image.");
    }
  }

  function handleMediaFileSelected(e) {
    const fileSelected = e.target.files[0];
    if (!fileSelected.type.match("image.*")) { // prevent invalid file type
      setAddPostError("You can only share images");
      return;
    }
    setPreviewImageURL(URL.createObjectURL(fileSelected)); 
    setFile(fileSelected);
  }

  useEffect(() => {
    function escape(e) {
      if (e.key === "Escape") {
        setIsAddPostActive(false);
      }
    }

    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <div className="AddPost">
      {/* eslint-disable-next-line */}
      <i onClick={()=> {setIsAddPostActive(false)}} className="fa-solid fa-xmark" style={{ position: "fixed", left: "97%", top: "2%", fontSize: "30px" }} />
      <div className="container">
        <div>
          <span className="bold">Create new post</span>
        </div>
        <form onSubmit={handleAddPostSubmission}>
          <div className="file-upload-container">
            <label htmlFor="file-upload">
              {!previewImageURL && (
              <input
                onChange={handleMediaFileSelected}
                id="file-upload"
                type="file"
                accept="image/*"
                capture="camera"
                style={{ visibility: "hidden" }}
              />
              )}
              {!previewImageURL ? (
                <svg stroke="#8e8e8e" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                  <path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" d="M320 367.79h76c55 0 100-29.21 100-83.6s-53-81.47-96-83.6c-8.89-85.06-71-136.8-144-136.8-69 0-113.44 45.79-128 91.2-60 5.7-112 43.88-112 106.4s54 106.4 120 106.4h56" />
                  <path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" d="M320 255.79l-64-64-64 64m64 192.42V207.79" />
                </svg>
              )
                : <img src={previewImageURL} className="preview-image" alt="preview" />}
              {!previewImageURL && <small>File size limit 5 mb.</small>}
            </label>
          </div>
          {/* override with 100% line 639 textarea */}
          <textarea onChange={(e) => { setCaption(e.target.value); }} style={{ width: "75%" }} placeholder="Enter caption..." />
          {isLoading && <img src={LOADING_IMAGE_URL} alt="loading" style={{ width: "24px", height: "24px" }} />}
          <button onSubmit={handleAddPostSubmission} type="button submit" className="btn btn-outline-primary">POST</button>
        </form>
        <div />
      </div>
      {addPostError && <Snackbar snackBarMessage={addPostError} setSnackBarMessage={setAddPostError} />}
    </div>
  );
}

export default AddPost;
