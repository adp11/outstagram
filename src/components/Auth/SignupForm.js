import React, { useContext, useState } from "react";
import AuthContext from "../Contexts/AuthContext";
import UserContext from "../Contexts/UserContext";
import Snackbar from "../Popups/Snackbar";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

function SignupForm() {
  const {
    darkMode, setIsLoggedIn, setIsFullPostActive, setIsFullPostByLink, setUserDataHelper, setAllUserData, setNewsfeedHelper, setJwtChecked,
  } = useContext(UserContext);
  const { setIsLoginFormActive } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);
  const [signUpError, setSignUpError] = useState(null);
  const [updateProfileError, setUpdateProfileError] = useState(null);
  const [userAuthInfo, setUserAuthInfo] = useState({
    password: "",
    fullname: "",
    username: "",
  });

  const errorMessages = [
    "The username is already in use by another account.",
    "Error when hashing your password. Please try again.",
    "Error when creating your account. Please try again.",
  ];

  const options = {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: userAuthInfo.username,
      fullname: userAuthInfo.fullname,
      password: userAuthInfo.password,
    }),
  };

  function createAccount(e) {
    e.preventDefault();
    setIsLoading(true);

    fetch("http://localhost:4000/signup", options)
      .then((response) => {
        if (!response.ok) {
          return response.json().then(({ message }) => {
            throw new Error(message || response.status);
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("data from json()", data);
        if (/^\/p\//.test(window.location.pathname)) {
          setIsFullPostActive(true);
          setIsFullPostByLink(true);
        }
        setUserDataHelper(data.user);
        setAllUserData(data.users);
        setNewsfeedHelper(data.newsfeed);
        setIsLoggedIn(true);
        setJwtChecked(true);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log("error happened in catch", err);
        if (errorMessages.indexOf(err.message) > -1) {
          setSignUpError(errorMessages[errorMessages.indexOf(err.message)]);
        } else {
          alert(err.message);
        }
        setIsLoading(false);
      });
  }

  function logInProvider() {
    window.open("http://localhost:4000/login/google", "_self");
  }

  return (
    <div className="auth-container">
      <div className="signup-container">
        <div>
          <img src={`${window.location.origin}/images/${darkMode ? "header-dark.png" : "header-light.png"}`} alt="Outstagram" style={{ width: "175px", height: "61px" }} />
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
          </div>
          <div className="form-row">
            <input
              onChange={(e) => {
                setUserAuthInfo({
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
