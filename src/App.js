import "./App.css";
import React, {
  useEffect, useContext, useState, useMemo, useRef,
} from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Nav from "./components/Nav/Nav";
import Newsfeed from "./components/Newsfeed";
import ProfilePreview from "./components/ProfilePreview";
import Profile from "./components/Profile";
import Auth from "./components/Auth/Auth";
import AddPost from "./components/AddPost";
// import FullPost from "./components/FullPost";
// import EditProfile from "./components/EditProfile";
// import NewsfeedPost from "./components/NewsfeedPost";
// import app from "./firebase";
import UserContext from "./components/Contexts/UserContext";
import { db } from "./firebase";
import EditProfile from "./components/EditProfile";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAddPostActive, setIsAddPostActive] = useState(false);
  const [isEditProfileActive, setIsEditProfileActive] = useState(false);
  const [userData, setUserData] = useState(null);
  // console.log("first", isLoggedIn);

  const providerValue = useMemo(() => ({
    setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, userData, setUserData,
  }), [setIsLoggedIn, setIsAddPostActive, setIsEditProfileActive, userData, setUserData]);

  useEffect(() => {
    async function fetchUserData() {
      const docRef = doc(db, `users/uid_${getAuth().currentUser.uid}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
      console.log(userData, "fetchUserDatatriggered", docSnap.data());
    }
    console.log("useeffect triggered ", isLoggedIn);
    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn]);

  return (
    <div>
      <BrowserRouter>
        <UserContext.Provider value={providerValue}>
          <div className={`App ${(isAddPostActive || isEditProfileActive) ? "blur" : ""}`}>
            {!isLoggedIn && <Auth />}
            {isLoggedIn && <Nav />}
            {isLoggedIn && (
            <Routes>
              <Route
                path="/"
                element={(
                  <>
                    <Newsfeed />
                    <ProfilePreview />
                  </>
)}
              />
              <Route path="/:uid" element={<Profile />} />
            </Routes>
            )}
          </div>
          {isAddPostActive && <AddPost />}
          {isEditProfileActive && <EditProfile />}
        </UserContext.Provider>
      </BrowserRouter>
    </div>

  );
}

export default App;

{ /* <AddPost />
<EditProfile />
<FullPost />
<Routes>
  <Route
    path="/a"
    element={(
      <>
        <Newsfeed />
        <ProfilePreview />
      </>
)}
  />
  <Route path="/a" element={<Profile />} />
</Routes> */ }
