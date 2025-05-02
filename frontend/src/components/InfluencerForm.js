import React, { useState } from "react";
import "../app.css";

const InfluencerForm = ({ onSubmit, loading }) => {
  const [usernames, setUsernames] = useState("");
  const [enableMongoDB, setEnableMongoDB] = useState(true);
  const [enableDynamoDB, setEnableDynamoDB] = useState(true);
  const [runBenchmark, setRunBenchmark] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Split usernames by commas, new lines, or spaces and trim whitespace
    const usernameList = usernames
      .split(/[,\n\s]+/)
      .map((username) => username.trim())
      .filter((username) => username.length > 0);

    if (usernameList.length === 0) {
      alert("Please enter at least one valid username");
      return;
    }

    // Create the request payload with database and benchmark options
    const requestPayload = {
      usernames: usernameList,
      databases: {
        mongodb: enableMongoDB,
        dynamodb: enableDynamoDB,
      },
      benchmark: runBenchmark,
    };

    onSubmit(requestPayload);
  };

  return (
    <div className="card shadow border-0 rounded-lg">
      <div className="card-header bg-primary text-white py-3">
        <h4 className="mb-0">
          <i className="bi bi-instagram me-2"></i>
          Instagram Profile Analyzer
        </h4>
      </div>
      <div className="card-body p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="usernames" className="form-label fw-bold">
              Instagram Usernames
            </label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light">
                <i className="bi bi-at"></i>
              </span>
              <textarea
                className="form-control form-control-lg"
                id="usernames"
                rows="3"
                value={usernames}
                onChange={(e) => setUsernames(e.target.value)}
                placeholder="e.g. instagram, therock, neymarjr (separate with commas, spaces, or new lines)"
                disabled={loading}
              ></textarea>
            </div>
            <small className="text-muted">
              Enter one or more usernames to analyze
            </small>
          </div>

          <div className="card mb-4 border-light">
            <div className="card-header bg-light">
              <div className="d-flex align-items-center">
                <i className="bi bi-gear-fill me-2"></i>
                <span className="fw-bold">Configuration Options</span>
              </div>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Database Selection:</label>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="enableMongoDB"
                        checked={enableMongoDB}
                        onChange={(e) => setEnableMongoDB(e.target.checked)}
                        disabled={loading}
                      />
                      <label className="form-check-label" htmlFor="enableMongoDB">
                        <span className="d-flex align-items-center">
                          <i className="bi bi-database-fill me-2"></i>
                          MongoDB
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="enableDynamoDB"
                        checked={enableDynamoDB}
                        onChange={(e) => setEnableDynamoDB(e.target.checked)}
                        disabled={loading}
                      />
                      <label className="form-check-label" htmlFor="enableDynamoDB">
                        <span className="d-flex align-items-center">
                          <i className="bi bi-database-fill me-2"></i>
                          DynamoDB
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-check form-switch mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="runBenchmark"
                  checked={runBenchmark}
                  onChange={(e) => setRunBenchmark(e.target.checked)}
                  disabled={loading}
                />
                <label className="form-check-label" htmlFor="runBenchmark">
                  <span className="d-flex align-items-center">
                    <i className="bi bi-speedometer2 me-2"></i>
                    Run Performance Benchmarks
                  </span>
                </label>
                <div className="form-text ms-4">
                  Perform multiple iterations for performance comparison
                </div>
              </div>
            </div>
          </div>

          <div className="d-grid">
            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              disabled={loading}
            >
              {loading ? (
                <div className="d-flex align-items-center justify-content-center">
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center">
                  <i className="bi bi-search me-2"></i>
                  <span>Analyze Profiles</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InfluencerForm;