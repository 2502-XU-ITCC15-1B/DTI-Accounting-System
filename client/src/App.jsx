import { useEffect, useState } from "react";
import Login from "./pages/Login";

function App() {
  const [message, setMessage] = useState("Loading...");
  const [dbTime, setDbTime] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
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

  // If not logged in → show login page
  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // After login → show your dashboard (current content)
  return (
    <div style={{ padding: "2rem" }}>
      <h1>DTI Accounting System</h1>
      <p>{message}</p>
      {dbTime && <p>Database time: {dbTime}</p>}
    </div>
  );
}

export default App;