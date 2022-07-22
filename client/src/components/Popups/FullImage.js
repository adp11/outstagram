import React, { useEffect, useContext } from "react";
import UserContext from "../Contexts/UserContext";
import ChatContext from "../Contexts/ChatContext";

function FullImage() {
  const { setIsFullImageActive } = useContext(UserContext);
  const { fullImageURL, setFullImageURL } = useContext(ChatContext);

  useEffect(() => {
    function escape(e) {
      if (e.key === "Escape") {
        setIsFullImageActive(false);
        setFullImageURL(null);
      }
    }

    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <div className="FullImage">
      {/* eslint-disable-next-line */}
      <svg aria-label="Close" color="#262626" fill="#262626" height="18" role="img" viewBox="0 0 24 24" width="18" onClick={() => { setIsFullImageActive(false); setFullImageURL(null); }} style={{ position: "fixed", right: "10px", top: "10px", fontSize: "30px", width: "30px", height: "30px" }}>
        <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="#262626" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <line fill="none" stroke="#262626" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354" />
      </svg>
      <div className="container">
        <img src={fullImageURL} alt="img" style={{ maxWidth: "80vh", maxHeight: "40vw", borderRadius: "10px" }} />
        <div />
      </div>
    </div>
  );
}

export default FullImage;
