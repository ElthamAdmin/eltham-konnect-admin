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
import TeamHub from "./pages/TeamHub";
import WarehouseManagement from "./pages/WarehouseManagement";
import AmazonAssociateLinks from "./pages/AmazonAssociateLinks";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import PreAlerts from "./pages/PreAlerts";
import HR from "./pages/HR";
import Login from "./pages/Login";
import DutyMonitor from "./pages/DutyMonitor";
import ReferralProgram from "./pages/ReferralProgram";
import NoticeBoard from "./pages/NoticeBoard";
import RewardsHubAdmin from "./pages/RewardsHubAdmin";
import RewardsHubAnalytics from "./pages/RewardsHubAnalytics";
import DebtManager from "./pages/DebtManager";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import JournalEntries from "./pages/JournalEntries";
import GeneralLedger from "./pages/GeneralLedger";
import TrialBalance from "./pages/TrialBalance";
import ProfitAndLoss from "./pages/ProfitAndLoss";
import BalanceSheet from "./pages/BalanceSheet";
import ClosePeriod from "./pages/ClosePeriod";
import AccountsReceivable from "./pages/AccountsReceivable";
import AccountsPayable from "./pages/AccountsPayable";
import BankingReconciliation from "./pages/BankingReconciliation";
import CashFlowStatement from "./pages/CashFlowStatement";
import FixedAssets from "./pages/FixedAssets";
import TaxCenter from "./pages/TaxCenter";
import Budgeting from "./pages/Budgeting";
import FinancialExports from "./pages/FinancialExports";
import IntegrationLogs from "./pages/IntegrationLogs";
import FreightPartners from "./pages/FreightPartners";
import UnmatchedPackages from "./pages/UnmatchedPackages";

