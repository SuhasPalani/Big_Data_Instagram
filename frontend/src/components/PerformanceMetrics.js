import React, { useState, useEffect } from "react";
import "../app.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const PerformanceMetrics = ({ performanceData }) => {
  const [chartData, setChartData] = useState([]);
  const [benchmarkData, setbenchmarkData] = useState([]);

  useEffect(() => {
    if (!performanceData || performanceData.length === 0) return;

    // Process real-time metrics
    const realtimeMetrics = performanceData.filter((item) => !item.iterations);

    // Process benchmark data
    const benchmarks = performanceData.filter((item) => item.iterations);

    // Format data for the real-time charts
    const formattedChartData = realtimeMetrics.map((item) => {
      const executionTime = item.execution_time;

      return {
        name: `${item.db_type}-${item.operation}`,
        time:
          executionTime !== undefined && executionTime !== null
            ? executionTime.toFixed(4)
            : "N/A", // Handle undefined or null
        ...item,
      };
    });

    // Format data for the benchmark comparison
    const formattedBenchmarkData = [];
    if (benchmarks.length > 0) {
      const operations = [...new Set(benchmarks.map((item) => item.operation))];
      const dbTypes = [...new Set(benchmarks.map((item) => item.db_type))];

      operations.forEach((operation) => {
        const dataPoint = { operation };
        dbTypes.forEach((dbType) => {
          const match = benchmarks.find(
            (item) => item.operation === operation && item.db_type === dbType
          );
          if (match) {
            dataPoint[dbType] = match.avg_time;
          }
        });
        formattedBenchmarkData.push(dataPoint);
      });
    }

    setChartData(formattedChartData);
    setbenchmarkData(formattedBenchmarkData);
  }, [performanceData]);

  return (
    <div className="performance-metrics">
      <h2>Database Performance Metrics</h2>

      {chartData.length > 0 && (
        <div className="metrics-chart">
          <h3>Real-time Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                label={{
                  value: "Time (seconds)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="time"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {benchmarkData.length > 0 && (
        <div className="benchmark-chart">
          <h3>Benchmark Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={benchmarkData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="operation" />
              <YAxis
                label={{
                  value: "Average Time (seconds)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="mongodb" fill="#8884d8" name="MongoDB" />
              <Bar dataKey="dynamodb" fill="#82ca9d" name="DynamoDB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length === 0 && benchmarkData.length === 0 && (
        <p>
          No performance data available yet. Run a query with benchmarking
          enabled.
        </p>
      )}
    </div>
  );
};

export default PerformanceMetrics;
