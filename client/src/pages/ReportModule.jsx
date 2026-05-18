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
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
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
      setError(null);

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

  const getOrganization = () => {
    return reportData?.data?.organization || reportData?.organization || null;
  };

  const getPerFarmer = () => {
    if (rangeType === "single") {
      return reportData?.data?.perFarmer || reportData?.perFarmer || [];
    }

    return reportData?.perFarmer || reportData?.data?.perFarmer || [];
  };

  const getMonthlyArray = () => {
    if (Array.isArray(reportData?.data)) return reportData.data;
    if (Array.isArray(reportData?.data?.monthlyData)) return reportData.data.monthlyData;
    if (Array.isArray(reportData?.monthlyData)) return reportData.monthlyData;
    return [];
  };

  const renderSalesChart = () => {
    if (!reportData) return null;

    if (rangeType === "single") {
      const org = getOrganization();
      if (!org) return null;

      const barData = {
        labels: ["Volume Sold (kg)", "Sales Generated (₱)"],
        datasets: [
          {
            label: "Current Month",
            data: [org.totalVolumeSold || 0, org.totalSalesGenerated || 0],
            backgroundColor: ["#4CAF50", "#2196F3"],
            borderColor: ["#388E3C", "#1976D2"],
            borderWidth: 1,
          },
        ],
      };

      let pieData = null;

      if (org.beanTypeSummary && Object.keys(org.beanTypeSummary).length > 0) {
        pieData = {
          labels: Object.keys(org.beanTypeSummary),
          datasets: [
            {
              label: "Sales by Bean Type",
              data: Object.values(org.beanTypeSummary).map(
                (v) => v.salesGenerated || 0
              ),
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
              ],
            },
          ],
        };
      }

      return (
        <div className="charts-grid">
          <div className="chart-card">
            <h4>Monthly Summary</h4>
            <div className="chart-wrapper-small">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>

          {pieData && (
            <div className="chart-card">
              <h4>Sales by Bean Type</h4>
              <div className="chart-wrapper-small">
                <Pie
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    const monthlyData = getMonthlyArray();

    if (rangeType === "range" && monthlyData.length > 0) {
      const lineData = {
        labels: monthlyData.map((d) =>
          d.monthName
            ? `${d.monthName} ${d.year}`
            : `${months[(d.month || 1) - 1]} ${d.year}`
        ),
        datasets: [
          {
            label: "Volume Sold (kg)",
            data: monthlyData.map(
              (d) => d.organization?.totalVolumeSold || d.totalVolumeSold || 0
            ),
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "Sales Generated (₱)",
            data: monthlyData.map(
              (d) =>
                d.organization?.totalSalesGenerated ||
                d.totalSalesGenerated ||
                0
            ),
            borderColor: "#FF9800",
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      };

      return (
        <div className="chart-card full-width">
          <h4>Trend Analysis</h4>
          <div className="chart-wrapper-large">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>
      );
    }

    return null;
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

        {rangeType === "single" ? (
          <>
            <div className="form-group">
              <label>Month:</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Year:</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Start Month:</label>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Start Year:</label>
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>End Month:</label>
              <select
                value={endMonth}
                onChange={(e) => setEndMonth(Number(e.target.value))}
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>End Year:</label>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <button
          onClick={generateReport}
          disabled={loading}
          className="generate-btn"
        >
          {loading ? "⏳ Generating..." : "🚀 Generate Report"}
        </button>
      </div>

      {error && <div className="warning-bubble no-print">⚠️ {error}</div>}

      {reportData && (
        <div className="report-content" id="report-content">
          <div className="report-title">
            <h2>DTI Coffee Bean Trading Report</h2>
            <p>
              {rangeType === "single"
                ? `${months[month - 1]} ${year}`
                : `${months[startMonth - 1]} ${startYear} — ${
                    months[endMonth - 1]
                  } ${endYear}`}
            </p>
            <p className="generated-date">
              Generated on: {new Date().toLocaleString()}
            </p>
          </div>

          <div className="charts-section">
            <h3>Visual Analytics</h3>
            {renderSalesChart()}
          </div>

          {reportType !== "per-farmer" &&
            rangeType === "single" &&
            getOrganization() && (
              <div className="organization-summary">
                <h3>Organization-Wide Summary</h3>

                <div className="summary-cards">
                  <div className="card">
                    <h4>Total Deliveries</h4>
                    <p>{getOrganization().totalDeliveries || 0}</p>
                    <small>deliveries recorded</small>
                  </div>

                  <div className="card">
                    <h4>Volume Sold</h4>
                    <p>
                      {(getOrganization().totalVolumeSold || 0).toFixed(2)} kg
                    </p>
                    <small>coffee beans</small>
                  </div>

                  <div className="card">
                    <h4>Sales Generated</h4>
                    <p>
                      {formatCurrency(getOrganization().totalSalesGenerated)}
                    </p>
                    <small>total revenue</small>
                  </div>

                  <div className="card">
                    <h4>Active Farmers</h4>
                    <p>{getOrganization().uniqueFarmers || 0}</p>
                    <small>with transactions</small>
                  </div>
                </div>

                {getOrganization().beanTypeSummary &&
                  Object.keys(getOrganization().beanTypeSummary).length > 0 && (
                    <div className="bean-breakdown">
                      <h4>Bean Type Breakdown</h4>

                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>Bean Type</th>
                            <th>Volume Sold (kg)</th>
                            <th>Sales Generated</th>
                          </tr>
                        </thead>

                        <tbody>
                          {Object.entries(
                            getOrganization().beanTypeSummary
                          ).map(([beanType, data]) => (
                            <tr key={beanType}>
                              <td>
                                <strong>{beanType}</strong>
                              </td>
                              <td>{(data.volumeSold || 0).toFixed(2)}</td>
                              <td>{formatCurrency(data.salesGenerated)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            )}

          {rangeType === "range" && getMonthlyArray().length > 0 && (
            <div className="monthly-breakdown">
              <h3>Monthly Breakdown</h3>

              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Deliveries</th>
                      <th>Volume Sold (kg)</th>
                      <th>Sales Generated</th>
                      <th>Active Farmers</th>
                    </tr>
                  </thead>

                  <tbody>
                    {getMonthlyArray().map((monthData, idx) => {
                      const org = monthData.organization || monthData;

                      return (
                        <tr key={idx}>
                          <td>
                            <strong>
                              {monthData.monthName ||
                                months[(monthData.month || 1) - 1]}{" "}
                              {monthData.year}
                            </strong>
                          </td>
                          <td>{org.totalDeliveries || 0}</td>
                          <td>{(org.totalVolumeSold || 0).toFixed(2)}</td>
                          <td>{formatCurrency(org.totalSalesGenerated)}</td>
                          <td>{org.uniqueFarmers || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType !== "organization" && getPerFarmer().length > 0 && (
            <div className="farmer-table-container">
              <h3>👨‍🌾 Per-Farmer Report</h3>

              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Farmer ID</th>
                      <th>Farmer Name</th>
                      <th>Address</th>
                      <th>Contact</th>
                      <th>Deliveries</th>
                      <th>Volume Sold (kg)</th>
                      <th>Sales Generated</th>
                    </tr>
                  </thead>

                  <tbody>
                    {getPerFarmer().map((farmer, idx) => (
                      <tr key={idx}>
                        <td>{farmer.farmerId || farmer.farmerID || "-"}</td>
                        <td>
                          <strong>{farmer.farmerName || farmer.name}</strong>
                        </td>
                        <td>{farmer.farmerAddress || farmer.address || "-"}</td>
                        <td>{farmer.contactNumber || farmer.contact || "-"}</td>
                        <td>{farmer.deliveries || 0}</td>
                        <td>{(farmer.volumeSold || 0).toFixed(2)}</td>
                        <td className="sales-amount">
                          {formatCurrency(farmer.salesGenerated)}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr className="total-row">
                      <td colSpan="5">
                        <strong>Total</strong>
                      </td>
                      <td>
                        <strong>
                          {getPerFarmer()
                            .reduce((sum, f) => sum + (f.volumeSold || 0), 0)
                            .toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <strong>
                          {formatCurrency(
                            getPerFarmer().reduce(
                              (sum, f) => sum + (f.salesGenerated || 0),
                              0
                            )
                          )}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {reportType !== "organization" && getPerFarmer().length === 0 && (
            <div className="no-data">
              <p>📭 No farmer transactions found for this period.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportModule;