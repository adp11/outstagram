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
          {/* style={{ visibility: "hidden" }} */}
          <div className="file-upload-container">
            <label id="file-upload" htmlFor="file-upload">
              <input id="file-upload" type="file" style={{ visibility: "hidden" }} />
            </label>
          </div>
          <div className="form-row">
            <label>Username</label>
            <input type="text" placeholder="andrew.pham__" />
          </div>
          <div className="form-row">
            <label>Bio</label>
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
