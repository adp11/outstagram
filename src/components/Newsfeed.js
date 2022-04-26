import React, { useEffect, useContext, useState } from "react";
import NewsfeedPost from "./NewsfeedPost";

function Newsfeed() {
  return (
    <div className="Newsfeed">
      <div className="newsfeed-container">
        <NewsfeedPost />
        <NewsfeedPost />
      </div>
    </div>
  );
}

export default Newsfeed;
