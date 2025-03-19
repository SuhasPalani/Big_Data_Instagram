import React from 'react';

const KafkaStatus = ({ status, messages }) => {
  // Map status to Bootstrap alert classes
  const statusClasses = {
    idle: 'alert-light',
    started: 'alert-info',
    processing: 'alert-primary',
    completed: 'alert-success',
    error: 'alert-danger'
  };

  // No need to render if idle with no messages
  if (status === 'idle' && (!messages || messages.length === 0)) {
    return null;
  }

  return (
    <div className={`alert ${statusClasses[status] || 'alert-light'} mb-4`}>
      <h5 className="alert-heading">
        {status === 'idle' && 'Ready'}
        {status === 'started' && 'Processing Started'}
        {status === 'processing' && 'Processing...'}
        {status === 'completed' && 'Processing Complete'}
        {status === 'error' && 'Error Occurred'}
      </h5>
      
      {messages && messages.length > 0 && (
        <div className="mt-2">
          <ul className="mb-0">
            {messages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default KafkaStatus;