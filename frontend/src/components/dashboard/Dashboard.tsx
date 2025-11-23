import { useEffect, useState } from "react";
import api from "../../api/client";
import "./Dashboard.css";

type Scholarship = {
  id: number;
  name: string;
  description: string;
  amount: number;
  deadline: string;
};

export default function Dashboard() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        const res = await api.get<Scholarship[]>("/scholarships");
        setScholarships(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load scholarships.");
      } finally {
        setLoading(false);
      }
    };

    fetchScholarships();
  }, []);

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Scholarship Dashboard</h2>

      {loading && <p>Loading scholarships…</p>}
      {error && <p className="dashboard-error">{error}</p>}
      {!loading && !error && scholarships.length === 0 && (
        <p>No scholarships available yet.</p>
      )}

      <div className="dashboard-list">
        {scholarships.map((sch) => (
          <div key={sch.id} className="dashboard-card">
            <h3>{sch.name}</h3>
            <p>{sch.description}</p>
            <div className="dashboard-meta">
              <span>Amount: ${sch.amount}</span>
              <span>Deadline: {sch.deadline}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
