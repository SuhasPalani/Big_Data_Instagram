import React, { useState, useEffect } from "react";
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

const PerformanceMetrics = ({ performanceData, isLoading }) => {
  const [chartData, setChartData] = useState([]);
  const [benchmarkData, setBenchmarkData] = useState([]);

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
    setBenchmarkData(formattedBenchmarkData);
  }, [performanceData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <h4 className="tooltip-header">{label}</h4>
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <span className="tooltip-dot" style={{ backgroundColor: entry.color }} />
              <span className="tooltip-label">{entry.name}: </span>
              <span className="tooltip-value">{entry.value}s</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="performance-metrics">
      <style>
        {`
          .performance-metrics {
            padding: 2rem;
            background: #f8fafc;
            border-radius: 12px;
            margin: 2rem auto;
            max-width: 1400px;
          }

          .metrics-header {
            font-size: 1.8rem;
            color: #1e293b;
            margin-bottom: 2rem;
            text-align: center;
          }

          .charts-container {
            display: grid;
            gap: 2rem;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          }

          .chart-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .chart-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          .chart-title {
            font-size: 1.2rem;
            margin-bottom: 1rem;
            color: #334155;
            display: flex;
            align-items: baseline;
            gap: 0.5rem;
          }

          .chart-subtitle {
            font-size: 0.9rem;
            color: #64748b;
            font-weight: 400;
          }

          .custom-tooltip {
            background: white;
            padding: 0.75rem;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border: 1px solid #e2e8f0;
          }

          .tooltip-header {
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
            color: #475569;
          }

          .tooltip-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
          }

          .tooltip-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }

          .empty-state {
            text-align: center;
            padding: 3rem;
            background: white;
            border-radius: 12px;
            margin-top: 2rem;
          }

          .empty-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.7;
          }

          .empty-title {
            color: #475569;
            margin-bottom: 0.5rem;
          }

          .empty-message {
            color: #64748b;
            margin: 0;
          }

          .loading-state {
            text-align: center;
            padding: 3rem;
            color: #64748b;
          }
        `}
      </style>

      <h2 className="metrics-header">Database Performance Metrics</h2>

      {isLoading ? (
        <div className="loading-state">
          <p>Loading performance data...</p>
        </div>
      ) : (
        <div className="charts-container">
          {chartData.length > 0 && (
            <div className="chart-card realtime-card">
              <h3 className="chart-title">
                Real-time Performance
                <span className="chart-subtitle">(Last Operations)</span>
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    height={70}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}s`}
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => <span className="legend-label">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="time"
                    stroke="url(#lineGradient)"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: '#6366f1' }}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {benchmarkData.length > 0 && (
            <div className="chart-card benchmark-card">
              <h3 className="chart-title">Benchmark Comparison</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={benchmarkData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="operation"
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 12 }}
                    height={70}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}s`}
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => <span className="legend-label">{value}</span>}
                  />
                  <Bar
                    dataKey="mongodb"
                    fill="#6366f1"
                    name="MongoDB"
                    radius={[4, 4, 0, 0]}
                    animationDuration={500}
                  />
                  <Bar
                    dataKey="dynamodb"
                    fill="#10b981"
                    name="DynamoDB"
                    radius={[4, 4, 0, 0]}
                    animationDuration={500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {!isLoading && chartData.length === 0 && benchmarkData.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h4 className="empty-title">No Performance Data</h4>
          <p className="empty-message">
            Run a query with benchmarking enabled to see metrics
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetrics;
