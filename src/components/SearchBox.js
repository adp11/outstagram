import React from "react";

function SearchBox() {
  return (
    <div className="SearchBox">
      <svg color="#8e8e8e" fill="#8e8e8e" height="16" role="img" viewBox="0 0 24 24" width="16">
        <path d="M19 10.5A8.5 8.5 0 1110.5 2a8.5 8.5 0 018.5 8.5z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.511" x2="22" y1="16.511" y2="22" />
      </svg>

      <input type="search" placeholder="Search" />
      <div className="dropdown">
        <div className="search-result">
          <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" className="user-avatar-in-search" />
          <div>
            <div className="bold medium">andrew.pham__</div>
            <div className="grey medium">Loc Pham</div>
          </div>
        </div>

        <div className="search-result">
          <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" className="user-avatar-in-search" />
          <div>
            <div className="bold medium">andrew.pham__</div>
            <div className="grey medium">Loc Pham</div>
          </div>
        </div>
        <div className="search-result">
          <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" className="user-avatar-in-search" />
          <div>
            <div className="bold medium">andrew.pham__</div>
            <div className="grey medium">Loc Pham</div>
          </div>
        </div>
        <div className="search-result">
          <img src={`${window.location.origin}/images/logo.png`} alt="user pic in search" className="user-avatar-in-search" />
          <div>
            <div className="bold medium">andrew.pham__</div>
            <div className="grey medium">Loc Pham</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchBox;
