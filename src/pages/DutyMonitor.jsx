import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function DutyMonitor() {
  const { user } = useAuth();

  const [workDate, setWorkDate] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);

  const [historyAttendance, setHistoryAttendance] = useState([]);
  const [historyUsers, setHistoryUsers] = useState([]);
  const [summary, setSummary] = useState([]);
  const [historyRange, setHistoryRange] = useState({
    filter: "today",
    startDate: "",
    endDate: "",
    userId: "",
    branch: "",
  });

  const fetchDuty = async () => {
    try {
      const res = await api.get("/api/auth/attendance-today");
      setWorkDate(res.data?.data?.workDate || "");
      setAttendance(res.data?.data?.attendance || []);
      setUsers(res.data?.data?.users || []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Could not load duty monitor.");
    }
  };

  const fetchHistory = async () => {
    try {
      const params = {
        filter: historyRange.filter,
      };

      if (historyRange.filter === "custom") {
        params.startDate = historyRange.startDate;
        params.endDate = historyRange.endDate;
      }

      if (historyRange.userId) {
        params.userId = historyRange.userId;
      }

      if (historyRange.branch) {
        params.branch = historyRange.branch;
      }

      const res = await api.get("/api/auth/attendance-history", { params });

      setHistoryAttendance(res.data?.data?.attendance || []);
      setHistoryUsers(res.data?.data?.users || []);
      setSummary(res.data?.data?.summary || []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Could not load attendance history.");
    }
  };

  useEffect(() => {
    fetchDuty();
    const interval = setInterval(fetchDuty, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [historyRange]);

  const attendanceMap = useMemo(() => {
    const map = {};
    for (const row of attendance) map[row.userId] = row;
    return map;
  }, [attendance]);

  const getLiveStatus = (u) => {
    const a = attendanceMap[u.userId];
    return a?.sessionStatus || u?.dutyStatus || "Off Duty";
  };

  const badge = (status) => {
    const color =
      status === "On Duty"
        ? "#16a34a"
        : status === "At Lunch"
        ? "#f59e0b"
        : status === "Completed"
        ? "#475569"
        : "#dc2626";

    return (
      <span
        style={{
          backgroundColor: color,
          color: "white",
          padding: "4px 10px",
          borderRadius: "6px",
          fontWeight: "bold",
        }}
      >
        {status}
      </span>
    );
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return String(value).slice(0, 10);
    } catch {
      return value;
    }
  };

  const formatTime = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleTimeString();
    } catch {
      return "";
    }
  };

  const formatMinutes = (minutes) => {
    const numericMinutes = Number(minutes || 0);
    const hours = Math.floor(numericMinutes / 60);
    const mins = numericMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const forceClockOut = async (staffUserId, staffName) => {
    const ok = window.confirm(`Force clock out ${staffName}?`);
    if (!ok) return;

    try {
      const res = await api.post(`/api/auth/force-clock-out/${staffUserId}`);
      alert(res.data.message);
      await fetchDuty();
      await fetchHistory();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Could not force clock out staff.");
    }
  };

  const handleHistoryChange = (e) => {
    const { name, value } = e.target;
    setHistoryRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!user?.permissions?.includes("users") && user?.role !== "Admin") {
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Duty Monitor</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>Duty Monitor</h1>
        <button
          onClick={() => {
            fetchDuty();
            fetchHistory();
          }}
          style={{
            backgroundColor: "#16c784",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Refresh
        </button>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "14px 18px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          marginBottom: "18px",
        }}
      >
        <strong>Date:</strong> {workDate || "—"} &nbsp; | &nbsp;
        <strong>Auto refresh:</strong> every 15 seconds
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Staff on Duty</h2>

        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1350px", width: "100%" }}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Clock In</th>
                <th>Lunch Out</th>
                <th>Lunch In</th>
                <th>Clock Out</th>
                <th>Lunch Minutes</th>
                <th>Worked Minutes</th>
                <th>Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => {
                  const a = attendanceMap[u.userId];
                  const s = getLiveStatus(u);
                  const canForce =
                    s === "On Duty" ||
                    s === "At Lunch" ||
                    u.dutyStatus === "On Duty" ||
                    u.dutyStatus === "At Lunch";

                  return (
                    <tr key={u._id}>
                      <td>{u.userId}</td>
                      <td>{u.fullName}</td>
                      <td>{u.role}</td>
                      <td>{u.branch}</td>
                      <td>{badge(s)}</td>
                      <td>{formatTime(a?.clockInTime)}</td>
                      <td>{formatTime(a?.lunchOutTime)}</td>
                      <td>{formatTime(a?.lunchInTime)}</td>
                      <td>{formatTime(a?.clockOutTime)}</td>
                      <td>{a?.lunchMinutes ?? ""}</td>
                      <td>{a?.workedMinutes ?? ""}</td>
                      <td>
                        {canForce ? (
                          <button
                            onClick={() => forceClockOut(u.userId, u.fullName)}
                            style={{
                              backgroundColor: "#dc2626",
                              color: "white",
                              border: "none",
                              padding: "6px 10px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            Force Clock Out
                          </button>
                        ) : (
                          <span style={{ color: "#64748b" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="12">No staff users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "12px", color: "#64748b", fontSize: "13px" }}>
          Note: “Completed” means staff clocked out for the day.
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Attendance History Filters</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "15px",
          }}
        >
          <select
            name="filter"
            value={historyRange.filter}
            onChange={handleHistoryChange}
            style={{ padding: "10px" }}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="thisWeek">This Week</option>
            <option value="lastWeek">Last Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>

          <select
            name="userId"
            value={historyRange.userId}
            onChange={handleHistoryChange}
            style={{ padding: "10px" }}
          >
            <option value="">All Staff</option>
            {users.map((u) => (
              <option key={u._id} value={u.userId}>
                {u.fullName} ({u.userId})
              </option>
            ))}
          </select>

          <select
            name="branch"
            value={historyRange.branch}
            onChange={handleHistoryChange}
            style={{ padding: "10px" }}
          >
            <option value="">All Branches</option>
            <option value="Eltham Park">Eltham Park</option>
            <option value="Brown's Town Square">Brown's Town Square</option>
            <option value="Browns Town Square">Browns Town Square</option>
          </select>

          <div
            style={{
              padding: "10px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              backgroundColor: "#f8fafc",
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
            }}
          >
            Records: {historyAttendance.length}
          </div>

          {historyRange.filter === "custom" && (
            <>
              <input
                type="date"
                name="startDate"
                value={historyRange.startDate}
                onChange={handleHistoryChange}
                style={{ padding: "10px" }}
              />
              <input
                type="date"
                name="endDate"
                value={historyRange.endDate}
                onChange={handleHistoryChange}
                style={{ padding: "10px" }}
              />
            </>
          )}
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Staff Work Summary</h2>

        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1000px", width: "100%" }}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Total Days</th>
                <th>Total Worked Minutes</th>
                <th>Total Worked Time</th>
                <th>Total Lunch Minutes</th>
                <th>Total Lunch Time</th>
              </tr>
            </thead>
            <tbody>
              {summary.length > 0 ? (
                summary.map((item) => (
                  <tr key={item.userId}>
                    <td>{item.userId}</td>
                    <td>{item.fullName}</td>
                    <td>{item.role}</td>
                    <td>{item.branch}</td>
                    <td>{item.totalDays}</td>
                    <td>{item.totalWorkedMinutes}</td>
                    <td>{item.totalWorkedLabel}</td>
                    <td>{item.totalLunchMinutes}</td>
                    <td>{item.totalLunchLabel}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No attendance summary found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Attendance History Records</h2>

        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1450px", width: "100%" }}>
            <thead>
              <tr>
                <th>Work Date</th>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Clock In</th>
                <th>Lunch Out</th>
                <th>Lunch In</th>
                <th>Clock Out</th>
                <th>Status</th>
                <th>Lunch Minutes</th>
                <th>Worked Minutes</th>
                <th>Worked Time</th>
              </tr>
            </thead>
            <tbody>
              {historyAttendance.length > 0 ? (
                historyAttendance.map((row) => (
                  <tr key={row._id}>
                    <td>{formatDate(row.workDate)}</td>
                    <td>{row.userId}</td>
                    <td>{row.fullName}</td>
                    <td>{row.role}</td>
                    <td>{formatTime(row.clockInTime)}</td>
                    <td>{formatTime(row.lunchOutTime)}</td>
                    <td>{formatTime(row.lunchInTime)}</td>
                    <td>{formatTime(row.clockOutTime)}</td>
                    <td>{badge(row.sessionStatus)}</td>
                    <td>{row.lunchMinutes}</td>
                    <td>{row.workedMinutes}</td>
                    <td>{formatMinutes(row.workedMinutes)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12">No attendance records found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}