function AppShell() {
  const { user, logout, refreshMyDuty } = useAuth();
  const location = useLocation();
  const [attendance, setAttendance] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth <= 900);
  };

  handleResize();
  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);

  const permissions = user?.permissions || [];

  const can = (key) => permissions.includes(key) || user?.role === "Admin";

  const canAccessHR =
    can("hr") ||
    can("hrSelfService") ||
    can("leaveSelfService") ||
    can("documentSelfService") ||
    can("payslipSelfService");

  const initials = useMemo(() => {
    const name = user?.fullName || "";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "EK";
    const a = parts[0][0] || "E";
    const b = parts[1]?.[0] || parts[0]?.[1] || "K";
    return (a + b).toUpperCase();
  }, [user]);

  const navItems = [
    { label: "Dashboard", path: "/", show: true },
    { label: "POS", path: "/pos", show: can("pos") },
    { label: "Customers", path: "/customers", show: can("customers") },
    { label: "Manifests", path: "/manifests", show: can("manifests") },
    { label: "Packages", path: "/packages", show: can("packages") },
    { label: "Invoices", path: "/invoices", show: can("invoices") },
    { label: "PreAlerts", path: "/prealerts", show: can("packages") },
    { label: "Support", path: "/support-tickets", show: can("support") },
    { label: "Finance", path: "/finance", show: can("finance") },
    { label: "Chart Accounts", path: "/chart-of-accounts", show: can("finance") },
    { label: "Journal Entries", path: "/journal-entries", show: can("finance") },
    { label: "General Ledger", path: "/general-ledger", show: can("finance") },
    { label: "Trial Balance", path: "/trial-balance", show: can("finance") },
    { label: "Profit & Loss", path: "/profit-loss", show: can("finance") },
    { label: "Balance Sheet", path: "/balance-sheet", show: can("finance") },
    { label: "Close Period", path: "/close-period", show: can("finance") },
    { label: "Accounts Receivable", path: "/accounts-receivable", show: can("finance") },
    { label: "Accounts Payable", path: "/accounts-payable", show: can("finance") },
    { label: "Banking", path: "/banking-reconciliation", show: can("finance") },
    { label: "Cash Flow", path: "/cash-flow-statement", show: can("finance") },
    { label: "Fixed Assets", path: "/fixed-assets", show: can("finance") },
    { label: "Tax Center", path: "/tax-center", show: can("finance") },
    { label: "Budgeting", path: "/budgeting", show: can("finance") },
    { label: "Exports", path: "/financial-exports", show: can("finance") },
    { label: "Debt Manager", path: "/debt-manager", show: can("finance") },
    { label: "HR", path: "/hr", show: canAccessHR },
    { label: "Notice Board", path: "/notice-board", show: can("communication") },
    { label: "Communication", path: "/communication", show: can("communication") },
    { label: "Team Hub", path: "/team-hub", show: can("communication") },
    { label: "Marketing", path: "/marketing", show: can("marketing") },
    { label: "Rewards", path: "/rewards-hub-admin", show: can("marketing") },
    { label: "Analytics", path: "/rewards-hub-analytics", show: can("marketing") },
    { label: "Amazon", path: "/amazon-associate", show: can("marketing") },
    { label: "Users", path: "/users", show: can("users") },
    { label: "Duty", path: "/duty-monitor", show: can("users") },
    { label: "Audit", path: "/audit-logs", show: can("users") },
    { label: "Integrations", path: "/integration-logs", show: can("users") },
    { label: "Freight Partners", path: "/freight-partners", show: can("users") },
    { label: "Unmatched", path: "/unmatched-packages", show: can("users") },
    { label: "Settings", path: "/settings", show: can("settings") },
    { label: "Warehouse", path: "/warehouse-management", show: can("warehouse") },
    { label: "Points", path: "/points-history", show: can("pointsHistory") },
    { label: "Referrals", path: "/referrals", show: can("customers") },
  ].filter((item) => item.show);

  const bottomItems = [
    { label: "Home", path: "/" },
    { label: "Packages", path: "/packages" },
    { label: "Customers", path: "/customers" },
    { label: "Invoices", path: "/invoices" },
    { label: "More", path: "__more" },
  ];

  const navItemStyle = (active) => ({
    color: "white",
    textDecoration: "none",
    padding: "14px 20px",
    display: "block",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    fontWeight: "bold",
    opacity: active ? 1 : 0.92,
    backgroundColor: active ? "rgba(255,255,255,0.14)" : "transparent",
  });

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
          padding: "5px 10px",
          borderRadius: "20px",
          fontWeight: "bold",
          fontSize: "12px",
          whiteSpace: "nowrap",
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

  const renderRoutes = () => (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/pos" element={can("pos") ? <POS /> : <Navigate to="/" replace />} />
      <Route path="/customers" element={can("customers") ? <Customers /> : <Navigate to="/" replace />} />
      <Route path="/manifests" element={can("manifests") ? <Manifests /> : <Navigate to="/" replace />} />
      <Route path="/packages" element={can("packages") ? <Packages /> : <Navigate to="/" replace />} />
      <Route path="/invoices" element={can("invoices") ? <Invoices /> : <Navigate to="/" replace />} />
      <Route path="/prealerts" element={can("packages") ? <PreAlerts /> : <Navigate to="/" replace />} />
      <Route path="/support-tickets" element={can("support") ? <SupportTickets /> : <Navigate to="/" replace />} />
      <Route path="/finance" element={can("finance") ? <Finance /> : <Navigate to="/" replace />} />
      <Route path="/chart-of-accounts" element={can("finance") ? <ChartOfAccounts /> : <Navigate to="/" replace />} />
      <Route path="/journal-entries" element={can("finance") ? <JournalEntries /> : <Navigate to="/" replace />} />
      <Route path="/general-ledger" element={can("finance") ? <GeneralLedger /> : <Navigate to="/" replace />} />
      <Route path="/trial-balance" element={can("finance") ? <TrialBalance /> : <Navigate to="/" replace />} />
      <Route path="/profit-loss" element={can("finance") ? <ProfitAndLoss /> : <Navigate to="/" replace />} />
      <Route path="/balance-sheet" element={can("finance") ? <BalanceSheet /> : <Navigate to="/" replace />} />
      <Route path="/close-period" element={can("finance") ? <ClosePeriod /> : <Navigate to="/" replace />} />
      <Route path="/accounts-receivable" element={can("finance") ? <AccountsReceivable /> : <Navigate to="/" replace />} />
      <Route path="/accounts-payable" element={can("finance") ? <AccountsPayable /> : <Navigate to="/" replace />} />
      <Route path="/banking-reconciliation" element={can("finance") ? <BankingReconciliation /> : <Navigate to="/" replace />} />
      <Route path="/cash-flow-statement" element={can("finance") ? <CashFlowStatement /> : <Navigate to="/" replace />} />
      <Route path="/fixed-assets" element={can("finance") ? <FixedAssets /> : <Navigate to="/" replace />} />
      <Route path="/tax-center" element={can("finance") ? <TaxCenter /> : <Navigate to="/" replace />} />
      <Route path="/budgeting" element={can("finance") ? <Budgeting /> : <Navigate to="/" replace />} />
      <Route path="/financial-exports" element={can("finance") ? <FinancialExports /> : <Navigate to="/" replace />} />
      <Route path="/debt-manager" element={can("finance") ? <DebtManager /> : <Navigate to="/" replace />} />
      <Route path="/hr" element={canAccessHR ? <HR /> : <Navigate to="/" replace />} />
      <Route path="/communication" element={can("communication") ? <Communication /> : <Navigate to="/" replace />} />
      <Route path="/team-hub" element={can("communication") ? <TeamHub /> : <Navigate to="/" replace />} />
      <Route path="/notice-board" element={can("communication") ? <NoticeBoard /> : <Navigate to="/" replace />} />
      <Route path="/marketing" element={can("marketing") ? <MarketingInfo /> : <Navigate to="/" replace />} />
      <Route path="/rewards-hub-admin" element={can("marketing") ? <RewardsHubAdmin /> : <Navigate to="/" replace />} />
      <Route path="/rewards-hub-analytics" element={can("marketing") ? <RewardsHubAnalytics /> : <Navigate to="/" replace />} />
      <Route path="/amazon-associate" element={can("marketing") ? <AmazonAssociateLinks /> : <Navigate to="/" replace />} />
      <Route path="/users" element={can("users") ? <SystemUsers /> : <Navigate to="/" replace />} />
      <Route path="/duty-monitor" element={can("users") ? <DutyMonitor /> : <Navigate to="/" replace />} />
      <Route path="/audit-logs" element={can("users") ? <AuditLogs /> : <Navigate to="/" replace />} />
      <Route path="/integration-logs" element={can("users") ? <IntegrationLogs /> : <Navigate to="/" replace />} />
      <Route path="/freight-partners" element={can("users") ? <FreightPartners /> : <Navigate to="/" replace />} />
      <Route path="/unmatched-packages" element={can("users") ? <UnmatchedPackages /> : <Navigate to="/" replace />} />
      <Route path="/settings" element={can("settings") ? <Settings /> : <Navigate to="/" replace />} />
      <Route path="/warehouse-management" element={can("warehouse") ? <WarehouseManagement /> : <Navigate to="/" replace />} />
      <Route path="/points-history" element={can("pointsHistory") ? <PointsHistory /> : <Navigate to="/" replace />} />
      <Route path="/referrals" element={<ReferralProgram />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isMobile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          fontFamily: "Arial, sans-serif",
          backgroundColor: "#f4f6fb",
          paddingBottom: "78px",
        }}
      >
        <div
          style={{
            backgroundColor: "#253a95",
            color: "white",
            padding: "16px",
            position: "sticky",
            top: 0,
            zIndex: 20,
            boxShadow: "0 4px 14px rgba(15,23,42,0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "28px",
                cursor: "pointer",
              }}
            >
              ☰
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                Eltham Konnect
              </div>
              <div style={{ fontSize: "12px", opacity: 0.9 }}>
                {user?.fullName} • {user?.role}
              </div>
            </div>

            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                backgroundColor: "white",
                color: "#253a95",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {initials}
            </div>
          </div>

          <div
            style={{
              marginTop: "14px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <button onClick={() => doAction("clock-in")} disabled={!canClockIn} style={mobileActionButton(canClockIn, "#16a34a")}>
              Clock In
            </button>
            <button onClick={() => doAction("lunch-out")} disabled={!canLunchOut} style={mobileActionButton(canLunchOut, "#f59e0b")}>
              Lunch Out
            </button>
            <button onClick={() => doAction("lunch-in")} disabled={!canLunchIn} style={mobileActionButton(canLunchIn, "#0ea5e9")}>
              Lunch In
            </button>
            <button onClick={() => doAction("clock-out")} disabled={!canClockOut} style={mobileActionButton(canClockOut, "#475569")}>
              Clock Out
            </button>
          </div>

          <div style={{ marginTop: "10px" }}>{dutyBadge(dutyStatus)}</div>
        </div>

        {mobileMenuOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15,23,42,0.55)",
              zIndex: 50,
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              style={{
                width: "82%",
                maxWidth: "330px",
                height: "100%",
                backgroundColor: "#253a95",
                color: "white",
                overflowY: "auto",
                paddingBottom: "30px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "20px", fontSize: "22px", fontWeight: "bold" }}>
                Eltham Konnect
              </div>

              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={navItemStyle(location.pathname === item.path)}
                >
                  {item.label}
                </Link>
              ))}

              <button
                onClick={logout}
                style={{
                  margin: "18px",
                  width: "calc(100% - 36px)",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        <main
          style={{
            padding: "14px",
            maxWidth: "100%",
            overflowX: "hidden",
          }}
        >
          {renderRoutes()}
        </main>

        <nav
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            height: "70px",
            backgroundColor: "white",
            borderTop: "1px solid #e5e7eb",
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            zIndex: 30,
            boxShadow: "0 -4px 16px rgba(15,23,42,0.08)",
          }}
        >
          {bottomItems.map((item) => {
            const active = location.pathname === item.path;
            return item.path === "__more" ? (
              <button
                key={item.label}
                onClick={() => setMobileMenuOpen(true)}
                style={bottomNavStyle(active)}
              >
                ⋯
                <span>{item.label}</span>
              </button>
            ) : (
              <Link key={item.path} to={item.path} style={bottomNavStyle(active)}>
                ●
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div
  style={{
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#eef2f7",
  }}
>
      <div
  style={{
    width: "250px",
    minWidth: "250px",
    height: "100vh",
    backgroundColor: "#253a95",
    color: "white",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
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

        {navItems.map((item) => (
          <Link key={item.path} to={item.path} style={navItemStyle(location.pathname === item.path)}>
            {item.label}
          </Link>
        ))}
      </div>

      <div
  style={{
    flex: 1,
    minWidth: 0,
    height: "100vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  }}
>
        <div
          style={{
            minHeight: "76px",
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

            <button onClick={() => doAction("clock-in")} disabled={!canClockIn} style={desktopActionButton(canClockIn, "#16a34a")}>
              Clock In
            </button>
            <button onClick={() => doAction("lunch-out")} disabled={!canLunchOut} style={desktopActionButton(canLunchOut, "#f59e0b")}>
              Lunch Out
            </button>
            <button onClick={() => doAction("lunch-in")} disabled={!canLunchIn} style={desktopActionButton(canLunchIn, "#0ea5e9")}>
              Lunch In
            </button>
            <button onClick={() => doAction("clock-out")} disabled={!canClockOut} style={desktopActionButton(canClockOut, "#475569")}>
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

            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ color: "#334155", fontWeight: "bold" }}>{user?.fullName}</span>
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

        <div
  style={{
    flex: 1,
    padding: "26px",
    overflowY: "auto",
    overflowX: "hidden",
    maxWidth: "100%",
  }}
>
  {renderRoutes()}
</div>
      </div>
    </div>
  );
}

function mobileActionButton(enabled, color) {
  return {
    backgroundColor: enabled ? color : "#cbd5e1",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "10px",
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: "bold",
    fontSize: "13px",
  };
}

function desktopActionButton(enabled, color) {
  return {
    backgroundColor: enabled ? color : "#cbd5e1",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: "bold",
  };
}

function bottomNavStyle(active) {
  return {
    border: "none",
    backgroundColor: "white",
    color: active ? "#253a95" : "#64748b",
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
  };
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