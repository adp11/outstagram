import React, { useEffect, useContext, useState } from "react";
import NewsfeedPost from "./NewsfeedPost";

function Newsfeed() {
  return (
    <div className="Newsfeed">
      <NewsfeedPost />
      <NewsfeedPost />
    </div>
  );
}

export default Newsfeed;
