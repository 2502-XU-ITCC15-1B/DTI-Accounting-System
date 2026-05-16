import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import "./admin.css";

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [showPasswords, setShowPasswords] = useState(false);

  const [editUser, setEditUser] = useState(null);

  const [modal, setModal] = useState(null);

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    sex: "",
    age: "",
    position: "",
    role: "user",
  });

  const currentUser = JSON.parse(localStorage.getItem("user"));

  if (currentUser?.role !== "admin") {
    return <h1>Unauthorized</h1>;
  }

  // =========================
  // FETCH USERS
  // =========================
  const fetchUsers = async () => {
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/users`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to fetch users");
        return;
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error("FETCH USERS ERROR:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // =========================
  // CREATE USER
  // =========================
  const createUser = async () => {
    try {
      if (!form.name || !form.username || !form.password) {
        alert("Full name, username, and password are required");
        return;
      }

      if (form.password !== form.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      const res = await authFetch(`${import.meta.env.VITE_API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          password: form.password,
          sex: form.sex,
          age: form.age ? Number(form.age) : null,
          position: form.position,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || data.error || "Failed to create user");
        return;
      }

      setForm({
        name: "",
        username: "",
        password: "",
        confirmPassword: "",
        sex: "",
        age: "",
        position: "",
        role: "user",
      });

      fetchUsers();
    } catch (err) {
      console.error("CREATE USER ERROR:", err);
    }
  };

  // =========================
  // DELETE USER (ADMIN PASSWORD)
  // =========================
  const deleteUser = (id) => {
    setModal({
      type: "confirm",
      action: "delete",
      user: { _id: id },
      password: "",
    });
  };

  // =========================
  // EDIT USER
  // =========================
  const openEdit = (user) => {
    setEditUser({ ...user });
  };

  const submitEdit = () => {
    setModal({
      type: "confirm",
      action: "edit",
      user: editUser,
      password: "",
    });
  };

  // =========================
  // CONFIRM ACTION
  // =========================
  const handleConfirm = async () => {
    try {
      if (!modal) return;

      // DELETE
      if (modal.action === "delete") {
        const res = await authFetch(
          `${import.meta.env.VITE_API_URL}/users/${modal.user._id}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adminPassword: modal.password,
            }),
          }
        );

        const data = await res.json();
        if (!res.ok) return alert(data.message || "Delete failed");
      }

      // EDIT
      if (modal.action === "edit") {
        const res = await authFetch(
          `${import.meta.env.VITE_API_URL}/users/${modal.user._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            name: modal.user.name,
            username: modal.user.username,
            sex: modal.user.sex,
            age: modal.user.age,
            position: modal.user.position,
            role: modal.user.role,

            // ✅ ONLY SEND IF USER ENTERED ONE
            ...(modal.user.password
              ? { password: modal.user.password }
              : {}),

            adminPassword: modal.password,
          }),
          }
        );

        const data = await res.json();
        if (!res.ok) return alert(data.message || "Update failed");
      }

      setModal(null);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      console.error("CONFIRM ERROR:", err);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="admin-container">
      <h1>Admin Panel</h1>

      {/* CREATE USER */}
      <div className="admin-card">
        <h3>Create User</h3>

        <input
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />

        <div className="password-field">
          <input
            type={form.showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button
            type="button"
            className="eye-btn"
            onClick={() =>
              setForm({ ...form, showPassword: !form.showPassword })
            }
          >
            {form.showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="password-field">
          <input
            type={form.showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
          />

          <button
            type="button"
            className="eye-btn"
            onClick={() =>
              setForm({
                ...form,
                showConfirmPassword: !form.showConfirmPassword,
              })
            }
          >
            {form.showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>

        <select
          value={form.sex}
          onChange={(e) => setForm({ ...form, sex: e.target.value })}
        >
          <option value="">Select Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <input
          type="number"
          placeholder="Age"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
        />

        <input
          placeholder="Position"
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
        />

        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button className="admin-btn" onClick={createUser}>
          Create User
        </button>
      </div>

      {/* USER LIST */}
      <div className="admin-card">
        <h3>User List</h3>

        <div className="user-list">
          {users.map((u) => (
            <div key={u._id} className="user-item">
              <span>
                <strong>{u.name || u.username}</strong> — {u.role}
                <br />
                <small>
                  Username: {u.username}
                  <br />
                  Sex: {u.sex || "N/A"} • Age: {u.age || "N/A"} • Position:{" "}
                  {u.position || "N/A"}
                </small>
              </span>

              <div>
                <button onClick={() => openEdit(u)}>Edit</button>
                <button
                  className="delete-btn"
                  onClick={() => deleteUser(u._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editUser && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Edit User</h3>

            <input
              value={editUser.name}
              onChange={(e) =>
                setEditUser({ ...editUser, name: e.target.value })
              }
            />

            <input
              value={editUser.username}
              onChange={(e) =>
                setEditUser({ ...editUser, username: e.target.value })
              }
            />

            <div className="password-field">
              <input
                type={editUser.showPassword ? "text" : "password"}
                placeholder="New Password"
                value={editUser.password || ""}
                onChange={(e) =>
                  setEditUser({ ...editUser, password: e.target.value })
                }
              />

              <button
                type="button"
                className="eye-btn"
                onClick={() =>
                  setEditUser({
                    ...editUser,
                    showPassword: !editUser.showPassword,
                  })
                }
              >
                {editUser.showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="password-field">
              <input
                type={editUser.showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={editUser.confirmPassword || ""}
                onChange={(e) =>
                  setEditUser({
                    ...editUser,
                    confirmPassword: e.target.value,
                  })
                }
              />

              <button
                type="button"
                className="eye-btn"
                onClick={() =>
                  setEditUser({
                    ...editUser,
                    showConfirmPassword: !editUser.showConfirmPassword,
                  })
                }
              >
                {editUser.showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            <input
              placeholder="Sex"
              value={editUser.sex || ""}
              onChange={(e) =>
                setEditUser({ ...editUser, sex: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Age"
              value={editUser.age || ""}
              onChange={(e) =>
                setEditUser({ ...editUser, age: e.target.value })
              }
            />

            <input
              placeholder="Position"
              value={editUser.position || ""}
              onChange={(e) =>
                setEditUser({ ...editUser, position: e.target.value })
              }
            />

            <button onClick={submitEdit}>Save</button>
            <button onClick={() => setEditUser(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ADMIN CONFIRM MODAL */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>Enter admin password</p>

            <input
              type="password"
              value={modal.password}
              onChange={(e) =>
                setModal({ ...modal, password: e.target.value })
              }
            />

            <button onClick={handleConfirm}>Confirm</button>
            <button onClick={() => setModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;