import React, { useContext } from "react";
import { Link } from "react-router-dom";
import UserContext from "./Contexts/UserContext";

function PageNotFound() {
  const { darkMode } = useContext(UserContext);

  return (
    <div
      className="PageNotFound"
      style={{
        display: "grid", placeItems: "center", height: "100vh", backgroundColor: darkMode ? "#000000" : "#fff",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img src={`${window.location.origin}/images/${darkMode ? "page404-dark.jpg" : "page404-light.jpg"}`} alt="Page Not Found" style={{ width: "250px", height: "auto" }} />
        <h4>Sorry, this page isn't available.</h4>
        <p className="grey">
          The link you followed may be broken, or the page may have been removed.
          {" "}
          <Link to="/">Go back to Outstagram.</Link>
        </p>
      </div>
    </div>
  );
}

export default PageNotFound;
