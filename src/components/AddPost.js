import React, { useEffect, useContext, useState } from "react";

function AddPost() {
  return (
    <div className="AddPost">
      <i className="fa-solid fa-xmark" style={{ position: "fixed", left: "97%", top: "2%", fontSize: "30px" }} />
      <div className="container">
        <div>
          <span className="bold">Create new post</span>
        </div>
        <form>
          <div className="file-upload-container">
            <label htmlFor="file-upload">
              <input id="file-upload" type="file" style={{ visibility: "hidden" }} />
              <svg stroke="#8e8e8e" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" d="M320 367.79h76c55 0 100-29.21 100-83.6s-53-81.47-96-83.6c-8.89-85.06-71-136.8-144-136.8-69 0-113.44 45.79-128 91.2-60 5.7-112 43.88-112 106.4s54 106.4 120 106.4h56" />
                <path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" d="M320 255.79l-64-64-64 64m64 192.42V207.79" />
              </svg>
              <small>File size limit 5 mb.</small>
            </label>
          </div>
          {/* override with 100% line 639 textarea */}
          <textarea style={{width: "75%"}} placeholder="Enter caption..." />
          <button type="button" className="btn btn-outline-primary">POST</button>
        </form>
        <div />
      </div>
    </div>
  );
}

export default AddPost;
