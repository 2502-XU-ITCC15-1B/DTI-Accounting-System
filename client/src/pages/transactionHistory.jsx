import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import "./transactions.css";

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [details, setDetails] = useState({});
  const [amounts, setAmounts] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/transactions`
      );

      const data = await res.json();
      setTransactions(data.data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setErrors((prev) => ({
        ...prev,
        global: "Failed to load transactions.",
      }));
    }
  };

  const fetchDetails = async (id) => {
    try {
      const res = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/transactions/${id}`
      );

      const data = await res.json();

      setDetails((prev) => ({
        ...prev,
        [id]: data,
      }));
    } catch (err) {
      console.error("Error fetching details:", err);
      setErrors((prev) => ({
        ...prev,
        [id]: "Failed to load transaction details.",
      }));
    }
  };

  const toggle = (id) => {
    const newId = openId === id ? null : id;
    setOpenId(newId);

    setErrors((prev) => ({
      ...prev,
      [id]: "",
    }));

    if (newId) fetchDetails(id);
  };

  const addPayment = async (id) => {
    const amount = Number(amounts[id] || 0);
    const balance = Number(details[id]?.summary?.balance || 0);

    setErrors((prev) => ({
      ...prev,
      [id]: "",
    }));

    if (balance <= 0) {
      setErrors((prev) => ({
        ...prev,
        [id]: "This transaction is already fully paid.",
      }));
      return;
    }

    if (amount <= 0) {
      setErrors((prev) => ({
        ...prev,
        [id]: "Payment must be greater than 0.",
      }));
      return;
    }

    if (amount > balance) {
      setErrors((prev) => ({
        ...prev,
        [id]: `Payment exceeds remaining balance of ₱${balance}.`,
      }));
      return;
    }

    try {
      await authFetch(`${import.meta.env.VITE_API_URL}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryId: id,
          amountPaid: amount,
        }),
      });

      setAmounts((prev) => ({
        ...prev,
        [id]: "",
      }));

      await fetchDetails(id);
    } catch (err) {
      console.error("Error adding payment:", err);

      setErrors((prev) => ({
        ...prev,
        [id]: "Failed to add payment.",
      }));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Transactions</h2>

      {errors.global && (
        <div className="warning-bubble">
          ⚠️ {errors.global}
        </div>
      )}

      {transactions.map((t) => {
        const data = details[t._id];
        const summary = data?.summary;
        const payments = data?.payments;

        const balance = Number(summary?.balance || 0);
        const isFullyPaid = summary && balance <= 0;

        return (
          <div
            key={t._id}
            style={{
              border: "1px solid #ddd",
              marginBottom: 10,
              padding: 10,
              borderRadius: 6,
              background: "#fff",
            }}
          >
            <div
              onClick={() => toggle(t._id)}
              style={{
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <strong>{t.farmerName}</strong>
              <span>₱{t.amount}</span>
            </div>

            {openId === t._id && (
              <div style={{ marginTop: 10 }}>
                {errors[t._id] && (
                  <div className="warning-bubble">
                    ⚠️ {errors[t._id]}
                  </div>
                )}

                <p>Bean: {t.beanType}</p>
                <p>Date: {new Date(t.date).toLocaleDateString()}</p>

                <hr />

                {summary ? (
                  <>
                    <p>Total: ₱{t.amount}</p>
                    <p>Paid: ₱{summary.totalPaid}</p>
                    <p>Balance: ₱{balance}</p>
                    <p>Status: {isFullyPaid ? "Fully Paid" : summary.status}</p>
                  </>
                ) : (
                  <p>Loading summary...</p>
                )}

                <hr />

                <h4>Payments</h4>

                {payments?.length > 0 ? (
                  payments.map((p) => (
                    <p key={p._id}>₱{p.amountPaid}</p>
                  ))
                ) : (
                  <p>No payments yet</p>
                )}

                <hr />

                {isFullyPaid ? (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#dcfce7",
                      color: "#166534",
                      fontWeight: 600,
                      width: "fit-content",
                    }}
                  >
                    Fully Paid
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={`Enter payment (max ₱${balance})`}
                      value={amounts[t._id] || ""}
                      onChange={(e) => {
                        setAmounts((prev) => ({
                          ...prev,
                          [t._id]: e.target.value,
                        }));

                        setErrors((prev) => ({
                          ...prev,
                          [t._id]: "",
                        }));
                      }}
                    />

                    <button
                      onClick={() => addPayment(t._id)}
                      style={{ marginLeft: 10 }}
                    >
                      Add Payment
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TransactionHistory;