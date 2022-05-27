import { getAuth, updateProfile } from "firebase/auth";
import React, { useContext, useEffect, useState } from "react";
import {
  updateDoc,
  doc,
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
  const [editProfileError, setEditProfileError] = useState(false);
  const [previewImageURL, setPreviewImageURL] = useState(null);
  const [bio, setBio] = useState(userData.bio);
  const [username, setUsername] = useState(userData.username);
  const [displayName, setDisplayName] = useState(userData.displayName);
  const [file, setFile] = useState(null);

  async function updateUserData(publicImageURL) {
    const tempUserData = { ...userData };

    const { uid } = getAuth().currentUser;
    const docRef = doc(db, `users/uid_${uid}`);
    if (publicImageURL) {
      await updateDoc(docRef, {
        bio,
        displayName,
        username,
        photoURL: publicImageURL,
      });
    } else {
      await updateDoc(docRef, {
        bio,
        displayName,
        username,
      });
    }

    tempUserData.username = username;
    tempUserData.bio = bio;
    tempUserData.displayName = displayName;
    if (publicImageURL) {
      tempUserData.photoURL = publicImageURL;
    }
    setUserData(tempUserData);
  }

  async function handleEditProfileSubmission(e) {
    e.preventDefault();
    let newImageRef;
    try {
      setIsLoading(true);
      let publicImageURL;
      if (file) {
        // 1 - Upload the image to Cloud Storage, using that postRef.
        const filePath = `uid_${getAuth().currentUser.uid}/userPhotos/${file.name}`;
        newImageRef = ref(storage, filePath);
        await uploadBytesResumable(newImageRef, file);

        publicImageURL = await getDownloadURL(newImageRef); // 2 - Generate a public URL for the file.
        await updateProfile(getAuth().currentUser, { // 3 - Update photoURL field to uid Doc
          photoURL: publicImageURL,
        });
      }

      setIsEditProfileActive(false);
      updateUserData(publicImageURL);
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
    setPreviewImageURL(URL.createObjectURL(fileSelected));
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

  const imageURL = previewImageURL || userData.photoURL || DUMMY_AVATAR_URL;

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
              style={{ backgroundImage: `url(${imageURL})` }}
            >
              {!previewImageURL && (
              <input
                onChange={handleMediaFileSelected}
                id="fileImage"
                type="file"
                style={{ visibility: "hidden" }}
                accept="image/*"
                capture="camera"
              />
              )}
              {!previewImageURL && (
              <svg stroke="white" fill="black" strokeWidth="0" viewBox="0 0 512 512" className="settings_profileIcon__3Vztt" xmlns="http://www.w3.org/2000/svg">
                <path d="M416 64H96a64.07 64.07 0 00-64 64v256a64.07 64.07 0 0064 64h320a64.07 64.07 0 0064-64V128a64.07 64.07 0 00-64-64zm-80 64a48 48 0 11-48 48 48.05 48.05 0 0148-48zM96 416a32 32 0 01-32-32v-67.63l94.84-84.3a48.06 48.06 0 0165.8 1.9l64.95 64.81L172.37 416zm352-32a32 32 0 01-32 32H217.63l121.42-121.42a47.72 47.72 0 0161.64-.16L448 333.84z" />
              </svg>
              )}
            </label>
          </div>
          <div className="form-row">
            <label className="bold" htmlFor="username">Username</label>
            <input id="username" onChange={(e) => { console.log(e.target.value); setUsername(e.target.value); }} type="text" defaultValue={userData && userData.username} />
          </div>
          <div className="form-row">
            <label className="bold" htmlFor="fullname">Full Name</label>
            <input id="fullname" onChange={(e) => { setDisplayName(e.target.value); }} type="text" defaultValue={userData && userData.displayName} />
            {/* <textarea id="fullname" onChange={(e) => { setDisplayName(e.target.value); }} defaultValue={(userData && userData.displayName)} /> */}
          </div>
          <div className="form-row">
            <label className="bold" htmlFor="bio">Bio</label>
            <textarea id="bio" onChange={(e) => { setBio(e.target.value); }} defaultValue={(userData && userData.bio)} />
          </div>
          <button onSubmit={handleEditProfileSubmission} type="button submit" className="btn btn-outline-primary">SAVE</button>
          {isLoading && <img src={LOADING_IMAGE_URL} alt="loading" style={{ width: "24px", height: "24px", display: "block", marginTop: "15px", marginLeft: "50%" }} />}

        </form>
        <div />
      </div>
      {editProfileError && <Snackbar snackBarMessage={editProfileError} setSnackBarMessage={setEditProfileError} />}
    </div>
  );
}

export default EditProfile;
