import React, { useEffect, useContext, useState } from "react";

function Auth() {
  return (
    <div>
      <div className="Auth">
        <img src={`${window.location.origin}/images/iphoneX.png`} alt="iphone-X" className="iphoneX" />
        <div className="auth-container">
          <div className="login-container">
            <div>
              <img src={`${window.location.origin}/images/header.png`} alt="Instagram" style={{ width: "175px", height: "51px", margin: "40px 0" }} />
            </div>
            <form>
              <div className="form-row">
                <input type="email" name="email" placeholder="Email" />
                <small style={{ color: "red" }}>The username you entered doesn't belong to an account. Please check your username and try again.</small>
              </div>
              <div className="form-row">
                <input type="password" name="password" placeholder="Password" />
                <small style={{ color: "red" }}>Sorry, your password was incorrect. Please double-check your password.</small>
              </div>
              <button type="submit">Log In</button>
            </form>

            <div className="grey bold">OR</div>

            <div className="login-provider grey bold">
              <img src={`${window.location.origin}/images/google.png`} alt="google icon" style={{ width: "20px", height: "20px" }} />
              Log in with Google
            </div>
          </div>

          <div className="signup-box">
            Don't have an account?
            {" "}
            <span style={{ color: "#0095f6", fontWeight: "600" }}>Sign up</span>
          </div>
        </div>

        {/* <div className="auth-container">
          <div className="signup-container">
            <div>
              <img src={`${window.location.origin}/images/header.png`} alt="Instagram" style={{ width: "175px", height: "51px" }} />
              <p style={{
                textAlign: "center", fontSize: "18px", fontWeight: "600", color: "#8e8e8e",
              }}
              >
                Sign up to see photos and videos from your friends
              </p>
              <div className="login-provider grey bold">
                <img src={`${window.location.origin}/images/google.png`} alt="google icon" style={{ width: "20px", height: "20px" }} />
                Log in with Google
              </div>
            </div>

            <div style={{ fontWeight: "600", color: "#8e8e8e" }}>OR</div>

            <form>
              <div className="form-row">
                <input type="email" name="email" placeholder="Email" />
                <small style={{ color: "red" }}>The username you entered doesn't belong to an account. Please check your username and try again.</small>
              </div>
              <div className="form-row">
                <input type="password" name="password" placeholder="Password" />
                <small style={{ color: "red" }}>Sorry, your password was incorrect. Please double-check your password.</small>
              </div>
              <div className="form-row">
                <input type="text" name="fullname" placeholder="Full Name" />
                <small style={{ color: "red" }}>Sorry, your password was incorrect. Please double-check your password.</small>
              </div>
              <div className="form-row">
                <input type="text" name="username" placeholder="Username" />
                <small style={{ color: "red" }}>Sorry, your password was incorrect. Please double-check your password.</small>
              </div>
              <button type="submit">Sign up</button>
            </form>
          </div>
          <div className="login-box">
            Have an account?
            {" "}
            <span style={{ color: "#0095f6", fontWeight: "600" }}>Log in</span>
          </div>
        </div> */}
      </div>

      <footer style={{ color: "#8e8e8e", fontSize: "12px", margin: "50px 0" }}>
        <div>
          <a href="https://www.facebook.com/profile.php?id=100008330377004">Facebook</a>
          <a href="https://www.instagram.com/andrew.pham__/">Instagram</a>
          <a href="https://www.linkedin.com/in/andrewph/">LinkedIn</a>
          <a href="https://github.com/adp11">Github</a>
        </div>
        <div>
          <span>
            © 2022 Instagram from
            {" "}
            <a href="https://github.com/adp11">adp11</a>
          </span>
          <span>
            Credit to
            {" "}
            <a href="https://www.theodinproject.com/lessons/node-path-javascript-javascript-final-project">The Odin Project (TOP)</a>
          </span>
        </div>

      </footer>
    </div>

  );
}

export default Auth;
