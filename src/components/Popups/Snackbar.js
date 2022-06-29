import React from "react";

function Snackbar({ snackBarMessage, setSnackBarMessage }) {
  return (
    <div
      className="Snackbar"
      style={{
        border: "1px black solid", width: "400px", padding: "20px 30px", borderRadius: "10px", position: "fixed", left: "calc(50% - 200px)", bottom: "0px", zIndex: "6",
      }}
    >
      <svg
        onClick={() => { setSnackBarMessage(null); }}
        height="18"
        role="img"
        viewBox="0 0 24 24"
        width="18"
        style={{
          position: "absolute", left: "45%", top: "10px", fontSize: "30px",
        }}
      >
        <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
      </svg>
      <div>{snackBarMessage}</div>
    </div>
  );
}

export default Snackbar;
