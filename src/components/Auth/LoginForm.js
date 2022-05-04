import React, { useEffect, useContext, useState } from "react";
import {
  AuthErrorCodes,
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  addDoc, arrayRemove, collection, doc, setDoc,
} from "firebase/firestore";
import { app, auth, db } from "../../firebase";
import UserContext from "../Contexts/UserContext";
import AuthContext from "../Contexts/AuthContext";
import Snackbar from "../Snackbar";

function LoginForm() {
  const { setUserData, setIsLoggedIn } = useContext(UserContext);
  const { setIsLoginFormActive } = useContext(AuthContext);

  const [userAuthInfo, setUserAuthInfo] = useState({
    email: "",
    password: "",
  });

  const [loginErrorMessage, setLoginErrorMessage] = useState({
    usernameError: false,
    passwordError: false,
  });

  async function loginEmailPassword(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, userAuthInfo.email, userAuthInfo.password);
      setIsLoggedIn(true);
    } catch (error) {
      if (error.code === AuthErrorCodes.INVALID_PASSWORD) {
        setLoginErrorMessage({
          usernameError: false,
          passwordError: true,
        });
      } else {
        setLoginErrorMessage({
          usernameError: true,
          passwordError: false,
        });
      }
    }
  }
  async function logInProvider() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(getAuth(), provider);

    // case 1: first time log in, first time in Auth database --> postSnippets not exists --> arrayRemove(null) initializes empty array.
    // case 2: already a user in Auth database --> postSnippets already exists --> arrayRemove(null) leaves current array intact.
    const { uid, displayName, photoURL } = getAuth().currentUser;
    await setDoc(doc(db, `users/uid_${uid}`), {
      username: `user_${uid}`,
      bio: "",
      displayName,
      photoURL,
      postSnippets: arrayRemove(null),
      totalPosts: 0,
      followers: arrayRemove(null),
      following: arrayRemove(null),
    }, { merge: true });

    setIsLoggedIn(true);
  }

  return (
    <div className="auth-container">
      <div className="login-container">
        <div>
          <img src={`${window.location.origin}/images/header.png`} alt="Instagram" style={{ width: "175px", height: "51px", margin: "40px 0" }} />
        </div>
        <form onSubmit={loginEmailPassword}>
          <div className="form-row">
            <input onChange={(e) => { setUserAuthInfo({ email: e.target.value, password: userAuthInfo.password }); }} type="email" name="email" placeholder="Email" required autoComplete="true" />
            {loginErrorMessage.usernameError && <small style={{ color: "red" }}>The username you entered doesn't belong to an account. Please check your username and try again.</small>}
          </div>
          <div className="form-row">
            <input onChange={(e) => { setUserAuthInfo({ email: userAuthInfo.email, password: e.target.value }); }} type="password" name="password" placeholder="Password" required autoComplete="true" />
            {loginErrorMessage.passwordError && <small style={{ color: "red" }}>Sorry, your password was incorrect. Please double-check your password.</small>}
          </div>
          <button type="submit">Log In</button>
        </form>

        <div className="grey bold">OR</div>

        <div onClick={logInProvider} className="login-provider grey bold">
          <img src={`${window.location.origin}/images/google.png`} alt="google icon" style={{ width: "20px", height: "20px" }} />
          Log in with Google
        </div>
      </div>
      <div className="signup-box">
        Don't have an account?
        {" "}
        <span onClick={() => { setIsLoginFormActive(false); }} style={{ color: "#0095f6", fontWeight: "600" }}>Sign up</span>
      </div>
    </div>
  );
}

export default LoginForm;
