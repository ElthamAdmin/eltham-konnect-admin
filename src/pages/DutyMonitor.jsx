import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function DutyMonitor() {
  const { user } = useAuth();
  const [workDate, setWorkDate] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);

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

  useEffect(() => {
    fetchDuty();
    const interval = setInterval(fetchDuty, 15000);
    return () => clearInterval(interval);
  }, []);

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

  const forceClockOut = async (staffUserId, staffName) => {
    const ok = window.confirm(`Force clock out ${staffName}?`);
    if (!ok) return;

    try {
      const res = await api.post(`/api/auth/force-clock-out/${staffUserId}`);
      alert(res.data.message);
      await fetchDuty();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Could not force clock out staff.");
    }
  };

  if (!user?.permissions?.includes("users") && user?.role !== "Admin") {
    return (
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
        <h2 style={{ marginTop: 0 }}>Duty Monitor</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h1 style={{ margin: 0 }}>Duty Monitor</h1>
        <button
          onClick={fetchDuty}
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

      <div style={{ backgroundColor: "white", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e5e7eb", marginBottom: "18px" }}>
        <strong>Date:</strong> {workDate || "—"} &nbsp; | &nbsp;
        <strong>Auto refresh:</strong> every 15 seconds
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
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
                    s === "On Duty" || s === "At Lunch" || u.dutyStatus === "On Duty" || u.dutyStatus === "At Lunch";

                  return (
                    <tr key={u._id}>
                      <td>{u.userId}</td>
                      <td>{u.fullName}</td>
                      <td>{u.role}</td>
                      <td>{u.branch}</td>
                      <td>{badge(s)}</td>
                      <td>{a?.clockInTime ? new Date(a.clockInTime).toLocaleTimeString() : ""}</td>
                      <td>{a?.lunchOutTime ? new Date(a.lunchOutTime).toLocaleTimeString() : ""}</td>
                      <td>{a?.lunchInTime ? new Date(a.lunchInTime).toLocaleTimeString() : ""}</td>
                      <td>{a?.clockOutTime ? new Date(a.clockOutTime).toLocaleTimeString() : ""}</td>
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
    </div>
  );
}