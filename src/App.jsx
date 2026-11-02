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
import Payroll from "./pages/Payroll";
import SupportTickets from "./pages/SupportTickets";
import Manifests from "./pages/Manifests";
import POS from "./pages/POS";
import MarketingInfo from "./pages/MarketingInfo";
import SystemUsers from "./pages/SystemUsers";
import Communication from "./pages/Communication";
import TeamHub from "./pages/TeamHub";
import WarehouseManagement from "./pages/WarehouseManagement";
import AmazonAssociateLinks from "./pages/AmazonAssociateLinks";
import MarketplaceOrders from "./pages/MarketplaceOrders";
import MarketplaceInvoices from "./pages/MarketplaceInvoices";
import MarketplaceProductsPage from "./pages/MarketplaceProductsPage";
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
import BusinessAnalytics from "./pages/BusinessAnalytics";
import BusinessGrowthCenter from "./pages/BusinessGrowthCenter";
import DebtManager from "./pages/DebtManager";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import JournalEntries from "./pages/JournalEntries";
import GeneralLedger from "./pages/GeneralLedger";
import TrialBalance from "./pages/TrialBalance";
import ProfitAndLoss from "./pages/ProfitAndLoss";
import BalanceSheet from "./pages/BalanceSheet";
import ClosePeriod from "./pages/ClosePeriod";
import AccountsReceivable from "./pages/AccountsReceivable";
import CustomerPurchases from "./pages/CustomerPurchases";
import AccountsPayable from "./pages/AccountsPayable";
import BankingReconciliation from "./pages/BankingReconciliation";
import CashFlowStatement from "./pages/CashFlowStatement";
import FixedAssets from "./pages/FixedAssets";
import TaxCenter from "./pages/TaxCenter";
import Budgeting from "./pages/Budgeting";
import FinancialExports from "./pages/FinancialExports";
import AccountingPeriods from "./pages/AccountingPeriods";
import FiscalYears from "./pages/FiscalYears";
import CorporateProfile from "./pages/CorporateProfile";
import IntegrationLogs from "./pages/IntegrationLogs";
import FreightPartners from "./pages/FreightPartners";
import UnmatchedPackages from "./pages/UnmatchedPackages";

