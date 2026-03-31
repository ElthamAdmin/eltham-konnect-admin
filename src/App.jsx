import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "./api";
import { useAuth } from "./context/AuthContext";
import ProtectedApp from "./components/ProtectedApp";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Packages from "./pages/Packages";
import Invoices from "./pages/Invoices";
import PointsHistory from "./pages/PointsHistory";
import Finance from "./pages/Finance";
import SupportTickets from "./pages/SupportTickets";
import Manifests from "./pages/Manifests";
import POS from "./pages/POS";
import MarketingInfo from "./pages/MarketingInfo";
import SystemUsers from "./pages/SystemUsers";
import Communication from "./pages/Communication";
import WarehouseManagement from "./pages/WarehouseManagement";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import PreAlerts from "./pages/PreAlerts";
import HR from "./pages/HR";
import Login from "./pages/Login";
import DutyMonitor from "./pages/DutyMonitor";

function HRModulePlaceholder() {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid #e5e7eb",
      }}
    >
      <h1 style={{ marginTop: 0, color: "#0B3D91" }}>HR Module</h1>
      <p style={{ color: "#475569", lineHeight: 1.6 }}>
        The HR module has been added to the admin system and backend. The next
        step is building the full HR page interface.
      </p>

      <div
        style={{
          marginTop: "18px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <strong style={{ color: "#0B3D91" }}>Employees</strong>
          <p style={{ margin: "8px 0 0 0", color: "#64748b" }}>
            Add, edit, and manage staff records.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <strong style={{ color: "#0B3D91" }}>Attendance</strong>
          <p style={{ margin: "8px 0 0 0", color: "#64748b" }}>
            Track employee duty status and attendance history.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <strong style={{ color: "#0B3D91" }}>Leave</strong>
          <p style={{ margin: "8px 0 0 0", color: "#64748b" }}>
            Manage leave balances and staff leave requests.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <strong style={{ color: "#0B3D91" }}>Payroll Link</strong>
          <p style={{ margin: "8px 0 0 0", color: "#64748b" }}>
            Connect employee records to finance payroll data.
          </p>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, logout, refreshMyDuty } = useAuth();
  const location = useLocation();
  const [attendance, setAttendance] = useState(null);

  const permissions = user?.permissions || [];
  const can = (key) => permissions.includes(key) || user?.role === "Admin";

  const navItemStyle = (active) => ({
    color: "white",
    textDecoration: "none",
    padding: "14px 20px",
    display: "block",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    fontWeight: "bold",
    opacity: active ? 1 : 0.92,
    backgroundColor: active ? "rgba(255,255,255,0.12)" : "transparent",
  });

  const initials = useMemo(() => {
    const name = user?.fullName || "";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "EK";
    const a = parts[0][0] || "E";
    const b = parts[1]?.[0] || parts[0]?.[1] || "K";
    return (a + b).toUpperCase();
  }, [user]);

  const dutyBadge = (status) => {
    const color =
      status === "On Duty"
        ? "#16a34a"
        : status === "At Lunch"
        ? "#f59e0b"
        : "#64748b";

    return (
      <span
        style={{
          backgroundColor: color,
          color: "white",
          padding: "4px 10px",
          borderRadius: "20px",
          fontWeight: "bold",
          fontSize: "12px",
        }}
      >
        {status || "Off Duty"}
      </span>
    );
  };

  const doAction = async (type) => {
    try {
      if (type === "clock-in") await api.post("/api/auth/clock-in");
      if (type === "lunch-out") await api.post("/api/auth/lunch-out");
      if (type === "lunch-in") await api.post("/api/auth/lunch-in");
      if (type === "clock-out") await api.post("/api/auth/clock-out");

      const data = await refreshMyDuty();
      setAttendance(data?.attendance || null);
      alert("Saved.");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Action failed.");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await refreshMyDuty();
        setAttendance(data?.attendance || null);
      } catch (error) {
        console.error("Error refreshing duty:", error);
      }
    })();
  }, [refreshMyDuty]);

  const dutyStatus = attendance?.sessionStatus || user?.dutyStatus || "Off Duty";

  const canClockIn = dutyStatus === "Off Duty" || dutyStatus === "Completed";
  const canLunchOut = dutyStatus === "On Duty";
  const canLunchIn = dutyStatus === "At Lunch";
  const canClockOut = dutyStatus === "On Duty" || dutyStatus === "At Lunch";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#eef2f7",
      }}
    >
      <div
        style={{
          width: "250px",
          backgroundColor: "#253a95",
          color: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "22px 20px",
            fontSize: "22px",
            fontWeight: "bold",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          Eltham Konnect
        </div>

        <Link to="/" style={navItemStyle(location.pathname === "/")}>
          Dashboard
        </Link>

        {can("pos") && (
          <Link to="/pos" style={navItemStyle(location.pathname === "/pos")}>
            POS
          </Link>
        )}
        {can("customers") && (
          <Link
            to="/customers"
            style={navItemStyle(location.pathname === "/customers")}
          >
            Customers
          </Link>
        )}
        {can("manifests") && (
          <Link
            to="/manifests"
            style={navItemStyle(location.pathname === "/manifests")}
          >
            Manifests
          </Link>
        )}
        {can("packages") && (
          <Link
            to="/packages"
            style={navItemStyle(location.pathname === "/packages")}
          >
            Packages
          </Link>
        )}
        {can("invoices") && (
          <Link
            to="/invoices"
            style={navItemStyle(location.pathname === "/invoices")}
          >
            Invoices
          </Link>
        )}
        {can("packages") && (
          <Link
            to="/prealerts"
            style={navItemStyle(location.pathname === "/prealerts")}
          >
            PreAlerts
          </Link>
        )}
        {can("support") && (
          <Link
            to="/support-tickets"
            style={navItemStyle(location.pathname === "/support-tickets")}
          >
            Support Tickets
          </Link>
        )}
        {can("finance") && (
          <Link
            to="/finance"
            style={navItemStyle(location.pathname === "/finance")}
          >
            Finance
          </Link>
        )}
        {can("hr") && (
          <Link to="/hr" style={navItemStyle(location.pathname === "/hr")}>
            HR
          </Link>
        )}
        {can("communication") && (
          <Link
            to="/communication"
            style={navItemStyle(location.pathname === "/communication")}
          >
            Communication
          </Link>
        )}
        {can("marketing") && (
          <Link
            to="/marketing"
            style={navItemStyle(location.pathname === "/marketing")}
          >
            Marketing Info
          </Link>
        )}
        {can("users") && (
          <Link to="/users" style={navItemStyle(location.pathname === "/users")}>
            System Users
          </Link>
        )}
        {can("users") && (
          <Link
            to="/duty-monitor"
            style={navItemStyle(location.pathname === "/duty-monitor")}
          >
            Duty Monitor
          </Link>
        )}
        {can("users") && (
          <Link
            to="/audit-logs"
            style={navItemStyle(location.pathname === "/audit-logs")}
          >
            Audit Logs
          </Link>
        )}
        {can("settings") && (
          <Link
            to="/settings"
            style={navItemStyle(location.pathname === "/settings")}
          >
            Settings
          </Link>
        )}
        {can("warehouse") && (
          <Link
            to="/warehouse-management"
            style={navItemStyle(location.pathname === "/warehouse-management")}
          >
            Warehouse Management
          </Link>
        )}
        {can("pointsHistory") && (
          <Link
            to="/points-history"
            style={navItemStyle(location.pathname === "/points-history")}
          >
            Points History
          </Link>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            height: "76px",
            backgroundColor: "white",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 24px",
            gap: "14px",
          }}
        >
          <div style={{ fontSize: "22px", color: "#64748b" }}>☰</div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {dutyBadge(dutyStatus)}

            <button
              onClick={() => doAction("clock-in")}
              disabled={!canClockIn}
              style={{
                backgroundColor: canClockIn ? "#16a34a" : "#cbd5e1",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: canClockIn ? "pointer" : "not-allowed",
                fontWeight: "bold",
              }}
            >
              Clock In
            </button>

            <button
              onClick={() => doAction("lunch-out")}
              disabled={!canLunchOut}
              style={{
                backgroundColor: canLunchOut ? "#f59e0b" : "#cbd5e1",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: canLunchOut ? "pointer" : "not-allowed",
                fontWeight: "bold",
              }}
            >
              Lunch Out
            </button>

            <button
              onClick={() => doAction("lunch-in")}
              disabled={!canLunchIn}
              style={{
                backgroundColor: canLunchIn ? "#0ea5e9" : "#cbd5e1",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: canLunchIn ? "pointer" : "not-allowed",
                fontWeight: "bold",
              }}
            >
              Lunch In
            </button>

            <button
              onClick={() => doAction("clock-out")}
              disabled={!canClockOut}
              style={{
                backgroundColor: canClockOut ? "#475569" : "#cbd5e1",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: canClockOut ? "pointer" : "not-allowed",
                fontWeight: "bold",
              }}
            >
              Clock Out
            </button>

            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                backgroundColor: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
                fontWeight: "bold",
              }}
            >
              {initials}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1.1,
              }}
            >
              <span style={{ color: "#334155", fontWeight: "bold" }}>
                {user?.fullName}
              </span>
              <span style={{ color: "#64748b", fontSize: "12px" }}>
                {user?.role} • {user?.branch}
              </span>
            </div>

            <button
              onClick={logout}
              style={{
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{ padding: "26px" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/pos"
              element={can("pos") ? <POS /> : <Navigate to="/" replace />}
            />
            <Route
              path="/customers"
              element={can("customers") ? <Customers /> : <Navigate to="/" replace />}
            />
            <Route
              path="/manifests"
              element={can("manifests") ? <Manifests /> : <Navigate to="/" replace />}
            />
            <Route
              path="/packages"
              element={can("packages") ? <Packages /> : <Navigate to="/" replace />}
            />
            <Route
              path="/invoices"
              element={can("invoices") ? <Invoices /> : <Navigate to="/" replace />}
            />
            <Route
              path="/prealerts"
              element={can("packages") ? <PreAlerts /> : <Navigate to="/" replace />}
            />
            <Route
              path="/support-tickets"
              element={can("support") ? <SupportTickets /> : <Navigate to="/" replace />}
            />
            <Route
              path="/finance"
              element={can("finance") ? <Finance /> : <Navigate to="/" replace />}
            />
            <Route
  path="/hr"
  element={can("hr") ? <HR /> : <Navigate to="/" replace />}
/>
            <Route
              path="/communication"
              element={can("communication") ? <Communication /> : <Navigate to="/" replace />}
            />
            <Route
              path="/marketing"
              element={can("marketing") ? <MarketingInfo /> : <Navigate to="/" replace />}
            />
            <Route
              path="/users"
              element={can("users") ? <SystemUsers /> : <Navigate to="/" replace />}
            />
            <Route
              path="/duty-monitor"
              element={can("users") ? <DutyMonitor /> : <Navigate to="/" replace />}
            />
            <Route
              path="/audit-logs"
              element={can("users") ? <AuditLogs /> : <Navigate to="/" replace />}
            />
            <Route
              path="/settings"
              element={can("settings") ? <Settings /> : <Navigate to="/" replace />}
            />
            <Route
              path="/warehouse-management"
              element={can("warehouse") ? <WarehouseManagement /> : <Navigate to="/" replace />}
            />
            <Route
              path="/points-history"
              element={can("pointsHistory") ? <PointsHistory /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedApp>
            <AppShell />
          </ProtectedApp>
        }
      />
    </Routes>
  );
}