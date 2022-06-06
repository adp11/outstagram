import React, { useContext, useState } from "react";
import {
  getAuth,
  updateProfile,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import AuthContext from "../Contexts/AuthContext";
import UserContext from "../Contexts/UserContext";
import { capitalizeFirebaseAuthError } from "../../utils";
import Snackbar from "../Popups/Snackbar";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";
const DUMMY_AVATAR_URL = "https://dummyimage.com/200x200/979999/000000.png&text=...";

function SignupForm() {
  const { darkMode, setIsLoggedIn, setIsFullPostActive, setAbruptPostView } = useContext(UserContext);
  const { setIsLoginFormActive } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);
  const [signUpError, setSignUpError] = useState(null);
  const [updateProfileError, setUpdateProfileError] = useState(null);
  const [userAuthInfo, setUserAuthInfo] = useState({
    email: "",
    password: "",
    fullname: "",
    username: "",
  });

  async function createAccount(e) {
    e.preventDefault();
    try {
      setIsLoading(true);
      await createUserWithEmailAndPassword(auth, userAuthInfo.email, userAuthInfo.password);
      if (/^\/p\//.test(window.location.pathname)) {
        setIsFullPostActive(true);
        setAbruptPostView(`uid_${getAuth().currentUser.uid}`);
      }

      // Because there's no paramater for displayName in createUserWithEmailAndPassword()
      updateProfile(getAuth().currentUser, {
        displayName: `${userAuthInfo.fullname}`,
      }).then(() => {
        console.log("Profile updated successfully when creating new account");
      }).catch((error) => {
        setUpdateProfileError(error);
      });

      await setDoc(doc(db, `users/uid_${getAuth().currentUser.uid}`), {
        uid: `uid_${getAuth().currentUser.uid}`,
        username: userAuthInfo.username,
        displayName: userAuthInfo.fullname,
        photoURL: DUMMY_AVATAR_URL,
        bio: "",
        totalPosts: 0,
        totalNotifs: 0,
        totalChatNotifs: 0,
        postSnippets: [],
        followers: [],
        following: [],
      });

      setIsLoggedIn(true);
    } catch (error) {
      setIsLoading(false);
      setSignUpError(capitalizeFirebaseAuthError(error.code));
    }
  }

  async function logInProvider() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(getAuth(), provider);
    const { uid, displayName, photoURL } = getAuth().currentUser;
    if (/^\/p\//.test(window.location.pathname)) {
      setIsFullPostActive(true);
      setAbruptPostView(`uid_${uid}`);
    }
    // If first time logged in, initialize Field Values in Firestore db
    const docRef = doc(db, `users/uid_${uid}`);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(doc(db, `users/uid_${uid}`), {
        uid: `uid_${uid}`,
        username: `u_${uid}`,
        displayName,
        photoURL,
        bio: "",
        totalPosts: 0,
        totalNotifs: 0,
        totalChatNotifs: 0,
        postSnippets: [],
        followers: [],
        following: [],
      });
    }
    setIsLoggedIn(true);
  }

  return (
    <div className="auth-container">
      <div className="signup-container">
        <div>
          <img src={`${window.location.origin}/images/${darkMode ? "header-dark.png" : "header-light.png"}`} alt="Instagram" style={{ width: "175px", height: "61px" }} />
          {/* eslint-disable-next-line */}
          <p style={{ textAlign: "center", fontSize: "18px", fontWeight: "600", color: "#8e8e8e" }} >
            Sign up to see photos from and chat with your friends
          </p>
          {/* eslint-disable-next-line */}
          <div onClick={logInProvider} className="login-provider grey bold">
            <img src={`${window.location.origin}/images/google.png`} alt="google icon" style={{ width: "20px", height: "20px" }} />
            Log in with Google
          </div>
        </div>

        <div style={{ fontWeight: "600", color: "#8e8e8e" }}>OR</div>

        <form onSubmit={createAccount}>
          <div className="form-row">
            <input
              onChange={(e) => {
                setUserAuthInfo({
                  email: e.target.value,
                  password: userAuthInfo.password,
                  fullname: userAuthInfo.fullname,
                  username: userAuthInfo.username,
                });
              }}
              type="email"
              name="email"
              placeholder="Email"
              required
              autoComplete="true"
            />
          </div>
          <div className="form-row">
            <input
              onChange={(e) => {
                setUserAuthInfo({
                  email: userAuthInfo.email,
                  password: e.target.value,
                  fullname: userAuthInfo.fullname,
                  username: userAuthInfo.username,
                });
              }}
              type="password"
              name="password"
              placeholder="Password"
              required
              autoComplete="true"
            />
          </div>
          <div className="form-row">
            <input
              onChange={(e) => {
                setUserAuthInfo({
                  email: userAuthInfo.email,
                  password: userAuthInfo.password,
                  fullname: e.target.value,
                  username: userAuthInfo.username,
                });
              }}
              type="text"
              name="fullname"
              placeholder="Full Name"
              required
              autoComplete="true"
            />
          </div>
          <div className="form-row">
            <input
              onChange={(e) => {
                setUserAuthInfo({
                  email: userAuthInfo.email,
                  password: userAuthInfo.password,
                  fullname: userAuthInfo.fullname,
                  username: e.target.value,
                });
              }}
              type="text"
              name="username"
              placeholder="Username"
              required
              autoComplete="true"
            />
            {signUpError && <small style={{ color: "red" }}>{signUpError}</small>}
          </div>
          <button type="submit">Sign up</button>
          {isLoading && <img src={LOADING_IMAGE_URL} alt="loading" style={{ width: "24px", height: "24px", marginTop: "15px" }} />}
        </form>
      </div>
      <div className="login-box">
        Have an account?
        {" "}
        {/* eslint-disable-next-line */}
        <span onClick={() => { setIsLoginFormActive(true); }} style={{ color: "#0095f6", fontWeight: "600" }}>Log in</span>
      </div>
      {updateProfileError && <Snackbar snackBarMessage={updateProfileError} setSnackBarMessage={setUpdateProfileError} />}
    </div>
  );
}

export default SignupForm;
