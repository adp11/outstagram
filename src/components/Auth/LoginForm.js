import React, { useContext, useState } from "react";
import {
  AuthErrorCodes,
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import UserContext from "../Contexts/UserContext";
import AuthContext from "../Contexts/AuthContext";

function LoginForm() {
  const { darkMode, setIsLoggedIn, setIsFullPostActive, setAbruptPostView } = useContext(UserContext);
  const { setIsLoginFormActive } = useContext(AuthContext);

  const [userAuthInfo, setUserAuthInfo] = useState({
    email: "",
    password: "",
  });

  const [loginError, setLoginError] = useState({
    usernameError: false,
    passwordError: false,
  });

  async function loginEmailPassword(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, userAuthInfo.email, userAuthInfo.password);
      setIsLoggedIn(true);
      if (/^\/p\//.test(window.location.pathname)) { // if there's abrupt access to fullpost
        setIsFullPostActive(true);
        setAbruptPostView(`uid_${getAuth().currentUser.uid}`);
      }
    } catch (error) {
      if (error.code === AuthErrorCodes.INVALID_PASSWORD) {
        setLoginError({
          usernameError: false,
          passwordError: true,
        });
      } else {
        setLoginError({
          usernameError: true,
          passwordError: false,
        });
      }
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
      <div className="login-container">
        <div>
          <img src={`${window.location.origin}/images/${darkMode ? "header-dark.png" : "header-light.png"}`} alt="Instagram" style={{ width: "175px", height: "61px", margin: "40px 0" }} />
        </div>
        <form onSubmit={loginEmailPassword}>
          <div className="form-row">
            <input onChange={(e) => { setUserAuthInfo({ email: e.target.value, password: userAuthInfo.password }); }} type="email" name="email" placeholder="Email" required autoComplete="true" />
            {loginError.usernameError && <small style={{ color: "red" }}>The username you entered doesn't belong to an account. Please check your username and try again.</small>}
          </div>
          <div className="form-row">
            <input onChange={(e) => { setUserAuthInfo({ email: userAuthInfo.email, password: e.target.value }); }} type="password" name="password" placeholder="Password" required autoComplete="true" />
            {loginError.passwordError && <small style={{ color: "red" }}>Sorry, your password was incorrect. Please double-check your password.</small>}
          </div>
          <button type="submit">Log In</button>
        </form>

        <div className="grey bold">OR</div>
        {/* eslint-disable-next-line */}
        <div onClick={logInProvider} className="login-provider grey bold">
          <img src={`${window.location.origin}/images/google.png`} alt="google icon" style={{ width: "20px", height: "20px" }} />
          Log in with Google
        </div>
      </div>
      <div className="signup-box">
        Don't have an account?
        {" "}
        {/* eslint-disable-next-line */}
        <span onClick={() => { setIsLoginFormActive(false); }} style={{ color: "#0095f6", fontWeight: "600" }}>Sign up</span>
      </div>
    </div>
  );
}

export default LoginForm;
