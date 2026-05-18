import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import "./admin.css";

function BeanManagement({ beans, setBeans }) {
  const [form, setForm] = useState({
    id: null,
    name: "",
    pricePerUnit: "",
    unit: "kg",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  // LOAD FROM BACKEND
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
        setErrors({
          submit: "Failed to load beans.",
        });
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

    setErrors({});
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      submit: "",
    }));
  };

  // CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Bean name is required";
    }

    if (!form.pricePerUnit) {
      newErrors.pricePerUnit = "Price is required";
    }

    if (!form.unit.trim()) {
      newErrors.unit = "Unit is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

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

      setErrors({
        submit: "Failed to save bean.",
      });
    }
  };

  const handleEdit = (bean) => {
    setForm({
      id: bean.id,
      name: bean.name,
      pricePerUnit: bean.pricePerUnit,
      unit: bean.unit,
    });

    setErrors({});
    setIsEditing(true);
  };

  // DELETE
  const handleDelete = async (id) => {
    try {
      await authFetch(`/api/beans/${id}`, {
        method: "DELETE",
      });

      setBeans((prev) => prev.filter((bean) => bean.id !== id));
      setErrors({});
    } catch (err) {
      console.error(err);

      setErrors({
        submit: "Failed to delete bean.",
      });
    }
  };

  return (
    <div className="admin-container">
      <h2>Bean Management</h2>

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
            <div className="error-bubble">
              {errors.name}
            </div>
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
            <div className="error-bubble">
              {errors.pricePerUnit}
            </div>
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
            <div className="error-bubble">
              {errors.unit}
            </div>
          )}
        </div>

        {errors.submit && (
          <div className="warning-bubble">
            ⚠️ {errors.submit}
          </div>
        )}

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
                  <button onClick={() => handleEdit(bean)}>
                    Edit
                  </button>{" "}
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