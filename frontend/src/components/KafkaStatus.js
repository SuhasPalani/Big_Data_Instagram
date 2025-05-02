import React from "react";
import "../app.css";

const KafkaStatus = ({ status, messages }) => {
  // No need to render if idle with no messages
  if (status === "idle" && (!messages || messages.length === 0)) {
    return null;
  }

  // Map status to Bootstrap alert classes and icons
  const statusConfig = {
    idle: {
      alertClass: "alert-light",
      icon: "bi-hourglass",
      progressValue: 0,
      title: "Ready"
    },
    started: {
      alertClass: "alert-info",
      icon: "bi-arrow-clockwise",
      progressValue: 25,
      title: "Processing Started"
    },
    processing: {
      alertClass: "alert-primary",
      icon: "bi-arrow-repeat",
      progressValue: 65,
      title: "Processing..."
    },
    completed: {
      alertClass: "alert-success",
      icon: "bi-check-circle-fill",
      progressValue: 100,
      title: "Processing Complete"
    },
    error: {
      alertClass: "alert-danger",
      icon: "bi-exclamation-triangle-fill",
      progressValue: 100,
      title: "Error Occurred"
    }
  };

  const config = statusConfig[status] || statusConfig.idle;
  const isActive = status === "started" || status === "processing";
  const hasMessages = messages && messages.length > 0;

  const getMessageIcon = (msg) => {
    if (msg.includes("error") || msg.includes("fail")) {
      return "bi-x-circle-fill text-danger";
    } else if (msg.includes("success") || msg.includes("complete")) {
      return "bi-check-circle-fill text-success";
    } else if (msg.includes("start") || msg.includes("begin")) {
      return "bi-play-fill text-info";
    } else {
      return "bi-arrow-right text-secondary";
    }
  };

  const formatTimestamp = (msg) => {
    // Check if message starts with a timestamp pattern like [12:34:56]
    const timestampMatch = msg.match(/^\[(\d{1,2}:\d{1,2}(:\d{1,2})?)\]/);
    
    if (timestampMatch) {
      const timestamp = timestampMatch[1];
      const msgContent = msg.replace(timestampMatch[0], "").trim();
      
      return (
        <>
          <span className="text-muted me-2">[{timestamp}]</span>
          {msgContent}
        </>
      );
    }
    
    return msg;
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className={`card-header ${config.alertClass.replace('alert', 'bg')}`}>
        <div className="d-flex align-items-center">
          <div className="me-3">
            <i className={`bi ${config.icon} fs-4 ${isActive ? "spinner" : ""}`}></i>
          </div>
          <div className="flex-grow-1">
            <h5 className="m-0 d-flex justify-content-between align-items-center">
              {config.title}
              {status !== "idle" && (
                <span className="badge bg-light text-dark">
                  Kafka Stream {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              )}
            </h5>
          </div>
        </div>
      </div>
      
      {(status !== "idle" || hasMessages) && (
        <div className="card-body">
          {status !== "idle" && (
            <div className="mb-3">
              <div className="progress" style={{ height: "10px" }}>
                <div 
                  className={`progress-bar progress-bar-striped ${isActive ? "progress-bar-animated" : ""} bg-${config.alertClass.split('-')[1]}`}
                  role="progressbar" 
                  style={{ width: `${config.progressValue}%` }}
                  aria-valuenow={config.progressValue} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          )}
          
          {hasMessages && (
            <div className="message-container">
              <h6 className="mb-3 text-muted">
                <i className="bi bi-terminal me-2"></i>
                Event Log {messages.length > 0 && <span className="badge bg-secondary ms-2">{messages.length}</span>}
              </h6>
              
              <div className="log-container p-3 bg-light rounded" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {messages.length === 0 ? (
                  <p className="text-muted fst-italic mb-0">No messages to display</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {messages.map((msg, index) => (
                      <li key={index} className={`log-item mb-2 ${index === messages.length - 1 ? "border-success" : ""}`}>
                        <div className="d-flex">
                          <div className="me-2">
                            <i className={`${getMessageIcon(msg)}`}></i>
                          </div>
                          <div className="message-text">
                            {formatTimestamp(msg)}
                          </div>
                        </div>
                        {index < messages.length - 1 && <hr className="mt-2 mb-0 opacity-25" />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {status === "processing" && (
        <div className="card-footer text-center text-muted">
          <small>
            <i className="bi bi-info-circle me-1"></i>
            Processing messages through Kafka stream. Please wait...
          </small>
        </div>
      )}
    </div>
  );
};

export default KafkaStatus;