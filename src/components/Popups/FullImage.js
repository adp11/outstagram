import React, { useEffect, useContext, useState } from "react";
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
      <img src={`${window.location.origin}/images/x-mark.png`} style={{ position: "fixed", left: "97%", top: "2%", fontSize: "30px", width: "30px", height: "30px" }} onClick={() => { setIsFullImageActive(false); setFullImageURL(null); }}></img>
      <div className="container">
        <img src={fullImageURL} alt="img" style={{ maxWidth: "80vh", maxHeight: "40vw", borderRadius: "10px" }} />
        <div />
      </div>
    </div>
  );
}

export default FullImage;
