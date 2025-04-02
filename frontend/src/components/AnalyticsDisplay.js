import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import "../app.css";
// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDisplay = ({ results }) => {
  if (!results || results.length === 0) {
    return null;
  }

  // Sort results by followers count (descending)
  const sortedResults = [...results].sort(
    (a, b) => b.followersCount - a.followersCount
  );

  // Prepare data for charts
  const usernames = sortedResults.map((result) => result.username);
  const followersData = sortedResults.map((result) => result.followersCount);
  const engagementRateData = sortedResults.map(
    (result) => result.engagementRate * 100
  );

  const followersChartData = {
    labels: usernames,
    datasets: [
      {
        label: "Followers Count",
        data: followersData,
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  const engagementChartData = {
    labels: usernames,
    datasets: [
      {
        label: "Engagement Rate (%)",
        data: engagementRateData,
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Instagram Analytics",
      },
    },
  };

  return (
    <div className="analytics-display">
      <h2 className="mb-4">Results</h2>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Followers Count</h5>
            </div>
            <div className="card-body">
              <Bar data={followersChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Engagement Rate</h5>
            </div>
            <div className="card-body">
              <Bar data={engagementChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Detailed Analytics</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Followers</th>
                  <th>Following</th>
                  <th>Posts</th>
                  <th>Eng. Rate</th>
                  <th>Avg. Likes</th>
                  <th>Avg. Comments</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((result) => (
                  <tr key={result.username}>
                    <td>{result.username}</td>
                    <td>{result.followersCount.toLocaleString()}</td>
                    <td>{result.followsCount.toLocaleString()}</td>
                    <td>{result.postsCount}</td>
                    <td>{(result.engagementRate * 100).toFixed(2)}%</td>
                    <td>
                      {Math.round(result.averageLikesPerPost).toLocaleString()}
                    </td>
                    <td>
                      {Math.round(
                        result.averageCommentsPerPost
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDisplay;
