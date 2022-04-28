import React, { useEffect, useContext, useState } from "react";
import {
  AuthErrorCodes,
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { app, auth } from "../../firebase";
import UserContext from "../Contexts/UserContext";
import AuthContext from "../Contexts/AuthContext";

function LoginForm() {
  const { setIsLoggedIn, setUserData } = useContext(UserContext);
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
      const userCredential = await signInWithEmailAndPassword(auth, userAuthInfo.email, userAuthInfo.password);
      const userData = {
        email: userCredential.email,
        uid: userCredential.uid,
      };
      console.log("worked?")
      setUserData(userData);
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
    const userCredential = await signInWithPopup(getAuth(), provider);
    const userData = {
      email: userCredential.email,
      uid: userCredential.uid,
    };
    setUserData(userData);
    setIsLoggedIn(true);
    // console.log(userCredential);
    // console.log(userCredential.user);
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
