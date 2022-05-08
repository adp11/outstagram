import { getAuth, updateProfile } from "firebase/auth";
import React, { useContext, useEffect, useState } from "react";
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
  deleteField,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import UserContext from "./Contexts/UserContext";
import { db, storage } from "../firebase";
import Snackbar from "./Snackbar";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";
const DUMMY_AVATAR_URL = "https://dummyimage.com/200x200/979999/000000.png&text=...";

function EditProfile() {
  const { userData, setUserData, setIsEditProfileActive } = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(false);
  const [editProfileError, setEditProfileError] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [bio, setBio] = useState(null);
  const [username, setUsername] = useState(null);
  const [file, setFile] = useState(null);

  async function updateUserData(publicImageUrl) {
    if (userData) {
      userData.username = username;
      userData.bio = bio;
      userData.photoURL = publicImageUrl;
    }
    setUserData(userData);

    const { uid } = getAuth().currentUser;
    const docRef = doc(db, `users/uid_${uid}`);
    await updateDoc(docRef, { bio: userData.bio, username: userData.username, photoURL: userData.photoURL });
  }

  async function handleEditProfileSubmission(e) {
    e.preventDefault();
    let newImageRef;
    try {
      setIsLoading(true);
      let publicImageUrl;
      if (file) {
        // 1 - Upload the image to Cloud Storage, using that postRef.
        const filePath = `uid_${getAuth().currentUser.uid}/userPhotos/${file.name}`;
        newImageRef = ref(storage, filePath);
        await uploadBytesResumable(newImageRef, file);

        publicImageUrl = await getDownloadURL(newImageRef); // 2 - Generate a public URL for the file.
        await updateProfile(getAuth().currentUser, { // 3 - Update photoURL field to uid Doc
          photoURL: publicImageUrl,
        });
      }

      setIsEditProfileActive(false);
      updateUserData(publicImageUrl);
    } catch (error) {
      setEditProfileError(`Uploading Error: ${error}`);
      await deleteObject(newImageRef); // undo code executed inside try block
    }
  }

  function handleMediaFileSelected(e) {
    const fileSelected = e.target.files[0];
    if (!fileSelected.type.match("image.*")) { // prevent invalid file type
      setEditProfileError("You can only share images");
      return;
    }
    setPreviewImageUrl(URL.createObjectURL(fileSelected)); // TODO: prevent vertical image
    setFile(fileSelected);
  }

  useEffect(() => {
    function escape(e) {
      if (e.key === "Escape") {
        setIsEditProfileActive(false);
      }
    }

    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const imageUrl = previewImageUrl || userData.photoURL || DUMMY_AVATAR_URL;

  return (
    <div className="EditProfile" style={{ padding: "10px" }}>
      {/* eslint-disable-next-line */}
      <i
        onClick={() => { setIsEditProfileActive(false); }}
        className="fa-solid fa-xmark"
        style={{
          position: "fixed", left: "97%", top: "2%", fontSize: "30px",
        }}
      />

      <div className="container">
        <div>
          <span style={{ fontWeight: "600" }}>Edit Profile</span>
        </div>
        <form onSubmit={handleEditProfileSubmission}>
          <div className="file-upload-container">
            <label
              id="file-upload"
              htmlFor="fileImage"
              style={{ backgroundImage: `url(${imageUrl})` }}
            >
              {!previewImageUrl && (
              <input
                onChange={handleMediaFileSelected}
                id="fileImage"
                type="file"
                style={{ visibility: "hidden" }}
                accept="image/*"
                capture="camera"
              />
              )}
              {!previewImageUrl && (
              <svg stroke="white" fill="black" strokeWidth="0" viewBox="0 0 512 512" className="settings_profileIcon__3Vztt" xmlns="http://www.w3.org/2000/svg">
                <path d="M416 64H96a64.07 64.07 0 00-64 64v256a64.07 64.07 0 0064 64h320a64.07 64.07 0 0064-64V128a64.07 64.07 0 00-64-64zm-80 64a48 48 0 11-48 48 48.05 48.05 0 0148-48zM96 416a32 32 0 01-32-32v-67.63l94.84-84.3a48.06 48.06 0 0165.8 1.9l64.95 64.81L172.37 416zm352-32a32 32 0 01-32 32H217.63l121.42-121.42a47.72 47.72 0 0161.64-.16L448 333.84z" />
              </svg>
              )}
            </label>
          </div>
          <div className="form-row">
            <label className="bold">Username</label>
            <input onChange={(e) => { setUsername(e.target.value); }} type="text" defaultValue={userData && userData.username} />
          </div>
          <div className="form-row">
            <label className="bold">Bio</label>
            <textarea onChange={(e) => { setBio(e.target.value); }} defaultValue={(userData && userData.bio) || "none"} />
          </div>
          {isLoading && <img src={LOADING_IMAGE_URL} alt="loading" style={{ width: "24px", height: "24px" }} />}
          <button onSubmit={handleEditProfileSubmission} type="button submit" className="btn btn-outline-primary">SAVE</button>
        </form>
        <div />
      </div>
      {editProfileError && <Snackbar snackBarMessage={editProfileError} setSnackBarMessage={setEditProfileError} />}
    </div>
  );
}

export default EditProfile;
