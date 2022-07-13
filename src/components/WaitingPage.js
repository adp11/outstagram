import React, { useContext } from "react";
import UserContext from "./Contexts/UserContext";

const LOADING_IMAGE_URL = "https://www.google.com/images/spin-32.gif?a";

function PageNotFound() {
  const { darkMode } = useContext(UserContext);

  return (
    <div
      className="WaitingPage"
      style={{
        display: "grid", placeItems: "center", height: "100vh", backgroundColor: darkMode ? "#000000" : "#fff",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img src={LOADING_IMAGE_URL} alt="Page Not Found" style={{ width: "30px", height: "auto" }} />
      </div>
    </div>
  );
}

export default PageNotFound;
