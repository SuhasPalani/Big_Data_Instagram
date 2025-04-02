import React, { useState, useEffect } from "react";
import InfluencerForm from "./components/InfluencerForm";
import AnalyticsDisplay from "./components/AnalyticsDisplay";
import KafkaStatus from "./components/KafkaStatus";
import PerformanceMetrics from "./components/PerformanceMetrics";
import "./app.css";

// Backend API URL
const API_URL = "http://localhost:8000";

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [statusMessages, setStatusMessages] = useState([]);
  const [websocket, setWebsocket] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);

  // Close WebSocket when component unmounts
  useEffect(() => {
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [websocket]);

  // Process form submission
  const handleSubmit = async (requestData) => {
    try {
      setLoading(true);
      setResults([]);
      setStatus("processing");
      setStatusMessages(["Submitting request..."]);
      setPerformanceData([]);

      // Close any existing WebSocket connection
      if (websocket) {
        websocket.close();
      }

      // Submit request to backend with database and benchmark options
      const response = await fetch(`${API_URL}/api/influencers/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const newRequestId = data.request_id;
      setRequestId(newRequestId);

      // Update status messages to include benchmark info if enabled
      const statusMsg = `Request submitted successfully. Request ID: ${newRequestId}`;
      const benchmarkMsg = requestData.benchmark
        ? " (Benchmark mode enabled)"
        : "";
      const dbMsg = `Using databases: ${Object.entries(requestData.databases)
        .filter(([_, enabled]) => enabled)
        .map(([db, _]) => db)
        .join(", ")}`;

      setStatusMessages((prev) => [...prev, statusMsg + benchmarkMsg, dbMsg]);

      // Set up WebSocket connection to receive updates
      const ws = new WebSocket(
        `ws://${window.location.hostname}:8000/ws/${newRequestId}`
      );

      ws.onopen = () => {
        setStatusMessages((prev) => [
          ...prev,
          "WebSocket connection established",
        ]);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "status") {
          setStatusMessages((prev) => [...prev, message.message]);

          if (message.status === "completed") {
            setStatus("completed");
            setLoading(false);
            // Fetch performance metrics once processing is complete
            fetchPerformanceMetrics(newRequestId);
          } else if (message.status === "error") {
            setStatus("error");
            setLoading(false);
          }
        } else if (message.type === "result") {
          // Add the result to our results array
          setResults((prev) => [...prev, message.data]);
        } else if (message.type === "performance") {
          // Handle performance metrics from websocket if provided
          setPerformanceData((prev) => [...prev, message.data]);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatusMessages((prev) => [
          ...prev,
          `WebSocket error: ${error.message || "Unknown error"}`,
        ]);
        setStatus("error");
        setLoading(false);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };

      setWebsocket(ws);
    } catch (error) {
      console.error("Error:", error);
      setStatusMessages((prev) => [...prev, `Error: ${error.message}`]);
      setStatus("error");
      setLoading(false);
    }
  };

  // Fetch performance metrics data
  const fetchPerformanceMetrics = async (reqId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/performance/${reqId || requestId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPerformanceData(data);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      setStatusMessages((prev) => [
        ...prev,
        `Error fetching performance metrics: ${error.message}`,
      ]);
    }
  };

  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col">
          <h1 className="mb-3">Instagram Analytics Dashboard</h1>
          <p className="lead">
            Enter Instagram usernames to analyze their profiles and get detailed
            analytics.
          </p>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col">
          <InfluencerForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>

      <div className="row mb-4">
        <div className="col">
          <KafkaStatus status={status} messages={statusMessages} />
        </div>
      </div>

      {results.length > 0 && (
        <div className="row mb-4">
          <div className="col">
            <AnalyticsDisplay results={results} />
          </div>
        </div>
      )}

      <div className="row">
        <div className="col">
          <PerformanceMetrics performanceData={performanceData} />
        </div>
      </div>
    </div>
  );
}

export default App;
