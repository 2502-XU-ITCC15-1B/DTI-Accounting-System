import React, { useState } from "react";
import "./report.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const ReportModule = () => {
  const API = import.meta.env.VITE_API_URL;

  const [reportType, setReportType] = useState("both");
  const [rangeType, setRangeType] = useState("single");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i
  );

  const getAuthToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    const token = getAuthToken();

    if (!token) {
      setError("Please login to generate reports");
      setLoading(false);
      return;
    }

    if (!API) {
      setError("Missing VITE_API_URL. Check your frontend .env file.");
      setLoading(false);
      return;
    }

    try {
      let endpoint = `${API}/api/reports/`;
      const body = { reportType };

      if (rangeType === "single") {
        endpoint += "monthly";
        body.month = month;
        body.year = year;
      } else {
        endpoint += "multi-month";
        body.startMonth = startMonth;
        body.startYear = startYear;
        body.endMonth = endMonth;
        body.endYear = endYear;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Failed to generate report"
        );
      }

      setReportData(result);
    } catch (err) {
      console.error("REPORT ERROR:", err);
      setError(err.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!reportData) {
      setError("Please generate a report first.");
      return;
    }

    setTimeout(() => {
      window.print();
    }, 300);
  };

  const exportPDF = async () => {
    const report = document.getElementById("report-content");

    if (!report) {
      setError("Please generate a report first.");
      return;
    }

    try {
      setExporting(true);

      const canvas = await html2canvas(report, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("DTI-Coffee-Bean-Report.pdf");
    } catch (err) {
      console.error("PDF EXPORT ERROR:", err);
      setError("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <div className="report-module">
      <div className="report-header no-print">
        <div>
          <h2>Monthly Report Generation</h2>
          <p>Generate consolidated reports for coffee bean transactions</p>
        </div>

        <div className="report-actions">
          <button onClick={handlePrint} className="print-btn">
            🖨️ Print
          </button>

          <button
            onClick={exportPDF}
            className="print-btn"
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "📄 Export PDF"}
          </button>
        </div>
      </div>

      <div className="report-controls no-print">
        <div className="form-group">
          <label>Report Type:</label>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="per-farmer">👨‍🌾 Per-Farmer Report</option>
            <option value="organization">🏢 Organization-Wide Report</option>
            <option value="both">📋 Combined Report</option>
          </select>
        </div>

        <div className="form-group">
          <label>Date Range:</label>

          <select
            value={rangeType}
            onChange={(e) => setRangeType(e.target.value)}
          >
            <option value="single">📅 Single Month</option>
            <option value="range">📆 Month Range</option>
          </select>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="generate-btn"
        >
          {loading ? "⏳ Generating..." : "🚀 Generate Report"}
        </button>
      </div>

      {error && (
        <div className="warning-bubble no-print">
          ⚠️ {error}
        </div>
      )}

      {reportData && (
        <div className="report-content" id="report-content">
          <div className="report-title">
            <h2>DTI Coffee Bean Trading Report</h2>

            <p>
              {rangeType === "single"
                ? `${months[month - 1]} ${year}`
                : `${months[startMonth - 1]} ${startYear} - ${
                    months[endMonth - 1]
                  } ${endYear}`}
            </p>

            <p className="generated-date">
              Generated on: {new Date().toLocaleString()}
            </p>
          </div>

          <div className="organization-summary">
            <div className="summary-cards">
              <div className="card">
                <h4>Total Deliveries</h4>

                <p>
                  {reportData?.data?.organization?.totalDeliveries || 0}
                </p>
              </div>

              <div className="card">
                <h4>Volume Sold</h4>

                <p>
                  {(
                    reportData?.data?.organization?.totalVolumeSold || 0
                  ).toFixed(2)}{" "}
                  kg
                </p>
              </div>

              <div className="card">
                <h4>Sales Generated</h4>

                <p>
                  {formatCurrency(
                    reportData?.data?.organization?.totalSalesGenerated
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportModule;