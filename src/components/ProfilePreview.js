import React, { useEffect, useContext, useState } from "react";

function ProfilePreview() {
  return (
    <div className="ProfilePreview">
      <div className="user-profile">
        <div>
          <img src={`${window.location.origin}/images/logo.png`} alt="profile" />
        </div>
        <div>
          <div className="medium bold">andrew.pham__</div>
          <div className="medium grey">Loc Pham</div>
        </div>
        <div className="logout-shortcut">
          Log out
        </div>
      </div>
      <div className="stats medium">
        <div className="posts">
          <div className="bold medium">1</div>
          <div className="grey medium">Posts</div>
        </div>
        <div className="followers">
          <div className="bold medium">1</div>
          <div className="grey medium">Followers</div>
        </div>
        <div className="following">
          <div className="bold medium">4</div>
          <div className="grey medium">Following</div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePreview;
