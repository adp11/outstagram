import React, {
  useContext, useEffect, useRef, useState,
} from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../Contexts/UserContext";

const SERVER_URL = "https://outstagram.onrender.com";

function SearchBox() {
  const { allUserData, setVisitedUserDataHelper } = useContext(UserContext);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const dropdownRef = useRef(null);
  const searchBoxRef = useRef(null);
  const navigate = useNavigate();

  function handleVisitProfile(_id) {
    const options = {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    };
    fetch(`${SERVER_URL}/api/users/${_id}`, options)
      .then((response) => {
        if (!response.ok) {
          return response.json().then(({ message }) => {
            throw new Error(message || response.status);
          });
        }
        return response.json();
      })
      .then((data) => {
        setIsSearchActive(false);
        setVisitedUserDataHelper(data);
        navigate(`/u/${_id}`);
      })
      .catch((err) => {
        setIsSearchActive(false);
        navigate(`/u/${_id}`);
      });
  }

  function useOutsideAlerter(ref1, ref2) {
    useEffect(() => {
      function handleClickOutside(event) {
        if ((ref1.current && ref2.current) && (!ref1.current.contains(event.target) && (!ref2.current.contains(event.target)))) {
          setIsSearchActive(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref1, ref2]);
  }

  function handleQuery(value) {
    if (value) {
      const filtered = allUserData.filter((data) => (data.username.toLowerCase().includes(value) || data.displayName.toLowerCase().includes(value)));
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }

  useOutsideAlerter(dropdownRef, searchBoxRef);

  return (
    <div className="SearchBox" ref={searchBoxRef}>
      <svg color="currentColor" fill="currentColor" height="16" role="img" viewBox="0 0 24 24" width="16">
        <path d="M19 10.5A8.5 8.5 0 1110.5 2a8.5 8.5 0 018.5 8.5z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.511" x2="22" y1="16.511" y2="22" />
      </svg>

      <input onFocus={() => { setIsSearchActive(true); }} onChange={(e) => { handleQuery(e.target.value.trim().toLowerCase()); }} type="search" placeholder="Search" maxLength="20" />

      {isSearchActive && (
      <div className="dropdown" ref={dropdownRef}>
        {searchResults.length ? searchResults.map((result) => (
          <div className="search-result" key={result._id} onClick={() => { handleVisitProfile(result._id); }}>
            <img src={result.photoURL} alt="user pic in search" className="user-avatar-in-search" />
            <div>
              <div className="bold medium cut1">{result.username}</div>
              <div className="grey medium">{result.displayName}</div>
            </div>
          </div>
        ))
          : <div className="no-result bold grey">No results found.</div>}
      </div>
      )}
    </div>
  );
}

export default SearchBox;
