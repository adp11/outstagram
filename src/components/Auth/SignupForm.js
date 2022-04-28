import React, { useEffect, useContext, useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { app, auth } from "../../firebase";
import AuthContext from "../Contexts/AuthContext";
import UserContext from "../Contexts/UserContext";
import { capitalizeFirebaseAuthError } from "../../utils";

function SignupForm() {
  const { setIsLoggedIn, setUserData } = useContext(UserContext);
  const { setIsLoginFormActive } = useContext(AuthContext);

  const [userAuthInfo, setUserAuthInfo] = useState({
    email: "",
    password: "",
    username: "",
    fullname: "",
  });

  const [signupErrorMessage, setSignupErrorMessage] = useState(null);

  async function createAccount(e) {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userAuthInfo.email, userAuthInfo.password);
      const userData = {
        email: userCredential.email,
        uid: userCredential.uid,
      };
      setUserData(userData);
      setIsLoggedIn(true);
    } catch (error) {
      setSignupErrorMessage(capitalizeFirebaseAuthError(error.code));
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
      <div className="signup-container">
        <div>
          <img src={`${window.location.origin}/images/header.png`} alt="Instagram" style={{ width: "175px", height: "51px" }} />
          <p style={{
            textAlign: "center", fontSize: "18px", fontWeight: "600", color: "#8e8e8e",
          }}
          >
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
                  fullname: userAuthInfo.username,
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
        </form>
      </div>
      <div className="login-box">
        Have an account?
        {" "}
        <span onClick={() => { setIsLoginFormActive(true); }} style={{ color: "#0095f6", fontWeight: "600" }}>Log in</span>
      </div>
    </div>
  );
}

export default SignupForm;
