import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import Notifications from "./Notifications";
import Account from "./Account";
import SearchBox from "./SearchBox";
import UserContext from "../Contexts/UserContext";
import { db } from "../../firebase";

function Nav() {
  const {
    userData, darkMode, isSearchChatActive, scrollY, isFullImageActive, setIsAddPostActive, setUserDataHelper,
  } = useContext(UserContext);
  const navigate = useNavigate();

  function updateUnreadChatNotifs() {
    console.log("done reset unreadChatNotifs");
    // const options = {
    //   method: "PUT",
    //   mode: "cors",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     type: "chat",
    //   }),
    // };
    // fetch(`http://localhost:4000/users/${userData._id}/notifications`, options)
    //   .then((response) => response.json())
    //   .then((data) => {
    //     console.log("data got from backend", data);
    //     if (data.successMsg) {
    //       console.log("done reset unreadChatNotifs");
    //     } else {
    //       alert(data.successMsg);
    //     }
    //   });
  }

  function refresh() {
    navigate("/");
    window.scrollTo(0, 0);
  }

  return (
    <div className={`Nav ${(isSearchChatActive || isFullImageActive) ? "blur opac" : ""}`}>
      <div className="nav-container">
        <div onClick={refresh}>
          <img src={`${window.location.origin}/images/${darkMode ? "header-dark.png" : "header-light.png"}`} alt="Outstagram" className="header" />
        </div>
        <SearchBox />
        <div className="nav-buttons">
          {(window.location.pathname === "/") ? (
            <svg onClick={refresh} aria-label="Home" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
              <path d="M22 23h-6.001a1 1 0 01-1-1v-5.455a2.997 2.997 0 10-5.993 0V22a1 1 0 01-1 1H2a1 1 0 01-1-1V11.543a1.002 1.002 0 01.31-.724l10-9.543a1.001 1.001 0 011.38 0l10 9.543a1.002 1.002 0 01.31.724V22a1 1 0 01-1 1z" />
            </svg>
          ) : (
            <svg onClick={refresh} aria-label="Home" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
              <path d="M9.005 16.545a2.997 2.997 0 012.997-2.997h0A2.997 2.997 0 0115 16.545V22h7V11.543L12 2 2 11.543V22h7.005z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          )}

          {(/^\/rooms/.test(window.location.pathname) || /^\/r\//.test(window.location.pathname)) ? (
            <Link to="/rooms">
              <svg aria-label="Messenger" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
                <path d="M12.003 1.131a10.487 10.487 0 00-10.87 10.57 10.194 10.194 0 003.412 7.771l.054 1.78a1.67 1.67 0 002.342 1.476l1.935-.872a11.767 11.767 0 003.127.416 10.488 10.488 0 0010.87-10.57 10.487 10.487 0 00-10.87-10.57zm5.786 9.001l-2.566 3.983a1.577 1.577 0 01-2.278.42l-2.452-1.84a.63.63 0 00-.759.002l-2.556 2.049a.659.659 0 01-.96-.874L8.783 9.89a1.576 1.576 0 012.277-.42l2.453 1.84a.63.63 0 00.758-.003l2.556-2.05a.659.659 0 01.961.874z" />
              </svg>
            </Link>
          ) : (
            <Link to="/rooms">
              {/* eslint-disable-next-line */}
              <div style={{ position: "relative" }} onClick={updateUnreadChatNotifs}>
                <svg aria-label="Messenger" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
                  <path d="M12.003 2.001a9.705 9.705 0 110 19.4 10.876 10.876 0 01-2.895-.384.798.798 0 00-.533.04l-1.984.876a.801.801 0 01-1.123-.708l-.054-1.78a.806.806 0 00-.27-.569 9.49 9.49 0 01-3.14-7.175 9.65 9.65 0 0110-9.7z" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.739" />
                  <path d="M17.79 10.132a.659.659 0 00-.962-.873l-2.556 2.05a.63.63 0 01-.758.002L11.06 9.47a1.576 1.576 0 00-2.277.42l-2.567 3.98a.659.659 0 00.961.875l2.556-2.049a.63.63 0 01.759-.002l2.452 1.84a1.576 1.576 0 002.278-.42z" fillRule="evenodd" />
                </svg>
                {(userData.unreadChatNotifs > 0) && (
                <div
                  className="extrasmall bold"
                  style={{
                    position: "absolute", width: "17px", height: "17px", borderRadius: "50%", backgroundColor: "#ed4956", color: "#fff", textAlign: "center", top: "-4px", right: "-8px",
                  }}
                >
                  {userData.unreadChatNotifs > 9 ? "9+" : `${userData.unreadChatNotifs}`}
                </div>
                )}
              </div>
            </Link>
          )}

          <svg onClick={() => { setIsAddPostActive(true); scrollY.current = window.scrollY; }} className="Add" color="currentColor" fill="currentColor" height="24" width="24">
            <path d="M2 12v3.45c0 2.849.698 4.005 1.606 4.944.94.909 2.098 1.608 4.946 1.608h6.896c2.848 0 4.006-.7 4.946-1.608C21.302 19.455 22 18.3 22 15.45V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.7 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.547 2 5.703 2 8.552z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="6.545" x2="17.455" y1="12.001" y2="12.001" />
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="12.003" x2="12.003" y1="6.545" y2="17.455" />
          </svg>
          <Notifications />
          <Account />
        </div>
      </div>
    </div>
  );
}

export default Nav;
