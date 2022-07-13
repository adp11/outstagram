import React, { useContext, useState } from "react";
import UserContext from "../Contexts/UserContext";
import AuthContext from "../Contexts/AuthContext";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

function LoginForm() {
  const {
    darkMode, setIsLoggedIn, setIsFullPostActive, setIsFullPostByLink, setUserDataHelper, setAllUserData, setNewsfeedHelper, setJwtChecked,
  } = useContext(UserContext);
  const { setIsLoginFormActive } = useContext(AuthContext);

  const [userAuthInfo, setUserAuthInfo] = useState({
    username: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState({
    usernameError: false,
    passwordError: false,
  });

  const errorMsgs = [
    "The username you entered doesn't belong to an account. Please check your username and try again.",
    "Sorry, your password was incorrect. Please double-check your password.",
  ];

  function loginEmailPassword(e) {
    const options = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: userAuthInfo.username,
        password: userAuthInfo.password,
      }),
    };

    e.preventDefault();
    setIsLoading(true);
    fetch("http://localhost:4000/login", options)
      .then((response) => response.json())
      .then((data) => {
        if (errorMsgs.indexOf(data.errorMsg) === 0) {
          setLoginError({
            usernameError: true,
            passwordError: false,
          });
        } else if (errorMsgs.indexOf(data.errorMsg) === 1) {
          setLoginError({
            usernameError: false,
            passwordError: true,
          });
        } else {
          if (/^\/p\//.test(window.location.pathname)) {
            setIsFullPostActive(true);
            setIsFullPostByLink(true);
          }
          setUserDataHelper(data.user);
          setAllUserData(data.users);
          setNewsfeedHelper(data.newsfeed);
          setIsLoggedIn(true);
          setJwtChecked(true);
        }
        setIsLoading(false);
      });
  }

  function logInProvider() {
    window.open("http://localhost:4000/login/google", "_self");
    // const options = {
    //   method: "GET",
    //   mode: "cors",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // };

    // fetch("http://localhost:4000/login/google", options)
    //   .then((response) => response.json())
    //   .then((data) => {
    //     console.log("data from server", data);

    //     // if (/^\/p\//.test(window.location.pathname)) {
    //     //   setIsFullPostActive(true);
    //     //   setIsFullPostByLink(true);
    //     // }
    //     // setUserDataHelper(data.user);
    //     // setAllUserData(data.users);
    //     // setNewsfeedHelper(data.newsfeed);
    //     // setIsLoggedIn(true);
    //   });
  }

  return (
    <div className="auth-container">
      <div className="login-container">
        <div>
          <img src={`${window.location.origin}/images/${darkMode ? "header-dark.png" : "header-light.png"}`} alt="Outstagram" style={{ width: "175px", height: "61px", margin: "40px 0" }} />
        </div>
        <form onSubmit={loginEmailPassword}>
          <div className="form-row">
            <input onChange={(e) => { setUserAuthInfo({ username: e.target.value, password: userAuthInfo.password }); }} type="text" name="username" placeholder="Username" required autoComplete="true" />
            {loginError.usernameError && <small style={{ color: "red" }}>The username you entered doesn't belong to an account. Please check your username and try again.</small>}
          </div>
          <div className="form-row">
            <input onChange={(e) => { setUserAuthInfo({ username: userAuthInfo.username, password: e.target.value }); }} type="password" name="password" placeholder="Password" required autoComplete="true" />
            {loginError.passwordError && <small style={{ color: "red" }}>Sorry, your password was incorrect. Please double-check your password.</small>}
          </div>
          <button type="submit">Log In</button>
          {isLoading && <img src={LOADING_IMAGE_URL} alt="loading" style={{ width: "24px", height: "24px", marginTop: "15px" }} />}
        </form>

        <div className="grey bold">OR</div>
        {/* eslint-disable-next-line */}
        <div className="login-provider grey bold" onClick={logInProvider}>
          {/* <a href="http://localhost:4000/login/google"> */}
          <img src={`${window.location.origin}/images/google.png`} alt="google icon" style={{ width: "20px", height: "20px" }} />
          Log in with Google
          {/* </a> */}
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
