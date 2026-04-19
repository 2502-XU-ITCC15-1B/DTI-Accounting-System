import { useEffect, useRef, useState } from "react";
import Login from "./pages/Login";
import { authFetch } from "./utils/authFetch";
import "./index.css";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function App() {
  const [message, setMessage] = useState("Loading...");
  const [dbTime, setDbTime] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const timeoutRef = useRef(null);

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastActivity");
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const resetInactivityTimer = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    localStorage.setItem("lastActivity", Date.now().toString());

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      clearSession();
    }, SESSION_TIMEOUT);
  };

  useEffect(() => {
    const initializeApp = async () => {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      const lastActivity = localStorage.getItem("lastActivity");

      if (savedToken && savedUser) {
        const now = Date.now();

        if (!lastActivity || now - Number(lastActivity) > SESSION_TIMEOUT) {
          clearSession();
        } else {
          try {
            const res = await authFetch(`${import.meta.env.VITE_API_URL}/auth/me`);

            if (!res.ok) {
              clearSession();
            } else {
              const data = await res.json();
              setIsLoggedIn(true);
              setCurrentUser(data.user);

              const remainingTime = SESSION_TIMEOUT - (now - Number(lastActivity));

              timeoutRef.current = setTimeout(() => {
                clearSession();
              }, remainingTime);
            }
          } catch (error) {
            clearSession();
          }
        }
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api`);
        const data = await res.json();
        setMessage(data.message);
        setDbTime(data.databaseTime);
      } catch {
        setMessage("Failed to connect to backend");
      }
    };

    initializeApp();

    const activityEvents = ["mousemove", "keydown", "click", "scroll"];

    const handleActivity = () => {
      if (localStorage.getItem("token")) {
        resetInactivityTimer();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem("lastActivity", Date.now().toString());
    resetInactivityTimer();
  };

  const handleLogout = () => {
    clearSession();
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

const isAdmin = currentUser?.role === "admin";
// OR if using boolean:
// const isAdmin = currentUser?.isAdmin === true;

  return (
    <div className="app-layout">
      <div className="main">
        <div className="header">
          <div className="logo">Logo</div>
          <h1 className="title">Dashboard</h1>
        </div>

    <div className="modules">
      {[
        ...(isAdmin ? ["admin"] : []),
        1,
        2,
        3,
        4,
        5,
        6
      ].map((item) => (
        <div key={item} className="module-card">
          <div className="icon">📄</div>
          <p>
            {item === "admin" ? "Admin" : `Module ${item}`}
          </p>
        </div>
      ))}
    </div>

        <div className="status">
          <p>{message}</p>
          {dbTime && <p>Database time: {dbTime}</p>}
          {currentUser && <p>Logged in as: {currentUser.username}</p>}
        </div>
      </div>

      <div className="sidebar">
        <input className="search" placeholder="Search..." />

        <div className="section">
          <h4>Section Heading</h4>
          <ul>
            <li>Title</li>
            <li>Title</li>
            <li>Title</li>
          </ul>
        </div>

        <div className="section">
          <h4>Section Heading</h4>
          <ul>
            <li>Title</li>
            <li>Title</li>
          </ul>
        </div>

        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;