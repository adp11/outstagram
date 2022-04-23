import React, { useEffect, useContext, useState } from "react";

function NewsfeedPost() {
  return (
    <div className="NewsfeedPost">
      <div className="user-preview" style={{ padding: "20px" }}>
        <img className="user-picture" src={`${window.location.origin}/images/logo.png`} alt="" />
        <span className="username">andrew.pham___</span>
      </div>
      <img className="post-picture" src={`${window.location.origin}/images/sample.png`} alt="author's pic" />
      <div style={{ padding: "10px 20px", display: "flex", gap: "20px" }} className="post-btns">
        <svg className="like" color="#262626" fill="#262626" height="24" width="24"><path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938m0-2a6.04 6.04 0 00-4.797 2.127 6.052 6.052 0 00-4.787-2.127A6.985 6.985 0 00.5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 003.518 3.018 2 2 0 002.174 0 45.263 45.263 0 003.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 00-6.708-7.218z" /></svg>
        <svg className="comment" color="black" fill="#8e8e8e" height="24" viewBox="0 0 24 24" width="24"><path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" /></svg>
        <svg className="share" color="black" fill="#8e8e8e" height="24" role="img" viewBox="0 0 24 24" width="24">
          <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083" />
          <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </div>
      {/* eslint-disable-next-line */}
      <div className="post-likes" style={{ marginBottom: "10px" }}>Liked by <span className="username">andrew.pham__</span> and <span>50 others</span></div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <div className="post-caption">
          {/* eslint-disable-next-line */}
          <span className="username">andrew.pham___</span> Another day in paradise… And it’s only Monday ☠️☠️.
        </div>
        <div className="post-all-comments" style={{ color: "#8e8e8e" }}>View all 10 comments</div>
        <div>Comment snippet</div>
        <div style={{ color: "#8e8e8e", fontSize: "10px" }}>1 DAY AGO</div>
      </div>
      <form className="post-comment-box">
        <textarea type="text" placeholder="Add a comment..." />
        <span className="post-btn" type="submit">Post</span>
      </form>
    </div>
  );
}

export default NewsfeedPost;
