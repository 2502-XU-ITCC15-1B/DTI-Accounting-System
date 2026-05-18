import { useEffect, useState } from "react";
import axios from "axios";
import "./delivery.css";

function DeliveryEntry() {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const [showForm, setShowForm] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [beans, setBeans] = useState([]);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});

  const [deleteId, setDeleteId] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const getRecordedBy = () => {
    if (user?.name && user?.position) return `${user.name} (${user.position})`;
    return user?.name || user?.username || "Unknown User";
  };

  const emptyForm = {
    farmer: "",
    farmerContact: "",
    beanType: "",
    courier: "",
    date: "",
    deliveryGuy: "",
    consignee: "",
    deliveryGuyContact: "",
    consigneeContact: "",
    recordedBy: getRecordedBy(),
    volume: "",
  };

  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const [dRes, fRes, bRes] = await Promise.all([
        axios.get(`${API}/api/deliveries`, authHeaders),
        axios.get(`${API}/api/farmers`, authHeaders),
        axios.get(`${API}/api/beans`, authHeaders),
      ]);

      setDeliveries(Array.isArray(dRes.data) ? dRes.data : dRes.data.data || []);
      setFarmers(Array.isArray(fRes.data) ? fRes.data : fRes.data.data || []);
      setBeans(Array.isArray(bRes.data) ? bRes.data : bRes.data.data || []);
    } catch (err) {
      console.error("FETCH ERROR:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to load delivery data.");
    }
  };

  useEffect(() => {
    if (API && token) fetchData();
  }, [API, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "deliveryGuyContact" || name === "consigneeContact") {
      const numbersOnly = value.replace(/\D/g, "").slice(0, 11);

      setForm((prev) => ({
        ...prev,
        [name]: numbersOnly,
      }));

      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));

      return;
    }

    if (name === "farmer") {
      const selectedFarmer = farmers.find((f) => f.name === value);

      setForm((prev) => ({
        ...prev,
        farmer: value,
        farmerContact:
          selectedFarmer?.contactNumber ||
          selectedFarmer?.farmerContact ||
          selectedFarmer?.contact ||
          "",
      }));

      setErrors((prev) => ({
        ...prev,
        farmer: "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const selectedBean = beans.find(
    (b) => b.beanName === form.beanType || b.name === form.beanType
  );

  const pricePerUnit = Number(selectedBean?.pricePerUnit || selectedBean?.price || 0);
  const volume = Number(form.volume || 0);
  const totalAmount = volume * pricePerUnit;

  const resetForm = () => {
    setForm({
      ...emptyForm,
      recordedBy: getRecordedBy(),
    });

    setFile(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.farmer) newErrors.farmer = "Select a farmer";
    if (!form.beanType) newErrors.beanType = "Select a bean type";

    if (!form.volume || Number(form.volume) <= 0) {
      newErrors.volume = "Enter a valid volume";
    }

    if (!form.courier) newErrors.courier = "Courier is required";
    if (!form.date) newErrors.date = "Pick a date";

    if (!form.deliveryGuy) {
      newErrors.deliveryGuy = "Delivery guy is required";
    }

    if (!form.deliveryGuyContact) {
      newErrors.deliveryGuyContact = "Enter contact number";
    } else if (form.deliveryGuyContact.length !== 11) {
      newErrors.deliveryGuyContact = "Must be 11 digits";
    }

    if (!form.consignee) {
      newErrors.consignee = "Consignee is required";
    }

    if (!form.consigneeContact) {
      newErrors.consigneeContact = "Enter contact number";
    } else if (form.consigneeContact.length !== 11) {
      newErrors.consigneeContact = "Must be 11 digits";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      const data = new FormData();

      data.append("farmer", form.farmer);
      data.append("farmerContact", form.farmerContact);
      data.append("beanType", form.beanType);
      data.append("courier", form.courier);
      data.append("date", form.date);
      data.append("deliveryGuy", form.deliveryGuy);
      data.append("consignee", form.consignee);
      data.append("deliveryGuyContact", form.deliveryGuyContact);
      data.append("consigneeContact", form.consigneeContact);
      data.append("recordedBy", form.recordedBy || getRecordedBy());
      data.append("volume", Number(form.volume));
      data.append("pricePerUnit", pricePerUnit);
      data.append("totalAmount", totalAmount);

      if (file) {
        data.append("proofOfDelivery", file);
      }

      const res = await axios.post(`${API}/api/deliveries`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const savedDelivery = res.data.data || res.data;

      setDeliveries((prev) => [savedDelivery, ...prev]);
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("SUBMIT ERROR:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to save delivery.");
    }
  };

  const openDelete = (id) => {
    setDeleteId(id);
    setDeletePassword("");
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deletePassword) {
      setDeleteError("Enter admin password");
      return;
    }

    try {
      await axios.delete(`${API}/api/deliveries/${deleteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { password: deletePassword },
      });

      setDeliveries((prev) => prev.filter((d) => d._id !== deleteId));

      setDeleteId(null);
      setDeletePassword("");
      setDeleteError("");
    } catch (err) {
      console.error("DELETE ERROR:", err.response?.data || err.message);
      setDeleteError(err.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <div className="delivery-container">
      <div className="delivery-header">
        <h2>Delivery Entry</h2>
      </div>

      {!showForm && (
        <>
          <div className="delivery-actions">
            <button className="add-btn" onClick={() => setShowForm(true)}>
              ＋ Add an Entry
            </button>
          </div>

          <div className="delivery-list">
            {deliveries.map((d) => (
              <div key={d._id} className="delivery-item">
                <span>
                  {d.farmer} • {d.beanType} • {d.date?.slice(0, 10)} • Volume:{" "}
                  {d.volume ?? 0} • Price: {d.pricePerUnit ?? 0} • Total:{" "}
                  {d.totalAmount ?? 0}
                </span>

                <button className="delete-btn" onClick={() => openDelete(d._id)}>
                  🗑 Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {deleteId && (
        <div className="modal">
          <div className="modal-box">
            <h3>Enter Admin Password</h3>

            <input
              type="password"
              value={deletePassword}
              className={deleteError ? "input-error" : ""}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeleteError("");
              }}
            />

            {deleteError && <span className="error-text">{deleteError}</span>}

            <div className="modal-actions">
              <button onClick={confirmDelete}>Confirm</button>

              <button
                onClick={() => {
                  setDeleteId(null);
                  setDeletePassword("");
                  setDeleteError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="form-grid">
          <div className="form-group">
            <label>Farmer</label>
            <select
              name="farmer"
              onChange={handleChange}
              value={form.farmer}
              className={errors.farmer ? "input-error" : ""}
            >
              <option value="">Select farmer</option>
              {farmers.map((f) => (
                <option key={f._id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
            {errors.farmer && (
              <small className="error-bubble">{errors.farmer}</small>
            )}
          </div>

          <div className="form-group">
            <label>Farmer Contact No.</label>
            <input value={form.farmerContact} readOnly />
          </div>

          <div className="form-group">
            <label>Bean Type</label>
            <select
              name="beanType"
              onChange={handleChange}
              value={form.beanType}
              className={errors.beanType ? "input-error" : ""}
            >
              <option value="">Select bean</option>
              {beans.map((b) => (
                <option key={b._id} value={b.beanName || b.name}>
                  {b.beanName || b.name}
                </option>
              ))}
            </select>
            {errors.beanType && (
              <small className="error-bubble">{errors.beanType}</small>
            )}
          </div>

          <div className="form-group">
            <label>Volume</label>
            <input
              type="number"
              name="volume"
              value={form.volume}
              onChange={handleChange}
              className={errors.volume ? "input-error" : ""}
            />
            {errors.volume && (
              <small className="error-bubble">{errors.volume}</small>
            )}
          </div>

          <div className="form-group">
            <label>Price per Unit</label>
            <input value={pricePerUnit} readOnly />
          </div>

          <div className="form-group">
            <label>Total Amount</label>
            <input value={totalAmount} readOnly />
          </div>

          <div className="form-group">
            <label>Courier</label>
            <input
              name="courier"
              value={form.courier}
              onChange={handleChange}
              className={errors.courier ? "input-error" : ""}
            />
            {errors.courier && (
              <small className="error-bubble">{errors.courier}</small>
            )}
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className={errors.date ? "input-error" : ""}
            />
            {errors.date && (
              <small className="error-bubble">{errors.date}</small>
            )}
          </div>

          <div className="form-group">
            <label>Delivery Guy</label>
            <input
              name="deliveryGuy"
              value={form.deliveryGuy}
              onChange={handleChange}
              className={errors.deliveryGuy ? "input-error" : ""}
            />
            {errors.deliveryGuy && (
              <small className="error-bubble">{errors.deliveryGuy}</small>
            )}
          </div>

          <div className="form-group">
            <label>Delivery Guy Contact No.</label>
            <input
              type="text"
              name="deliveryGuyContact"
              value={form.deliveryGuyContact}
              onChange={handleChange}
              maxLength={11}
              inputMode="numeric"
              placeholder="09XXXXXXXXX"
              className={errors.deliveryGuyContact ? "input-error" : ""}
            />
            {errors.deliveryGuyContact && (
              <small className="error-bubble">
                {errors.deliveryGuyContact}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Consignee</label>
            <input
              name="consignee"
              value={form.consignee}
              onChange={handleChange}
              className={errors.consignee ? "input-error" : ""}
            />
            {errors.consignee && (
              <small className="error-bubble">{errors.consignee}</small>
            )}
          </div>

          <div className="form-group">
            <label>Consignee Contact No.</label>
            <input
              type="text"
              name="consigneeContact"
              value={form.consigneeContact}
              onChange={handleChange}
              maxLength={11}
              inputMode="numeric"
              placeholder="09XXXXXXXXX"
              className={errors.consigneeContact ? "input-error" : ""}
            />
            {errors.consigneeContact && (
              <small className="error-bubble">
                {errors.consigneeContact}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Proof of Delivery</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </div>

          <div className="form-group">
            <label>Recorded By</label>
            <input value={form.recordedBy} readOnly />
          </div>

          <div className="form-actions">
            <button className="save-btn" onClick={handleSubmit}>
              Save
            </button>

            <button
              className="cancel-btn"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryEntry;