import React, { useEffect, useContext, useState } from "react";
import {
  getAuth,
  updateProfile,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  addDoc, arrayRemove, collection, doc, setDoc, updateDoc,
} from "firebase/firestore";
import { app, auth, db } from "../../firebase";
import AuthContext from "../Contexts/AuthContext";
import UserContext from "../Contexts/UserContext";
import { capitalizeFirebaseAuthError } from "../../utils";
import Snackbar from "../Snackbar";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

function SignupForm() {
  const { setIsLoggedIn } = useContext(UserContext);
  const { setIsLoginFormActive } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);
  const [userAuthInfo, setUserAuthInfo] = useState({
    email: "",
    password: "",
    username: "",
    fullname: "",
  });

  const [signupErrorMessage, setSignupErrorMessage] = useState(null);
  const [updateProfileError, setUpdateProfileError] = useState(null);

  async function createAccount(e) {
    e.preventDefault();
    try {
      setIsLoading(true);
      await createUserWithEmailAndPassword(auth, userAuthInfo.email, userAuthInfo.password);
      updateProfile(getAuth().currentUser, {
        displayName: `${userAuthInfo.fullname}`,
      }).then(() => {
      }).catch((error) => {
        setUpdateProfileError(error);
      });

      const { uid } = getAuth().currentUser;
      await setDoc(doc(db, `users/uid_${uid}`), { username: userAuthInfo.username, bio: "", postSnippets: [] });

      setIsLoggedIn(true);
    } catch (error) {
      console.log(error);
      setSignupErrorMessage(capitalizeFirebaseAuthError(error.code));
    }
  }

  async function logInProvider() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(getAuth(), provider);

    const { uid } = getAuth().currentUser;
    await setDoc(doc(db, `users/uid_${uid}`), {
      username: `user_${uid}`,
      bio: "",
      postSnippets: arrayRemove(null),
    }, { merge: true });

    setIsLoggedIn(true);
  }

  return (
    <div className="auth-container">
      <div className="signup-container">
        <div>
          <img src={`${window.location.origin}/images/header.png`} alt="Instagram" style={{ width: "175px", height: "51px" }} />
          {/* eslint-disable-next-line */}
          <p style={{ textAlign: "center", fontSize: "18px", fontWeight: "600", color: "#8e8e8e" }} >
            Sign up to see photos and videos from your friends
          </p>
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
            {signupErrorMessage && <small style={{ color: "red" }}>{signupErrorMessage}</small>}
          </div>
          <button type="submit">Sign up</button>
          {isLoading && <img src={LOADING_IMAGE_URL} alt="loading" style={{ width: "24px", height: "24px" }} />}
        </form>
      </div>
      <div className="login-box">
        Have an account?
        {" "}
        <span onClick={() => { setIsLoginFormActive(true); }} style={{ color: "#0095f6", fontWeight: "600" }}>Log in</span>
      </div>
      {updateProfileError && <Snackbar snackBarMessage={updateProfileError} setSnackBarMessage={setUpdateProfileError} />}
    </div>
  );
}

export default SignupForm;
