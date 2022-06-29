import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import React, { useContext, useState } from "react";
import UserContext from "../Contexts/UserContext";

const IMAGE_PLACEHOLDER_URL = `${window.location.origin}/images/white_flag.gif`;

function Account() {
  const {
    userData, darkMode, setIsLoggedIn, setIsProfilePageNotFoundActive, setDarkMode,
  } = useContext(UserContext);
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const navigate = useNavigate();

  function toggleTheme() {
    const root = document.documentElement;
    const newTheme = root.className === "dark" ? "light" : "dark";
    root.className = newTheme;

    setIsDropdownActive(!isDropdownActive);
    setDarkMode(!darkMode);
  }

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
         {/* navigate(`/${userData.uid}`); */}
        <div onClick={() => { setIsProfilePageNotFoundActive(false); setIsDropdownActive(!isDropdownActive);  }}>
          <svg color="currentColor" fill="currentColor" height="20" role="img" viewBox="0 0 24 24" width="20">
            <circle cx="12.004" cy="12.004" fill="none" r="10.5" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" />
            <path d="M18.793 20.014a6.08 6.08 0 00-1.778-2.447 3.991 3.991 0 00-2.386-.791H9.38a3.994 3.994 0 00-2.386.791 6.09 6.09 0 00-1.779 2.447" fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" />
            <circle cx="12.006" cy="9.718" fill="none" r="4.109" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" />
          </svg>
          Profile
        </div>

        <div onClick={toggleTheme}>
          <svg style={{ width: "20px", height: "20px" }} viewBox="0 0 24 24">
            <path fill="currentColor" d="M7.5,2C5.71,3.15 4.5,5.18 4.5,7.5C4.5,9.82 5.71,11.85 7.53,13C4.46,13 2,10.54 2,7.5A5.5,5.5 0 0,1 7.5,2M19.07,3.5L20.5,4.93L4.93,20.5L3.5,19.07L19.07,3.5M12.89,5.93L11.41,5L9.97,6L10.39,4.3L9,3.24L10.75,3.12L11.33,1.47L12,3.1L13.73,3.13L12.38,4.26L12.89,5.93M9.59,9.54L8.43,8.81L7.31,9.59L7.65,8.27L6.56,7.44L7.92,7.35L8.37,6.06L8.88,7.33L10.24,7.36L9.19,8.23L9.59,9.54M19,13.5A5.5,5.5 0 0,1 13.5,19C12.28,19 11.15,18.6 10.24,17.93L17.93,10.24C18.6,11.15 19,12.28 19,13.5M14.6,20.08L17.37,18.93L17.13,22.28L14.6,20.08M18.93,17.38L20.08,14.61L22.28,17.15L18.93,17.38M20.08,12.42L18.94,9.64L22.28,9.88L20.08,12.42M9.63,18.93L12.4,20.08L9.87,22.27L9.63,18.93Z" />
          </svg>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </div>

        {/* eslint-disable-next-line */}
        <div onClick={() => { setIsDropdownActive(!isDropdownActive); logOut(); setIsLoggedIn(false); navigate("/")}}>
          <svg style={{ width: "20px", height: "20px" }} viewBox="0 0 24 24">
            <path fill="currentColor" d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z" />
          </svg>
          Log out
        </div>
      </div>
      )}
    </div>
  );
}

export default Account;
