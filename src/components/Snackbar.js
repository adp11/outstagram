import React from "react";

function Snackbar({ snackBarMessage, setSnackBarMessage }) {
  return (
    <div
      className="Snackbar"
      style={{
        border: "1px black solid", width: "400px", padding: "20px 30px", color: "white", backgroundColor: "#323232", borderRadius: "10px", position: "fixed", left: "calc(50% - 200px)", bottom: "0px", zIndex: "3",
      }}
    >
      <i className="fa-solid fa-xmark" style={{ position: "absolute", left: "95%", top: "7%" }} onClick={() => { setSnackBarMessage(null); }} />
      <div>{snackBarMessage}</div>
    </div>
  );
}

export default Snackbar;
