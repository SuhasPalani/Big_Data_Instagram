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
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Analyze Instagram Profiles</h5>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="usernames" className="form-label">
              Enter Instagram usernames (separated by commas, spaces, or new
              lines)
            </label>
            <textarea
              className="form-control"
              id="usernames"
              rows="3"
              value={usernames}
              onChange={(e) => setUsernames(e.target.value)}
              placeholder="e.g. instagram, therock, neymarjr, ..."
              disabled={loading}
            ></textarea>
          </div>

          <div className="mb-3">
            <div className="card">
              <div className="card-header">Testing Options</div>
              <div className="card-body">
                <div className="row mb-2">
                  <div className="col-12">
                    <label className="form-label fw-bold">
                      Databases to Use:
                    </label>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="enableMongoDB"
                        checked={enableMongoDB}
                        onChange={(e) => setEnableMongoDB(e.target.checked)}
                        disabled={loading}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="enableMongoDB"
                      >
                        Enable MongoDB
                      </label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="enableDynamoDB"
                        checked={enableDynamoDB}
                        onChange={(e) => setEnableDynamoDB(e.target.checked)}
                        disabled={loading}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="enableDynamoDB"
                      >
                        Enable DynamoDB
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="runBenchmark"
                    checked={runBenchmark}
                    onChange={(e) => setRunBenchmark(e.target.checked)}
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="runBenchmark">
                    Run Performance Benchmarks (multiple iterations for
                    comparison)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Processing...
              </>
            ) : (
              "Analyze Profiles"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InfluencerForm;
