import React, { useState, useMemo } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import AuthContext from "../Contexts/AuthContext";

function Auth() {
  const [isLoginFormActive, setIsLoginFormActive] = useState(true);
  const providerValue = useMemo(() => ({ isLoginFormActive, setIsLoginFormActive }), [isLoginFormActive]);

  return (
    <div>
      <div className="Auth">
        <img src={`${window.location.origin}/images/iphoneX.png`} alt="iphone-X" className="iphoneX" />
        <AuthContext.Provider value={providerValue}>
          {isLoginFormActive ? <LoginForm /> : <SignupForm />}
        </AuthContext.Provider>
      </div>

      {/* <footer style={{ color: "#8e8e8e", fontSize: "12px", margin: "50px 0" }}>
        <div>
          <a href="https://github.com/adp11">Github</a>
          <a href="https://www.linkedin.com/in/andrewph/">LinkedIn</a>
          <a href="https://www.facebook.com/profile.php?id=100008330377004">Facebook</a>
          <a href="https://www.instagram.com/andrew.pham__/">Instagram</a>
        </div>
        <div>
          <span className="grey">
            © 2022 Outstagram from
            {" "}
            <a href="https://github.com/adp11">adp11</a>
          </span>
          <span className="grey">
            Credit to
            {" "}
            <a href="https://www.theodinproject.com/lessons/node-path-javascript-javascript-final-project">The Odin Project (TOP)</a>
          </span>
        </div>
      </footer> */}
    </div>
  );
}

export default Auth;
