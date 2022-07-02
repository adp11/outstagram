import { getAuth, updateProfile } from "firebase/auth";
import React, { useContext, useEffect, useState } from "react";
import {
  updateDoc,
  doc,
  collection,
  getDocs,
  getDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import UserContext from "../Contexts/UserContext";
import { db, storage } from "../../firebase";
import Snackbar from "./Snackbar";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";
const DUMMY_AVATAR_URL = "https://dummyimage.com/200x200/979999/000000.png&text=...";

function EditProfile() {
  const { userData, setUserDataHelper, setIsEditProfileActive } = useContext(UserContext);

  const [previewImageURL, setPreviewImageURL] = useState(null);
  const [bio, setBio] = useState(userData.bio);
  const [username, setUsername] = useState(userData.username);
  const [displayName, setDisplayName] = useState(userData.displayName);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editProfileError, setEditProfileError] = useState(false);

  async function updateUserData(publicImageURL) {
    const tempUserData = { ...userData };
    const docRef = doc(db, `users/${userData.uid}`);

    if (publicImageURL) { // handle the case where there's no new image uploaded
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
    setUserDataHelper(tempUserData);
  }

  // only update some basic fields but not everywhere (e.g. inside comments or like lists)
  async function updateAcrossPosts(publicImageURL) {
    const querySnapshot = await getDocs(collection(db, `users/${userData.uid}/posts`));
    querySnapshot.forEach(async (document) => {
      const postRef = doc(db, `users/${userData.uid}/posts/${document.id}`);
      if (publicImageURL) {
        await updateDoc(postRef, {
          authorUsername: username,
          authorPhotoURL: publicImageURL,
        });
      } else {
        await updateDoc(postRef, {
          authorUsername: username,
        });
      }
    });
  }

  async function updateAcrossRooms(publicImageURL) {
    const querySnapshot = await getDocs(collection(db, `users/${userData.uid}/rooms`));
    querySnapshot.forEach(async (document) => {
      const documentData = document.data();
      const roomRef = doc(db, `users/${userData.uid}/rooms/${documentData.roomId}`);
      if (publicImageURL) {
        await updateDoc(roomRef, {
          "membersInfo.self": {
            username,
            displayName,
            photoURL: publicImageURL,
          },
        });

        const docSnap = await getDoc(roomRef);
        if (docSnap.exists()) {
          await updateDoc(doc(db, `users/${docSnap.data().members[1]}/rooms/${documentData.roomId}`), {
            "membersInfo.other": {
              username,
              displayName,
              photoURL: publicImageURL,
            },
          });
        }
      } else {
        await updateDoc(roomRef, {
          "membersInfo.self": {
            username,
            photoURL: userData.photoURL,
            displayName,
          },
        });
        const docSnap = await getDoc(roomRef);
        if (docSnap.exists()) {
          await updateDoc(doc(db, `users/${docSnap.data().members[1]}/rooms/${documentData.roomId}`), {
            "membersInfo.other": {
              username,
              photoURL: docSnap.data().photoURL,
              displayName,
            },
          });
        }
      }
    });
  }

  async function handleEditProfileSubmission(e) {
    e.preventDefault();
    let newImageRef;
    try {
      setIsLoading(true);
      let publicImageURL;
      if (file) {
        // 1 - Upload the image to Cloud Storage, using that postRef.
        const filePath = `${userData.uid}/userPhotos/${file.name}`;
        newImageRef = ref(storage, filePath);
        await uploadBytesResumable(newImageRef, file);

        publicImageURL = await getDownloadURL(newImageRef); // 2 - Generate a public URL for the file.
        await updateProfile(getAuth().currentUser, { // 3 - Update photoURL field to uid Doc
          photoURL: publicImageURL,
        });
      }

      updateUserData(publicImageURL);
      updateAcrossPosts(publicImageURL);
      updateAcrossRooms(publicImageURL);
      setIsEditProfileActive(false);
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
      <svg aria-label="Close" color="#262626" fill="#262626" height="18" role="img" viewBox="0 0 24 24" width="18" onClick={() => { setIsEditProfileActive(false); }} style={{ position: "fixed", right: "10px", top: "10px", fontSize: "30px", width: "30px", height: "30px" }}>
        <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="#262626" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <line fill="none" stroke="#262626" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354" />
      </svg>
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
            <input id="username" onChange={(e) => { setUsername(e.target.value); }} type="text" defaultValue={userData && userData.username} />
          </div>
          <div className="form-row">
            <label className="bold" htmlFor="fullname">Full Name</label>
            <input id="fullname" onChange={(e) => { setDisplayName(e.target.value); }} type="text" defaultValue={userData && userData.displayName} />
          </div>
          <div className="form-row">
            <label className="bold" htmlFor="bio">Bio</label>
            <textarea id="bio" onChange={(e) => { setBio(e.target.value); }} defaultValue={(userData && userData.bio)} />
          </div>
          <button onSubmit={handleEditProfileSubmission} type="button submit" className="btn btn-outline-primary">SAVE</button>
          {isLoading && (
          <img
            src={LOADING_IMAGE_URL}
            alt="loading"
            style={{
              width: "24px", height: "24px", display: "block", marginTop: "15px", marginLeft: "50%",
            }}
          />
          )}

        </form>
        <div />
      </div>
      {editProfileError && <Snackbar snackBarMessage={editProfileError} setSnackBarMessage={setEditProfileError} />}
    </div>
  );
}

export default EditProfile;
