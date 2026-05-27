import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import "./formsGeneration.css";

const API_URL = import.meta.env.VITE_API_URL;

function FormsGeneration() {
  const [farmers, setFarmers] = useState([]);
  const [beans, setBeans] = useState([]);
  const [errors, setErrors] = useState({});
  const [systemError, setSystemError] = useState("");

  const [form, setForm] = useState({
    farmerId: "",
    deliveryDT: "",
    beanOrigin: "",
    beanAltitude: "",
    remarks: "",
    receiverName: "",
    payorName: "",
  });

  const [rows, setRows] = useState([
    {
      arNo: "",
      beanId: "",
      volume: "",
      paymentDT: "",
      remarks2: "",
    },
  ]);

  const token = localStorage.getItem("token");
  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setSystemError("");

        const [farmersRes, beansRes] = await Promise.all([
          axios.get(`${API_URL}/api/farmers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/beans`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const farmerData = Array.isArray(farmersRes.data)
          ? farmersRes.data
          : farmersRes.data.data || [];

        const beanData = Array.isArray(beansRes.data)
          ? beansRes.data
          : beansRes.data.data || [];

        setFarmers(farmerData);

        setBeans(
          beanData.map((bean) => ({
            id: bean._id,
            name: bean.beanName || bean.name,
            pricePerUnit: Number(bean.pricePerUnit || bean.price || 0),
            unit: bean.unit,
          }))
        );
      } catch (err) {
        console.error("Fetch error:", err);
        setSystemError("Failed to load farmers and beans.");
      }
    };

    if (API && token) {
      fetchData();
    }
  }, [API, token]);

  const selectedFarmer = useMemo(() => {
    return farmers.find((f) => f._id === form.farmerId) || null;
  }, [farmers, form.farmerId]);

  const getBeanById = (id) => beans.find((b) => b.id === id);

  const computedRows = rows.map((row) => {
    const bean = getBeanById(row.beanId);
    const unitCost = Number(bean?.pricePerUnit || 0);
    const volume = Number(row.volume || 0);
    const totalAmount = unitCost * volume;

    return {
      ...row,
      particulars: bean?.name || "",
      unitCost,
      totalAmount,
      totalPayable: totalAmount,
    };
  });

  const grandTotal = computedRows.reduce(
    (sum, r) => sum + Number(r.totalAmount || 0),
    0
  );

  const amountToWords = (amount) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const convertHundreds = (num) => {
      let str = "";

      if (num > 99) {
        str += ones[Math.floor(num / 100)] + " Hundred ";
        num %= 100;
      }

      if (num > 19) {
        str += tens[Math.floor(num / 10)] + " ";
        num %= 10;
      }

      if (num > 0) {
        str += ones[num] + " ";
      }

      return str.trim();
    };

    const convert = (num) => {
      if (num === 0) return "Zero";

      let result = "";

      if (Math.floor(num / 1000000) > 0) {
        result += convertHundreds(Math.floor(num / 1000000)) + " Million ";
        num %= 1000000;
      }

      if (Math.floor(num / 1000) > 0) {
        result += convertHundreds(Math.floor(num / 1000)) + " Thousand ";
        num %= 1000;
      }

      if (num > 0) {
        result += convertHundreds(num);
      }

      return result.trim();
    };

    const wholeNumber = Math.floor(Number(amount || 0));

    return `${convert(wholeNumber)} Pesos Only`;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setSystemError("");
  };

  const handleRowChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );

    setErrors((prev) => {
      const updatedRowErrors = { ...(prev.rowErrors || {}) };

      if (updatedRowErrors[index]) {
        updatedRowErrors[index] = {
          ...updatedRowErrors[index],
          [field]: "",
        };
      }

      return {
        ...prev,
        rows: "",
        rowErrors: updatedRowErrors,
      };
    });

    setSystemError("");
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        arNo: "",
        beanId: "",
        volume: "",
        paymentDT: "",
        remarks2: "",
      },
    ]);

    setErrors((prev) => ({
      ...prev,
      rows: "",
    }));
  };

  const removeRow = (index) => {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );

    setErrors((prev) => ({
      ...prev,
      rows: "",
      rowErrors: {},
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const rowErrors = {};

    if (!selectedFarmer) {
      newErrors.farmerId = "Please select a farmer";
    }

    if (!form.deliveryDT) {
      newErrors.deliveryDT = "Delivery date required";
    }

    if (!form.beanOrigin.trim()) {
      newErrors.beanOrigin = "Required";
    }

    if (!form.beanAltitude.trim()) {
      newErrors.beanAltitude = "Required";
    }

    if (!form.receiverName.trim()) {
      newErrors.receiverName = "Required";
    }

    if (!form.payorName.trim()) {
      newErrors.payorName = "Required";
    }

    computedRows.forEach((row, index) => {
      const currentRowErrors = {};

      if (!row.arNo.trim()) {
        currentRowErrors.arNo = "AR No required";
      }

      const duplicateAr = computedRows.findIndex(
        (r, idx) =>
          idx !== index &&
          r.arNo.trim().toLowerCase() === row.arNo.trim().toLowerCase()
      );

      if (row.arNo.trim() && duplicateAr !== -1) {
        currentRowErrors.arNo = "Duplicate AR No not allowed";
      }

      if (!row.beanId) {
        currentRowErrors.beanId = "Select a bean";
      }

      if (!row.volume || Number(row.volume) <= 0) {
        currentRowErrors.volume = "Enter valid volume";
      }

      if (!row.paymentDT) {
        currentRowErrors.paymentDT = "Payment date required";
      }

      if (Object.keys(currentRowErrors).length > 0) {
        rowErrors[index] = currentRowErrors;
      }
    });

    if (Object.keys(rowErrors).length > 0) {
      newErrors.rows = "Complete all row fields";
      newErrors.rowErrors = rowErrors;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const buildDocData = () => ({
    idNumber: selectedFarmer?.farmerID || "",
    name: selectedFarmer?.name || "",
    sex: selectedFarmer?.sex || "",
    age: selectedFarmer?.age || "",
    residentialAddress: selectedFarmer?.residentialAddress || "",
    farmAddress: selectedFarmer?.farmAddress || "",
    contactNumber: selectedFarmer?.contactNumber || "",
    emailAddress: selectedFarmer?.emailAddress || "",
    deliveryDT: form.deliveryDT,
    beanOrigin: form.beanOrigin,
    beanAltitude: form.beanAltitude,
    remarks: form.remarks,
    receiverName: form.receiverName,
    payorName: form.payorName,
    amountInFigures: grandTotal,
    amountInWords: amountToWords(grandTotal),
    rows: computedRows,
  });

  const exportDocx = async () => {
    if (!validateForm()) return;

    try {
      setSystemError("");

      const response = await fetch("/templates/Sample_Palamboon.docx");
      const content = await response.arrayBuffer();

      const zip = new PizZip(content);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      doc.render(buildDocData());

      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(blob, `Form-${selectedFarmer?.name || "output"}.docx`);
    } catch (err) {
      console.error(err);
      setSystemError("DOCX generation failed.");
    }
  };

  const printTemplate = async () => {
    if (!validateForm()) return;

    try {
      setSystemError("");

      const res = await axios.post(`${API_URL}/api/forms/print`, buildDocData(), {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });

      const pdfBlob = new Blob([res.data], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(pdfBlob);

      const win = window.open(url);

      if (!win) {
        setSystemError("Popup blocked. Please allow popups for this site.");
        return;
      }

      win.onload = () => {
        win.print();
      };
    } catch (err) {
      console.error(err);
      setSystemError("Print failed.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Forms Generation</h2>

      {systemError && <div className="warning-bubble">{systemError}</div>}

      <div style={{ display: "grid", gap: "10px", maxWidth: "900px" }}>
        <div>
          <select
            name="farmerId"
            value={form.farmerId}
            onChange={handleFormChange}
            className={errors.farmerId ? "input-error" : ""}
          >
            <option value="">Select Farmer</option>
            {farmers.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
          </select>

          {errors.farmerId && (
            <small className="error-bubble">{errors.farmerId}</small>
          )}
        </div>

        <div>
          <input
            type="datetime-local"
            name="deliveryDT"
            value={form.deliveryDT}
            onChange={handleFormChange}
            onInput={(e) => e.target.blur()}
            className={errors.deliveryDT ? "input-error" : ""}
          />

          {errors.deliveryDT && (
            <small className="error-bubble">{errors.deliveryDT}</small>
          )}
        </div>

        <div>
          <input
            name="beanOrigin"
            placeholder="Bean Origin"
            value={form.beanOrigin}
            onChange={handleFormChange}
            className={errors.beanOrigin ? "input-error" : ""}
          />

          {errors.beanOrigin && (
            <small className="error-bubble">{errors.beanOrigin}</small>
          )}
        </div>

        <div>
          <input
            name="beanAltitude"
            placeholder="Bean Altitude"
            value={form.beanAltitude}
            onChange={handleFormChange}
            className={errors.beanAltitude ? "input-error" : ""}
          />

          {errors.beanAltitude && (
            <small className="error-bubble">{errors.beanAltitude}</small>
          )}
        </div>

        <div>
          <input
            name="remarks"
            placeholder="Remarks"
            value={form.remarks}
            onChange={handleFormChange}
          />
        </div>

        <div>
          <input
            name="receiverName"
            placeholder="Receiver Name"
            value={form.receiverName}
            onChange={handleFormChange}
            className={errors.receiverName ? "input-error" : ""}
          />

          {errors.receiverName && (
            <small className="error-bubble">{errors.receiverName}</small>
          )}
        </div>

        <div>
          <input
            name="payorName"
            placeholder="Payor Name"
            value={form.payorName}
            onChange={handleFormChange}
            className={errors.payorName ? "input-error" : ""}
          />

          {errors.payorName && (
            <small className="error-bubble">{errors.payorName}</small>
          )}
        </div>
      </div>

      <h3 style={{ marginTop: "20px" }}>Rows</h3>

      {errors.rows && <small className="error-bubble">{errors.rows}</small>}

      {rows.map((row, i) => {
        const bean = getBeanById(row.beanId);
        const unitCost = bean?.pricePerUnit || 0;
        const total = unitCost * (row.volume || 0);
        const rowError = errors.rowErrors?.[i] || {};

        return (
          <div
            key={i}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              display: "grid",
              gap: "10px",
            }}
          >
            <strong>Row {i + 1}</strong>

            <div>
              <input
                placeholder="AR No"
                value={row.arNo}
                onChange={(e) => handleRowChange(i, "arNo", e.target.value)}
                className={rowError.arNo ? "input-error" : ""}
              />

              {rowError.arNo && (
                <small className="error-bubble">{rowError.arNo}</small>
              )}
            </div>

            <div>
              <select
                value={row.beanId}
                onChange={(e) => handleRowChange(i, "beanId", e.target.value)}
                className={rowError.beanId ? "input-error" : ""}
              >
                <option value="">Select Bean</option>
                {beans.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              {rowError.beanId && (
                <small className="error-bubble">{rowError.beanId}</small>
              )}
            </div>

            <input value={unitCost} readOnly />

            <div>
              <input
                type="number"
                placeholder="Volume"
                value={row.volume}
                onChange={(e) => handleRowChange(i, "volume", e.target.value)}
                className={rowError.volume ? "input-error" : ""}
              />

              {rowError.volume && (
                <small className="error-bubble">{rowError.volume}</small>
              )}
            </div>

            <input value={total} readOnly />

            <div>
              <input
                type="datetime-local"
                value={row.paymentDT}
                onChange={(e) => {
                  handleRowChange(i, "paymentDT", e.target.value);
                  e.target.blur();
                }}
                className={rowError.paymentDT ? "input-error" : ""}
              />

              {rowError.paymentDT && (
                <small className="error-bubble">{rowError.paymentDT}</small>
              )}
            </div>

            <input
              placeholder="Remarks"
              value={row.remarks2}
              onChange={(e) => handleRowChange(i, "remarks2", e.target.value)}
            />

            <button onClick={() => removeRow(i)}>Remove</button>
          </div>
        );
      })}

      <button onClick={addRow}>+ Add Row</button>

      <div style={{ marginTop: "20px" }}>
        <h3>Grand Total: ₱{grandTotal.toFixed(2)}</h3>
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={exportDocx}>Export DOCX</button>
        <button onClick={printTemplate}>Print</button>
      </div>
    </div>
  );
}

export default FormsGeneration;