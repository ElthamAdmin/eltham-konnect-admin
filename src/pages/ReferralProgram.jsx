import { useEffect, useState } from "react";
import axios from "axios";

function ReferralProgram() {
  const [referrals, setReferrals] = useState([]);

  const API = "https://eltham-konnect-backend-c2sf.onrender.com";

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const BORDER = "#dbe3ef";

  const fetchReferrals = async () => {
    try {
      const res = await axios.get(`${API}/api/referrals`);
      setReferrals(res.data.data || []);
    } catch (error) {
      console.error("Error loading referrals:", error);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ color: ROYAL_BLUE }}>EKON Referral Program</h1>

      <div
        style={{
          background: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "10px",
          padding: "15px",
          marginTop: "20px",
        }}
      >
        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            borderColor: BORDER,
          }}
        >
          <thead style={{ background: "#eef4ff" }}>
            <tr>
              <th>Referral Code</th>
              <th>Referrer</th>
              <th>Referee</th>
              <th>Status</th>
              <th>Reward Given</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {referrals.length > 0 ? (
              referrals.map((ref) => (
                <tr key={ref._id}>
                  <td>{ref.referralCode}</td>
                  <td>{ref.referrerName}</td>
                  <td>{ref.refereeName || "-"}</td>
                  <td>
                    <span
                      style={{
                        background:
                          ref.status === "Completed"
                            ? "#16a34a"
                            : ref.status === "Pending"
                            ? "#f59e0b"
                            : "#64748b",
                        color: WHITE,
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {ref.status}
                    </span>
                  </td>
                  <td>{ref.rewardGiven ? "YES" : "NO"}</td>
                  <td>
                    {ref.createdAt
                      ? new Date(ref.createdAt).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No referrals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReferralProgram;