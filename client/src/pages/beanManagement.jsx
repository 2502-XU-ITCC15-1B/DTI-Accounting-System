import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";

function BeanManagement({ beans, setBeans }) {
  const [form, setForm] = useState({
    id: null,
    name: "",
    pricePerUnit: "",
    unit: "kg",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  // 🔄 LOAD FROM BACKEND
  useEffect(() => {
    const fetchBeans = async () => {
      try {
        const res = await authFetch("/api/beans");
        const data = await res.json();

        const mapped = data.map((bean) => ({
          id: bean._id,
          name: bean.beanName,
          pricePerUnit: bean.pricePerUnit,
          unit: bean.unit,
          farmers: bean.farmers || [],
        }));

        setBeans(mapped);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBeans();
  }, [setBeans]);

  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      pricePerUnit: "",
      unit: "kg",
    });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // 🔥 CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.pricePerUnit || !form.unit.trim()) {
      const newErrors = {};
      if (!form.name.trim()) newErrors.name = "Bean name is required";
      if (!form.pricePerUnit) newErrors.pricePerUnit = "Price is required";
      if (!form.unit.trim()) newErrors.unit = "Unit is required";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    const beanData = {
      beanName: form.name.trim(),
      pricePerUnit: Number(form.pricePerUnit),
      unit: form.unit.trim(),
    };

    try {
      if (isEditing) {
        await authFetch(`/api/beans/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(beanData),
        });
      } else {
        await authFetch("/api/beans", {
          method: "POST",
          body: JSON.stringify(beanData),
        });
      }

      // refresh
      const res = await authFetch("/api/beans");
      const data = await res.json();

      setBeans(
        data.map((bean) => ({
          id: bean._id,
          name: bean.beanName,
          pricePerUnit: bean.pricePerUnit,
          unit: bean.unit,
          farmers: bean.farmers || [],
        }))
      );

      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (bean) => {
    setForm({
      id: bean.id,
      name: bean.name,
      pricePerUnit: bean.pricePerUnit,
      unit: bean.unit,
    });
    setIsEditing(true);
  };

  // 🔥 DELETE
  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this bean?");
    if (!confirmed) return;

    try {
      await authFetch(`/api/beans/${id}`, {
        method: "DELETE",
      });

      setBeans((prev) => prev.filter((bean) => bean.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

    const bubbleStyle = {
    background: "#fff4e5",
    border: "1px solid #f5c26b",
    color: "#8a5700",
    padding: "6px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    marginTop: "4px",
    display: "inline-block",
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Bean Management</h2>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "10px",
          marginBottom: "20px",
          maxWidth: "700px",
        }}
      >
        <div>
        <input
          type="text"
          name="name"
          placeholder="Bean name"
          value={form.name}
          onChange={handleChange}
        />
          {errors.name && (
          <div style={bubbleStyle}>{errors.name}</div>
          )}
        </div>

        <div>
        <input
          type="number"
          name="pricePerUnit"
          placeholder="Price per unit"
          value={form.pricePerUnit}
          onChange={handleChange}
        />
          {errors.pricePerUnit && (
          <div style={bubbleStyle}>{errors.pricePerUnit}</div>
          )}
        </div>

        <div>
        <input
          type="text"
          name="unit"
          placeholder="Unit"
          value={form.unit}
          onChange={handleChange}
        />
        {errors.unit && (
        <div style={bubbleStyle}>{errors.unit}</div>
        )}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit">
            {isEditing ? "Update Bean" : "Add Bean"}
          </button>

          {isEditing && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* TABLE */}
      <table border="1" cellPadding="10" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Bean Name</th>
            <th>Price Per Unit</th>
            <th>Unit</th>
            <th>Farmers</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {beans.length > 0 ? (
            beans.map((bean) => (
              <tr key={bean.id}>
                <td>{bean.name}</td>
                <td>{bean.pricePerUnit}</td>
                <td>{bean.unit}</td>
                <td>
                  {bean.farmers.length
                    ? bean.farmers.map((f) => f.name).join(", ")
                    : "No farmers"}
                </td>
                <td>
                  <button onClick={() => handleEdit(bean)}>Edit</button>{" "}
                  <button onClick={() => handleDelete(bean.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No beans found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default BeanManagement;