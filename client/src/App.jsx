import { useEffect, useState } from "react";
import Login from "./pages/Login";
import "./index.css";

function App() {
  const [message, setMessage] = useState("Loading...");
  const [dbTime, setDbTime] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(savedUser));
    }

    fetch(`${import.meta.env.VITE_API_URL}/api`)
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        setDbTime(data.databaseTime);
      })
      .catch(() => {
        setMessage("Failed to connect to backend");
      });
  }, []);

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // 🔐 Show login page
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // ✅ Wrapped with container
  return (
  <div className="app-layout">
      {/* LEFT SIDE */}
      <div className="main">
        <div className="header">
          <div className="logo">Logo</div>
          <h1 className="title">Dashboard</h1>
        </div>

        <div className="modules">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div key={num} className="module-card">
              <div className="icon">📄</div>
              <p>Module {num}</p>
            </div>
          ))}
        </div>

        <div className="status">
          <p>{message}</p>
          {dbTime && <p>Database time: {dbTime}</p>}
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
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