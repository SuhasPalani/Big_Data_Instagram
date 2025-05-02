import React, { useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
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
  Filler
} from "chart.js";
import "../app.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDisplay = ({ results }) => {
  const [activeTab, setActiveTab] = useState("charts");
  const [sortField, setSortField] = useState("followersCount");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");

  if (!results || results.length === 0) {
    return null;
  }

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Sort and filter results
  const sortedResults = [...results]
    .filter(result => 
      result.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "username") {
        comparison = a.username.localeCompare(b.username);
      } else {
        comparison = a[sortField] - b[sortField];
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Prepare data for charts
  const usernames = sortedResults.map((result) => result.username);
  const followersData = sortedResults.map((result) => result.followersCount);
  const engagementRateData = sortedResults.map(
    (result) => result.engagementRate * 100
  );
  const followsData = sortedResults.map((result) => result.followsCount);
  const postsData = sortedResults.map((result) => result.postsCount);
  const likesData = sortedResults.map((result) => result.averageLikesPerPost);
  const commentsData = sortedResults.map((result) => result.averageCommentsPerPost);

  // For Pie Chart - Distribution of followers
  const followersDistributionData = {
    labels: usernames,
    datasets: [
      {
        data: followersData,
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
          'rgba(78, 175, 80, 0.8)',
          'rgba(255, 87, 51, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(78, 175, 80, 1)',
          'rgba(255, 87, 51, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // For Bar Chart - Followers Count
  const followersChartData = {
    labels: usernames,
    datasets: [
      {
        label: "Followers",
        data: followersData,
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  // For Bar Chart - Engagement Rate
  const engagementChartData = {
    labels: usernames,
    datasets: [
      {
        label: "Engagement Rate (%)",
        data: engagementRateData,
        backgroundColor: "rgba(255, 99, 132, 0.7)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  // For Line Chart - Comparison
  const comparisonChartData = {
    labels: usernames,
    datasets: [
      {
        label: "Posts",
        data: postsData,
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Avg. Likes per Post (÷100)",
        data: likesData.map(val => val/100),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Avg. Comments per Post",
        data: commentsData,
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          },
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed.toLocaleString();
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((context.parsed / total) * 100);
            return `${label}: ${value} followers (${percentage}%)`;
          }
        }
      }
    },
  };

  // Calculate summary statistics
  const totalFollowers = followersData.reduce((a, b) => a + b, 0);
  const avgEngagementRate = (engagementRateData.reduce((a, b) => a + b, 0) / engagementRateData.length).toFixed(2);
  const totalProfiles = results.length;
  const avgFollowers = (totalFollowers / totalProfiles).toLocaleString();

  return (
    <div className="analytics-display">
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body bg-light rounded-3 p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h2 className="mb-1">Instagram Analytics Dashboard</h2>
              <p className="text-muted mb-0">
                Analyzing {totalProfiles} profiles with {totalFollowers.toLocaleString()} total followers
              </p>
            </div>
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search profiles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <div className="display-5 text-primary mb-2">
                <i className="bi bi-people-fill"></i>
              </div>
              <h5 className="card-title">Total Followers</h5>
              <h3 className="mb-0">{totalFollowers.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <div className="display-5 text-success mb-2">
                <i className="bi bi-person-badge"></i>
              </div>
              <h5 className="card-title">Average Followers</h5>
              <h3 className="mb-0">{avgFollowers}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <div className="display-5 text-danger mb-2">
                <i className="bi bi-heart-fill"></i>
              </div>
              <h5 className="card-title">Avg. Engagement</h5>
              <h3 className="mb-0">{avgEngagementRate}%</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <div className="display-5 text-info mb-2">
                <i className="bi bi-instagram"></i>
              </div>
              <h5 className="card-title">Profiles Analyzed</h5>
              <h3 className="mb-0">{totalProfiles}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "charts" ? "active" : ""}`}
                onClick={() => setActiveTab("charts")}
              >
                <i className="bi bi-bar-chart-fill me-2"></i>Charts
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "table" ? "active" : ""}`}
                onClick={() => setActiveTab("table")}
              >
                <i className="bi bi-table me-2"></i>Detailed Data
              </button>
            </li>
          </ul>
        </div>
                
        <div className="card-body">
          {activeTab === "charts" ? (
            <div className="row">
              <div className="col-lg-8">
                <div className="row">
                  <div className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100">
                      <div className="card-header bg-white">
                        <h5 className="mb-0">
                          <i className="bi bi-people-fill me-2 text-primary"></i>
                          Followers Count
                        </h5>
                      </div>
                      <div className="card-body">
                        <div style={{ height: "300px" }}>
                          <Bar data={followersChartData} options={chartOptions} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100">
                      <div className="card-header bg-white">
                        <h5 className="mb-0">
                          <i className="bi bi-heart-fill me-2 text-danger"></i>
                          Engagement Rate
                        </h5>
                      </div>
                      <div className="card-body">
                        <div style={{ height: "300px" }}>
                          <Bar data={engagementChartData} options={chartOptions} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12 mb-4">
                    <div className="card shadow-sm">
                      <div className="card-header bg-white">
                        <h5 className="mb-0">
                          <i className="bi bi-graph-up me-2 text-success"></i>
                          Performance Metrics Comparison
                        </h5>
                      </div>
                      <div className="card-body">
                        <div style={{ height: "300px" }}>
                          <Line data={comparisonChartData} options={chartOptions} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="card shadow-sm h-100">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">
                      <i className="bi bi-pie-chart-fill me-2 text-info"></i>
                      Follower Distribution
                    </h5>
                  </div>
                  <div className="card-body">
                    <div style={{ height: "630px" }}>
                      <Pie data={followersDistributionData} options={pieChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th onClick={() => handleSort("username")} className="cursor-pointer">
                      Username
                      {sortField === "username" && (
                        <i className={`bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill ms-1`}></i>
                      )}
                    </th>
                    <th onClick={() => handleSort("followersCount")} className="cursor-pointer text-end">
                      Followers
                      {sortField === "followersCount" && (
                        <i className={`bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill ms-1`}></i>
                      )}
                    </th>
                    <th onClick={() => handleSort("followsCount")} className="cursor-pointer text-end">
                      Following
                      {sortField === "followsCount" && (
                        <i className={`bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill ms-1`}></i>
                      )}
                    </th>
                    <th onClick={() => handleSort("postsCount")} className="cursor-pointer text-end">
                      Posts
                      {sortField === "postsCount" && (
                        <i className={`bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill ms-1`}></i>
                      )}
                    </th>
                    <th onClick={() => handleSort("engagementRate")} className="cursor-pointer text-end">
                      Eng. Rate
                      {sortField === "engagementRate" && (
                        <i className={`bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill ms-1`}></i>
                      )}
                    </th>
                    <th onClick={() => handleSort("averageLikesPerPost")} className="cursor-pointer text-end">
                      Avg. Likes
                      {sortField === "averageLikesPerPost" && (
                        <i className={`bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill ms-1`}></i>
                      )}
                    </th>
                    <th onClick={() => handleSort("averageCommentsPerPost")} className="cursor-pointer text-end">
                      Avg. Comments
                      {sortField === "averageCommentsPerPost" && (
                        <i className={`bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill ms-1`}></i>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((result) => (
                    <tr key={result.username}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm bg-primary rounded-circle text-white me-3">
                            {result.username.charAt(0).toUpperCase()}
                          </div>
                          <span>{result.username}</span>
                        </div>
                      </td>
                      <td className="text-end">{result.followersCount.toLocaleString()}</td>
                      <td className="text-end">{result.followsCount.toLocaleString()}</td>
                      <td className="text-end">{result.postsCount}</td>
                      <td className="text-end">
                        <span className={`badge bg-${result.engagementRate > 0.03 ? 'success' : result.engagementRate > 0.01 ? 'warning' : 'danger'}`}>
                          {(result.engagementRate * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-end">{Math.round(result.averageLikesPerPost).toLocaleString()}</td>
                      <td className="text-end">{Math.round(result.averageCommentsPerPost).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDisplay;