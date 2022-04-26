import React from "react";

function EditProfile() {
  return (
    <div className="EditPost" style={{ padding: "10px" }}>
      <i
        className="fa-solid fa-xmark"
        style={{
          position: "fixed", left: "97%", top: "2%", fontSize: "30px",
        }}
      />

      <div className="container">
        <div>
          <span style={{ fontWeight: "600" }}>Edit Profile</span>
        </div>
        <form>
          <div className="file-upload-container">
            <label id="file-upload" htmlFor="file-upload">
              <input id="file-upload" type="file" style={{ visibility: "hidden" }} />
              <svg stroke="white" fill="black" strokeWidth="0" viewBox="0 0 512 512" className="settings_profileIcon__3Vztt" xmlns="http://www.w3.org/2000/svg">
                <path d="M416 64H96a64.07 64.07 0 00-64 64v256a64.07 64.07 0 0064 64h320a64.07 64.07 0 0064-64V128a64.07 64.07 0 00-64-64zm-80 64a48 48 0 11-48 48 48.05 48.05 0 0148-48zM96 416a32 32 0 01-32-32v-67.63l94.84-84.3a48.06 48.06 0 0165.8 1.9l64.95 64.81L172.37 416zm352-32a32 32 0 01-32 32H217.63l121.42-121.42a47.72 47.72 0 0161.64-.16L448 333.84z" />
              </svg>
            </label>
          </div>
          <div className="form-row">
            <label className="bold">Username</label>
            <input type="text" placeholder="andrew.pham__" />
          </div>
          <div className="form-row">
            <label className="bold">Bio</label>
            <textarea placeholder="Something random" />
          </div>
          <button type="button" className="btn btn-outline-primary">SAVE</button>
        </form>
        <div />
      </div>
    </div>
  );
}

export default EditProfile;
