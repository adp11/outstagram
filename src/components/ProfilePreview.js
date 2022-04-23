import React, { useEffect, useContext, useState } from "react";

function ProfilePreview() {
  return (
    <div className="ProfilePreview">
      <div className="profile-card">
        <img src={`${window.location.origin}/images/logo.png`} alt="profile" />
        <div>
          <div className="username">andrew.pham__</div>
          <div className="fullname">Loc Pham</div>
        </div>
        <div className="logout-shortcut">
          Log out
        </div>
      </div>
      <div className="stats">
        <div className="posts">
          <div>1</div>
          <div>Posts</div>
        </div>
        <div className="followers">
          <div>1</div>
          <div>Followers</div>
        </div>
        <div className="following">
          <div>4</div>
          <div>Following</div>
        </div>

      </div>
    </div>
  );
}

export default ProfilePreview;
