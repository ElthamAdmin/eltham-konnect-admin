import { useEffect, useState } from "react";
import axios from "axios";

function PointsHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("https://eltham-konnect-backend-c2sf.onrender.com/api/customers/points-history");
        setHistory(res.data.data);
      } catch (error) {
        console.error("Error loading points history:", error);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div>
      <h1>Points History</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Customer EKON ID</th>
            <th>Customer Name</th>
            <th>Action</th>
            <th>Points</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {history.map((item, index) => (
            <tr key={index}>
              <td>{item.customerEkonId}</td>
              <td>{item.customerName}</td>
              <td>{item.action}</td>
              <td>{item.points}</td>
              <td>{item.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PointsHistory;