function AppShell() {
  const { user, logout, refreshMyDuty } = useAuth();
  const location = useLocation();
  const [attendance, setAttendance] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
    const [headerSearch, setHeaderSearch] = useState("");

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

  const canAccessPayroll =
    can("payroll") ||
    can("payrollManage") ||
    can("payrollApprove") ||
    can("finance");

  const initials = useMemo(() => {
    const name = user?.fullName || "";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "EK";
    const a = parts[0][0] || "E";
    const b = parts[1]?.[0] || parts[0]?.[1] || "K";
    return (a + b).toUpperCase();
  }, [user]);

  const financeItems = [
  { label: "Overview", path: "/finance", show: can("finance") },
  { label: "Chart Accounts", path: "/chart-of-accounts", show: can("finance") },
  { label: "Journal Entries", path: "/journal-entries", show: can("finance") },
  { label: "General Ledger", path: "/general-ledger", show: can("finance") },
  { label: "Trial Balance", path: "/trial-balance", show: can("finance") },
  { label: "Profit & Loss", path: "/profit-loss", show: can("finance") },
  { label: "Balance Sheet", path: "/balance-sheet", show: can("finance") },
  { label: "Close Period", path: "/close-period", show: can("finance") },
  { label: "Accounts Receivable", path: "/accounts-receivable", show: can("finance") },
  { label: "Customer Purchases", path: "/customer-purchases", show: can("finance") },
  { label: "Accounts Payable", path: "/accounts-payable", show: can("finance") },
  { label: "Banking", path: "/banking-reconciliation", show: can("finance") },
  { label: "Cash Flow", path: "/cash-flow-statement", show: can("finance") },
  { label: "Fixed Assets", path: "/fixed-assets", show: can("finance") },
  { label: "Tax Center", path: "/tax-center", show: can("finance") },
  { label: "Budgeting", path: "/budgeting", show: can("finance") },
  { label: "Exports", path: "/financial-exports", show: can("finance") },
  { label: "Accounting Periods", path: "/accounting-periods", show: can("finance") },
  { label: "Fiscal Years", path: "/fiscal-years", show: can("finance") },
  { label: "Limited Liability Setup", path: "/corporate-profile", show: can("finance") },
  { label: "Debt Manager", path: "/debt-manager", show: can("finance") },
].filter((item) => item.show);

const navItems = [
  { label: "Dashboard", path: "/", show: true },
  { label: "POS", path: "/pos", show: can("pos") },
  { label: "Customers", path: "/customers", show: can("customers") },
  { label: "Manifests", path: "/manifests", show: can("manifests") },
  { label: "Packages", path: "/packages", show: can("packages") },
  { label: "Invoices", path: "/invoices", show: can("invoices") },
  { label: "PreAlerts", path: "/prealerts", show: can("packages") },
  { label: "Support", path: "/support-tickets", show: can("support") },
  { label: "Payroll", path: "/payroll", show: canAccessPayroll },
  { label: "HR", path: "/hr", show: canAccessHR },
  { label: "Communication", path: "/communication", show: can("communication") },
  { label: "Team Hub", path: "/team-hub", show: can("communication") },
  { label: "Marketing", path: "/marketing", show: can("marketing") },
  { label: "Rewards", path: "/rewards-hub-admin", show: can("marketing") },
  { label: "Analytics", path: "/rewards-hub-analytics", show: can("marketing") },
  { label: "Business Analytics", path: "/business-analytics", show: can("finance") },
  { label: "Growth Center", path: "/business-growth-center", show: can("finance") },
  { label: "Marketplace", path: "/amazon-associate", show: can("marketing") },
  { label: "Market Orders", path: "/marketplace-orders", show: can("marketing") },
  { label: "Market Invoices", path: "/marketplace-invoices", show: can("marketing") },
  { label: "Market Inventory", path: "/marketplace-products", show: can("marketing") },
  { label: "Users", path: "/users", show: can("users") },
  { label: "Duty", path: "/duty-monitor", show: can("users") },
  { label: "Audit", path: "/audit-logs", show: can("users") },
  { label: "Integrations", path: "/integration-logs", show: can("integrations") },
  { label: "Freight Partners", path: "/freight-partners", show: can("freightPartners") },
  { label: "Unmatched", path: "/unmatched-packages", show: can("unmatched") },
  { label: "Settings", path: "/settings", show: can("settings") },
  { label: "Warehouse", path: "/warehouse-management", show: can("warehouse") },
  { label: "Points", path: "/points-history", show: can("pointsHistory") },
  { label: "Referrals", path: "/referrals", show: can("customers") },
].filter((item) => item.show);

  const navigationGroups = [
    {
      label: "Operations",
      paths: ["/pos", "/packages", "/manifests", "/invoices", "/prealerts"],
    },
    {
      label: "Financial",
      paths: [
        ...financeItems.map((item) => item.path),
        "/business-analytics",
        "/business-growth-center",
      ],
    },
    {
      label: "Customers",
      paths: ["/customers", "/points-history", "/referrals"],
    },
    {
      label: "Delivery",
      paths: [
        "/warehouse-management",
        "/freight-partners",
        "/unmatched-packages",
      ],
    },
    {
      label: "Communication",
      paths: [
        "/support-tickets",
        "/communication",
        "/team-hub",
        "/notice-board",
        "/marketing",
        "/rewards-hub-admin",
        "/rewards-hub-analytics",
      ],
    },
    {
      label: "Marketplace",
      paths: [
        "/amazon-associate",
        "/marketplace-orders",
        "/marketplace-invoices",
        "/marketplace-products",
      ],
    },
    {
      label: "HR & Payroll",
      paths: ["/hr", "/payroll", "/duty-monitor"],
    },
    {
      label: "Administration",
      paths: ["/users", "/audit-logs", "/integration-logs", "/settings"],
    },
  ];

  const availableNavigation = [
    ...navItems,
    ...financeItems,
    ...(can("communication")
      ? [{ label: "Notice Board", path: "/notice-board" }]
      : []),
  ];

  const navigationByPath = new Map(
    availableNavigation.map((item) => [
      item.path,
      {
        ...item,
        label:
          item.path === "/customer-purchases"
            ? "Shopping Assistance"
            : item.label,
      },
    ])
  );

  const groupedNavigation = navigationGroups
    .map((group) => ({
      ...group,
      items: group.paths
        .map((path) => navigationByPath.get(path))
        .filter(Boolean),
    }))
    .filter((group) => group.items.length > 0);

  // Keep any future permitted links visible even if they have
  // not yet been assigned to a navigation group.
  const groupedPaths = new Set(
    navigationGroups.flatMap((group) => group.paths)
  );

  const remainingNavigation = [...navigationByPath.values()].filter(
    (item) => item.path !== "/" && !groupedPaths.has(item.path)
  );

  const renderGroupedNavigation = () => (
    <nav aria-label="Main navigation" style={{ padding: "12px 10px" }}>
      <Link
        to="/"
        onClick={() => setMobileMenuOpen(false)}
        style={{
          ...groupLinkStyle(location.pathname === "/"),
          marginBottom: "12px",
          fontSize: "14px",
          fontWeight: "bold",
        }}
            >
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <NavigationIcon name="Dashboard" />
          Dashboard
        </span>
      </Link>

      {groupedNavigation.map((group) => {
        const active = group.items.some(
          (item) => location.pathname === item.path
        );

        return (
          <details
            key={`${group.label}-${location.pathname}`}
            open={active || undefined}
            style={{
              marginBottom: "6px",
              borderRadius: "10px",
              background: active
                ? "rgba(255,255,255,0.06)"
                : "transparent",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                padding: "13px 12px",
                color: active ? "white" : "#d8e5ff",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "0.7px",
                textTransform: "uppercase",
              }}
            >
                            <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  verticalAlign: "middle",
                }}
              >
                <NavigationIcon name={group.label} />
                {group.label}
              </span>
            </summary>

            <div style={{ padding: "0 0 8px 8px" }}>
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={groupLinkStyle(
                    location.pathname === item.path
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        );
      })}

      {remainingNavigation.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setMobileMenuOpen(false)}
          style={groupLinkStyle(location.pathname === item.path)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

    const currentPageTitle =
    navigationByPath.get(location.pathname)?.label ||
    "Eltham Konnect";

  const headerSearchResults = headerSearch.trim()
    ? [...navigationByPath.values()]
        .filter((item) =>
          item.label.toLowerCase().includes(
            headerSearch.trim().toLowerCase()
          )
        )
        .slice(0, 8)
    : [];

  const headerButtonStyle = {
    border: "1px solid #dce4f0",
    background: "#f5f8ff",
    color: "#1644a3",
    borderRadius: "9px",
    padding: "9px 12px",
    cursor: "pointer",
    fontWeight: "bold",
  };

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
  padding: "13px 20px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontWeight: "bold",
  opacity: active ? 1 : 0.92,
  backgroundColor: active ? "rgba(255,255,255,0.13)" : "transparent",
});

const subNavItemStyle = (active) => ({
  color: "white",
  textDecoration: "none",
  padding: "10px 20px 10px 42px",
  display: "block",
  fontSize: "14px",
  opacity: active ? 1 : 0.85,
  backgroundColor: active ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.14)",
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
      <Route path="/payroll" element={canAccessPayroll ? <Payroll /> : <Navigate to="/" replace />} />
      <Route path="/chart-of-accounts" element={can("finance") ? <ChartOfAccounts /> : <Navigate to="/" replace />} />
      <Route path="/journal-entries" element={can("finance") ? <JournalEntries /> : <Navigate to="/" replace />} />
      <Route path="/general-ledger" element={can("finance") ? <GeneralLedger /> : <Navigate to="/" replace />} />
      <Route path="/trial-balance" element={can("finance") ? <TrialBalance /> : <Navigate to="/" replace />} />
      <Route path="/profit-loss" element={can("finance") ? <ProfitAndLoss /> : <Navigate to="/" replace />} />
      <Route path="/balance-sheet" element={can("finance") ? <BalanceSheet /> : <Navigate to="/" replace />} />
      <Route path="/close-period" element={can("finance") ? <ClosePeriod /> : <Navigate to="/" replace />} />
      <Route path="/accounts-receivable" element={can("finance") ? <AccountsReceivable /> : <Navigate to="/" replace />} />
      <Route path="/customer-purchases" element={can("finance") ? <CustomerPurchases /> : <Navigate to="/" replace />} />
      <Route path="/accounts-payable" element={can("finance") ? <AccountsPayable /> : <Navigate to="/" replace />} />
      <Route path="/banking-reconciliation" element={can("finance") ? <BankingReconciliation /> : <Navigate to="/" replace />} />
      <Route path="/cash-flow-statement" element={can("finance") ? <CashFlowStatement /> : <Navigate to="/" replace />} />
      <Route path="/fixed-assets" element={can("finance") ? <FixedAssets /> : <Navigate to="/" replace />} />
      <Route path="/tax-center" element={can("finance") ? <TaxCenter /> : <Navigate to="/" replace />} />
      <Route path="/budgeting" element={can("finance") ? <Budgeting /> : <Navigate to="/" replace />} />
      <Route path="/financial-exports" element={can("finance") ? <FinancialExports /> : <Navigate to="/" replace />} />
      <Route path="/accounting-periods" element={can("finance") ? <AccountingPeriods /> : <Navigate to="/" replace />} />
      <Route path="/fiscal-years" element={can("finance") ? <FiscalYears /> : <Navigate to="/" replace />} />
      <Route path="/corporate-profile" element={can("finance") ? <CorporateProfile /> : <Navigate to="/" replace />} />
      <Route path="/debt-manager" element={can("finance") ? <DebtManager /> : <Navigate to="/" replace />} />
      <Route path="/hr" element={canAccessHR ? <HR /> : <Navigate to="/" replace />} />
      <Route path="/communication" element={can("communication") ? <Communication /> : <Navigate to="/" replace />} />
      <Route path="/team-hub" element={can("communication") ? <TeamHub /> : <Navigate to="/" replace />} />
      <Route path="/notice-board" element={can("communication") ? <NoticeBoard /> : <Navigate to="/" replace />} />
      <Route path="/marketing" element={can("marketing") ? <MarketingInfo /> : <Navigate to="/" replace />} />
      <Route path="/rewards-hub-admin" element={can("marketing") ? <RewardsHubAdmin /> : <Navigate to="/" replace />} />
      <Route path="/rewards-hub-analytics" element={can("marketing") ? <RewardsHubAnalytics /> : <Navigate to="/" replace />} />
      <Route path="/business-analytics" element={can("finance") ? <BusinessAnalytics /> : <Navigate to="/" replace />} />
      <Route path="/business-growth-center" element={can("finance") ? <BusinessGrowthCenter /> : <Navigate to="/" replace />} />
      <Route path="/amazon-associate" element={can("marketing") ? <AmazonAssociateLinks /> : <Navigate to="/" replace />} />
      <Route path="/marketplace-orders" element={can("marketing") ? <MarketplaceOrders /> : <Navigate to="/" replace />} />
      <Route path="/marketplace-invoices" element={can("marketing") ? <MarketplaceInvoices /> : <Navigate to="/" replace />} />
      <Route path="/marketplace-products" element={can("marketing") ? <MarketplaceProductsPage /> : <Navigate to="/" replace />} />
      <Route path="/users" element={can("users") ? <SystemUsers /> : <Navigate to="/" replace />} />
      <Route path="/duty-monitor" element={can("users") ? <DutyMonitor /> : <Navigate to="/" replace />} />
      <Route path="/audit-logs" element={can("users") ? <AuditLogs /> : <Navigate to="/" replace />} />
      <Route path="/integration-logs" element={can("integrations") ? <IntegrationLogs /> : <Navigate to="/" replace />} />
<Route path="/freight-partners" element={can("freightPartners") ? <FreightPartners /> : <Navigate to="/" replace />} />
<Route path="/unmatched-packages" element={can("unmatched") ? <UnmatchedPackages /> : <Navigate to="/" replace />} />
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
            background: "linear-gradient(180deg, #102a63 0%, #183b8c 48%, #0f2558 100%)",
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

            <div>
  <div style={{ fontSize: "22px", fontWeight: "900" }}>Eltham Konnect</div>
  <div style={{ fontSize: "12px", opacity: 0.75, marginTop: "4px" }}>
    EKOS Admin ERP
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
                backgroundColor: "#1644a3",
                color: "white",
                overflowY: "auto",
                paddingBottom: "30px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "20px", fontSize: "22px", fontWeight: "bold" }}>
                Eltham Konnect
              </div>

              {renderGroupedNavigation()}

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
    background: "linear-gradient(135deg, #eef3fb 0%, #f8fafc 100%)",
  }}
