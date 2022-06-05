import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import React, { useContext, useState } from "react";
import UserContext from "../Contexts/UserContext";

const IMAGE_PLACEHOLDER_URL = `${window.location.origin}/images/white_flag.gif`;

function Account() {
  const { setIsLoggedIn, userData, setIsProfilePageNotFoundActive } = useContext(UserContext);
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const navigate = useNavigate();

  function logOut() {
    signOut(getAuth());
  }

  return (
    <div className="Account">
      <div className="profile-avatar" onClick={() => { setIsDropdownActive(!isDropdownActive); }}>
        <img
          src={userData ? userData.photoURL : IMAGE_PLACEHOLDER_URL}
          alt="pic"
          style={{ width: "26px", height: "26px", borderRadius: "50%" }}
        />
      </div>
      {isDropdownActive && (
      <div className="dropdown">
        <div onClick={() => { setIsProfilePageNotFoundActive(false); setIsDropdownActive(!isDropdownActive); navigate(`/${userData.uid}`); }}>
          <svg color="#262626" fill="#262626" height="20" role="img" viewBox="0 0 24 24" width="20">
            <circle cx="12.004" cy="12.004" fill="none" r="10.5" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" />
            <path d="M18.793 20.014a6.08 6.08 0 00-1.778-2.447 3.991 3.991 0 00-2.386-.791H9.38a3.994 3.994 0 00-2.386.791 6.09 6.09 0 00-1.779 2.447" fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" />
            <circle cx="12.006" cy="9.718" fill="none" r="4.109" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" />
          </svg>
          Profile
        </div>

        <div>
          <img src={`${window.location.origin}/images/light-mode.png`} alt="light-mode" />
          Toggle theme
        </div>

        {/* eslint-disable-next-line */}
        <div onClick={() => { setIsDropdownActive(!isDropdownActive); logOut(); setIsLoggedIn(false); navigate("/")}}>
          <img src={`${window.location.origin}/images/logout.png`} alt="logout" />
          Log out
        </div>
      </div>
      )}
    </div>
  );
}

export default Account;
