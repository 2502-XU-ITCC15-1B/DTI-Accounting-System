import { useState } from "react";

function FarmerManagement() {
  const [farmers, setFarmers] = useState([
    { id: 1, name: "Juan Dela Cruz", age: 45, address: "Bukidnon", crop: "Corn" },
    { id: 2, name: "Maria Santos", age: 39, address: "Misamis Oriental", crop: "Rice" },
  ]);

  const [form, setForm] = useState({
    id: null,
    name: "",
    age: "",
    address: "",
    crop: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.age || !form.address || !form.crop) {
      alert("Please fill in all fields.");
      return;
    }

    if (isEditing) {
      setFarmers((prev) =>
        prev.map((farmer) =>
          farmer.id === form.id ? { ...form, age: Number(form.age) } : farmer
        )
      );
      setIsEditing(false);
    } else {
      const newFarmer = {
        ...form,
        id: Date.now(),
        age: Number(form.age),
      };
      setFarmers((prev) => [...prev, newFarmer]);
    }

    setForm({
      id: null,
      name: "",
      age: "",
      address: "",
      crop: "",
    });
  };

  const handleEdit = (farmer) => {
    setForm(farmer);
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this farmer?");
    if (confirmDelete) {
      setFarmers((prev) => prev.filter((farmer) => farmer.id !== id));
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Farmer Management</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          name="name"
          placeholder="Farmer name"
          value={form.name}
          onChange={handleChange}
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={form.age}
          onChange={handleChange}
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
        />
        <input
          type="text"
          name="crop"
          placeholder="Main crop"
          value={form.crop}
          onChange={handleChange}
        />
        <button type="submit">
          {isEditing ? "Update Farmer" : "Add Farmer"}
        </button>
      </form>

      <table border="1" cellPadding="10" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Address</th>
            <th>Crop</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {farmers.length > 0 ? (
            farmers.map((farmer) => (
              <tr key={farmer.id}>
                <td>{farmer.name}</td>
                <td>{farmer.age}</td>
                <td>{farmer.address}</td>
                <td>{farmer.crop}</td>
                <td>
                  <button onClick={() => handleEdit(farmer)}>Edit</button>
                  <button onClick={() => handleDelete(farmer.id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No farmers found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default FarmerManagement;