>
      <div
    style={{
    width: desktopSidebarOpen ? "250px" : "0px",
    minWidth: desktopSidebarOpen ? "250px" : "0px",
    height: "100vh",
    backgroundColor: "#1644a3",
    color: "white",
    display: desktopSidebarOpen ? "flex" : "none",
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

        {renderGroupedNavigation()}
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
                <header
          style={{
            minHeight: "76px",
            flexShrink: 0,
            backgroundColor: "white",
            borderBottom: "1px solid #dfe6f0",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            padding: "14px 24px",
            gap: "16px",
            position: "relative",
            zIndex: 35,
          }}
        >
          <button
            type="button"
            aria-label={
              desktopSidebarOpen ? "Hide sidebar" : "Show sidebar"
            }
            aria-expanded={desktopSidebarOpen}
            onClick={() =>
              setDesktopSidebarOpen((open) => !open)
            }
            style={headerButtonStyle}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <strong
            style={{
              color: "#1644a3",
              fontSize: "16px",
            }}
          >
            {currentPageTitle}
          </strong>

          <div
            style={{
              flex: "1 1 220px",
              maxWidth: "480px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                border: "1px solid #dce4f0",
                borderRadius: "10px",
                backgroundColor: "#f7f9fd",
                color: "#74839a",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>

              <input
                type="search"
                aria-label="Find a module"
                placeholder="Find a module…"
                value={headerSearch}
                onChange={(event) =>
                  setHeaderSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setHeaderSearch("");
                  }
                }}
                style={{
                  width: "100%",
                  minWidth: 0,
                  border: "none",
                  background: "transparent",
                  color: "#17345b",
                  font: "inherit",
                }}
              />
            </div>

            {headerSearch.trim() && (
              <div
                aria-label="Matching modules"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #dce4f0",
                  borderRadius: "10px",
                  padding: "6px",
                  boxShadow: "0 10px 30px #17345b22",
                  maxHeight: "340px",
                  overflowY: "auto",
                }}
              >
                {headerSearchResults.length ? (
                  headerSearchResults.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setHeaderSearch("")}
                      style={{
                        display: "block",
                        padding: "11px 12px",
                        color: "#1644a3",
                        textDecoration: "none",
                        borderRadius: "7px",
                      }}
                    >
                      {item.label}
                    </Link>
                  ))
                ) : (
                  <p
                    style={{
                      margin: "10px",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    No matching modules.
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginLeft: "auto",
            }}
          >
            <details style={{ position: "relative" }}>
              <summary
                style={{
                  ...headerButtonStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  listStyle: "none",
                }}
              >
                <NavigationIcon name="HR & Payroll" />
                Attendance
                <span aria-hidden="true">⌄</span>
              </summary>

              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  width: "270px",
                  padding: "16px",
                  backgroundColor: "white",
                  border: "1px solid #dce4f0",
                  borderRadius: "12px",
                  boxShadow: "0 10px 30px #17345b22",
                }}
              >
                {dutyBadge(dutyStatus)}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    marginTop: "14px",
                  }}
                >
                  <button
                    onClick={() => doAction("clock-in")}
                    disabled={!canClockIn}
                    style={desktopActionButton(
                      canClockIn, "#245ce0"
                    )}
                  >
                    Clock In
                  </button>

                  <button
                    onClick={() => doAction("lunch-out")}
                    disabled={!canLunchOut}
                    style={desktopActionButton(
                      canLunchOut, "#ed762d"
                    )}
                  >
                    Lunch Out
                  </button>

                  <button
                    onClick={() => doAction("lunch-in")}
                    disabled={!canLunchIn}
                    style={desktopActionButton(
                      canLunchIn, "#245ce0"
                    )}
                  >
                    Lunch In
                  </button>

                  <button
                    onClick={() => doAction("clock-out")}
                    disabled={!canClockOut}
                    style={desktopActionButton(
                      canClockOut, "#475569"
                    )}
                  >
                    Clock Out
                  </button>
                </div>
              </div>
            </details>

            <div
              style={{
                width: "38px",
                height: "38px",
                flexShrink: 0,
                borderRadius: "50%",
                backgroundColor: "#edf3ff",
                color: "#1644a3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {initials}
            </div>

            <div style={{ lineHeight: 1.4 }}>
              <div
                style={{
                  color: "#17345b",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                {user?.fullName}
              </div>
              <div
                style={{
                  color: "#64748b",
                  fontSize: "11px",
                }}
              >
                {user?.role} · {user?.branch}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              style={headerButtonStyle}
            >
              Logout
            </button>
          </div>
        </header>

        <div
  style={{
    flex: 1,
    padding: "28px",
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

function NavigationIcon({ name, size = 17 }) {
  const paths = {
    Dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    Operations: (
      <>
        <path d="M4 8h16l1 12H3L4 8Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2M8 12h8" />
      </>
    ),
    Financial: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v12M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9" />
      </>
    ),
    Customers: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" />
      </>
    ),
    Delivery: (
      <>
        <path d="M3 5h11v12H3ZM14 9h4l3 4v4h-7" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    Communication: (
      <>
        <path d="M21 11a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4Z" />
        <path d="M7 10h10M7 14h6" />
      </>
    ),
    Marketplace: (
      <>
        <path d="M3 3h2l3 12h11l2-8H6" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    "HR & Payroll": (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 3" />
      </>
    ),
    Administration: (
      <>
        <path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, verticalAlign: "middle" }}
    >
      {paths[name] || paths.Operations}
    </svg>
  );
}

function groupLinkStyle(active) {
  return {
    display: "block",
    padding: "10px 12px",
    margin: "3px 0",
    borderRadius: "7px",
    borderLeft: active
      ? "3px solid #ff802f"
      : "3px solid transparent",
    backgroundColor: active
      ? "rgba(255,255,255,0.13)"
      : "transparent",
    color: active ? "#ffffff" : "#e0eaff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: active ? "bold" : "normal",
    lineHeight: 1.4,
  };
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