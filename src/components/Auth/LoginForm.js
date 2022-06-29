import React, { useContext, useState } from "react";
import UserContext from "../Contexts/UserContext";
import AuthContext from "../Contexts/AuthContext";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

function LoginForm() {
  const {
    darkMode, setIsLoggedIn, setIsFullPostActive, setAbruptPostView, setUserData, setAllUserData, setNewsfeed,
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

  const options = {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: userAuthInfo.username,
      password: userAuthInfo.password,
    }),
  };

  function loginEmailPassword(e) {
    e.preventDefault();
    setIsLoading(true);

    fetch("http://localhost:4000/login", options)
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched success");
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
          setUserData(data.user);
          setAllUserData(data.users);
          setNewsfeed(data.newsfeed);
          setIsLoggedIn(true);
        }
        setIsLoading(false);
      });
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
        {/* <div onClick={logInProvider} className="login-provider grey bold">
          <img src={`${window.location.origin}/images/google.png`} alt="google icon" style={{ width: "20px", height: "20px" }} />
          Log in with Google
        </div> */}
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
