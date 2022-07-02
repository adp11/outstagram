import React, { useEffect, useContext, useState } from "react";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import UserContext from "../Contexts/UserContext";
import Snackbar from "./Snackbar";
import { db, storage } from "../../firebase";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

function AddPost() {
  const { userData, setIsAddPostActive, setUserDataHelper } = useContext(UserContext);

  const [addPostError, setAddPostError] = useState(null);
  const [previewImageURL, setPreviewImageURL] = useState(null);
  const [caption, setCaption] = useState(null);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleAddPostSubmission(e) {
    e.preventDefault();
    if (file) { // prevent submitting form before uploading file
      // let newImageRef;
      try {
        setIsLoading(true);

        // 1 - Upload the image to Cloud Storage, using that postRef.
        const filePath = `${userData._id}/posts/${file.name}`;
        const newImageRef = ref(storage, filePath);
        const fileSnapshot = await uploadBytesResumable(newImageRef, file);

        // 2 - Generate a public URL for the file.
        const publicImageURL = await getDownloadURL(newImageRef);

        // 3 - Add to db
        const options = {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author: userData._id,
            postCaption: caption,
            imageURL: publicImageURL,
            storageURL: fileSnapshot.metadata.fullPath,
            filePath,
            likes: [],
            comments: [],
          }),
        };

        fetch("http://localhost:4000/post", options)
          .then((response) => response.json())
          .then((data) => {
            if (data.errorMsg) {
              setAddPostError(data.errorMsg);
            } else {
              setIsAddPostActive(false);
            }
          });
      } catch (error) {
        setAddPostError(`Uploading Error: ${error}`);
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
      <svg aria-label="Close" color="#262626" fill="#262626" height="18" role="img" viewBox="0 0 24 24" width="18" onClick={() => { setIsAddPostActive(false); }} style={{ position: "fixed", right: "10px", top: "10px", fontSize: "30px", width: "30px", height: "30px" }}>
        <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="#262626" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <line fill="none" stroke="#262626" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354" />
      </svg>
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
          {/* override with 100% textarea in App.css */}
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
