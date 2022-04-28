import "./App.css";
import React, {
  useEffect, useContext, useState, useMemo,
} from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav/Nav";
import Newsfeed from "./components/Newsfeed";
import ProfilePreview from "./components/ProfilePreview";
import Profile from "./components/Profile";
import Auth from "./components/Auth/Auth";
// import AddPost from "./components/AddPost";
// import FullPost from "./components/FullPost";
// import EditProfile from "./components/EditProfile";
// import NewsfeedPost from "./components/NewsfeedPost";
// import app from "./firebase";
import UserContext from "./components/Contexts/UserContext";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const providerValue = useMemo(() => ({ setIsLoggedIn, setUserData }), [setIsLoggedIn, setUserData]);

  return (
    <BrowserRouter>
      <div className="App">
        <UserContext.Provider value={providerValue}>
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
            <Route path="/a" element={<Profile />} />
          </Routes>
          )}
        </UserContext.Provider>
      </div>
    </BrowserRouter>
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
