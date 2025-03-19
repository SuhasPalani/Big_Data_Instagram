import React, { useState } from 'react';

const InfluencerForm = ({ onSubmit, loading }) => {
  const [influencerInput, setInfluencerInput] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Split the input by commas and trim whitespace
    const usernames = influencerInput
      .split(',')
      .map(username => username.trim())
      .filter(username => username.length > 0);
    
    if (usernames.length > 0) {
      onSubmit(usernames);
    }
  };
  
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">Analyze Instagram Influencers</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="influencerInput" className="form-label">
              Enter Instagram usernames (comma separated)
            </label>
            <input
              type="text"
              className="form-control"
              id="influencerInput"
              placeholder="e.g. cristiano, leomessi, therock"
              value={influencerInput}
              onChange={(e) => setInfluencerInput(e.target.value)}
              disabled={loading}
            />
            <div className="form-text">
              You can enter multiple usernames separated by commas.
            </div>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              'Analyze'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InfluencerForm;