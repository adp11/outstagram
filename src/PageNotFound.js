import React from "react";
import { Link } from "react-router-dom";

function PageNotFound() {
  return (
    <div className="PageNotFound" style={{ display: "grid", placeItems: "center", height: "calc(100vh - 90px)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img src={`${window.location.origin}/images/page404.jpg`} alt="Page Not Found" style={{ width: "250px", height: "auto" }} />
        <h4>Sorry, this page isn't available.</h4>
        <p className="grey">
          The link you followed may be broken, or the page may have been removed.
          {" "}
          <Link to="/">Go back to Instagram.</Link>
        </p>
      </div>
    </div>
  );
}


export default PageNotFound;
