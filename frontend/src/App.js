import React, { useState } from 'react';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    studyHours: '',
    sleepHours: '',
    attendance: '',
    stressLevel: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const formFields = [
    {
      id: 'studyHours',
      name: 'studyHours',
      label: 'Study Hours per Week:',
      min: 0,
      max: 80,
      step: 0.5,
      placeholder: 'e.g., 15',
      hint: 'Enter hours between 0-80 (recommended: 10-25 hours)',
      realistic: { min: 10, max: 25 }
    },
    {
      id: 'sleepHours',
      name: 'sleepHours',
      label: 'Sleep Hours per Night:',
      min: 0,
      max: 24,
      step: 0.5,
      placeholder: 'e.g., 7.5',
      hint: 'Enter hours between 0-24 (recommended: 7-9 hours)',
      realistic: { min: 7, max: 9 }
    },
    {
      id: 'attendance',
      name: 'attendance',
      label: 'Attendance (%):',
      min: 0,
      max: 100,
      step: 1,
      placeholder: 'e.g., 85',
      hint: 'Enter percentage between 0-100 (recommended: 80%+)',
      realistic: { min: 80, max: 100 }
    },
    {
      id: 'stressLevel',
      name: 'stressLevel',
      label: 'Stress Level (1-10):',
      min: 1,
      max: 10,
      step: 1,
      placeholder: 'e.g., 5',
      hint: 'Rate from 1 (low stress) to 10 (high stress) (moderate: 3-6)',
      realistic: { min: 3, max: 6 }
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateInput = (input) => {
    const value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    
    if (isNaN(value)) {
      input.setCustomValidity('Please enter a valid number');
    } else if (value < min || value > max) {
      input.setCustomValidity(`Value must be between ${min} and ${max}`);
    } else {
      input.setCustomValidity('');
    }
  };

  const getRealisticWarnings = () => {
    const warnings = [];
    const values = {
      studyHours: parseFloat(formData.studyHours),
      sleepHours: parseFloat(formData.sleepHours),
      attendance: parseFloat(formData.attendance),
      stressLevel: parseInt(formData.stressLevel)
    };

    formFields.forEach(field => {
      const value = values[field.name];
      if (!isNaN(value) && field.realistic) {
        if (value < field.realistic.min) {
          warnings.push(`${field.label.replace(':', '')} is below recommended range`);
        } else if (value > field.realistic.max) {
          warnings.push(`${field.label.replace(':', '')} is above recommended range`);
        }
      }
    });

    return warnings;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setResult(null);
    setError(null);

    // Prepare data for API
    const apiData = {
      'Study_Hours_per_Week': parseFloat(formData.studyHours),
      'Sleep_Hours_per_Night': parseFloat(formData.sleepHours),
      'Attendance (%)': parseFloat(formData.attendance),
      'Stress_Level (1-10)': parseInt(formData.stressLevel)
    };

    try {
      // Send POST request to Flask backend
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      const result = await response.json();

      setLoading(false);

      if (response.ok) {
        setResult(result);
      } else {
        setError(result.error || 'An error occurred');
      }

    } catch (error) {
      setLoading(false);
      setError('Network error. Please make sure the Flask server is running on http://127.0.0.1:5000');
      console.error('Error:', error);
    }
  };

  const renderResult = () => {
    if (error) {
      return (
        <div className="result show">
          <div className="result-card error show">
            <div className="result-header">
              <div className="result-icon">⚠️</div>
              <div className="result-content">
                <h3>Error</h3>
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (result) {
      const isPass = result.result === 'pass';
      const percentage = parseFloat(result.percentage?.replace('%', '') || 0);
      
      return (
        <div className="result show">
          <div className={`result-card ${isPass ? 'pass' : 'fail'} show`}>
            <div className="result-header">
              <div className="result-icon">{isPass ? '✅' : '❌'}</div>
              <div className="result-content">
                <h3>Prediction Result</h3>
                <div className={`result-status ${isPass ? 'pass' : 'fail'}`}>
                  {isPass ? 'PASS' : 'FAIL'}
                </div>
              </div>
            </div>
            
            <div className="result-percentage">
              Pass Probability: <span>{result.percentage}</span>
            </div>
            
            {result.confidence && (
              <div className="confidence-level">
                Confidence Level: <span>{result.confidence}</span>
              </div>
            )}

            {/* Progress bar for probability */}
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${
                    percentage >= 70 ? 'high' : 
                    percentage >= 50 ? 'medium' : 'low'
                  }`}
                  style={{ width: `${Math.max(percentage, 5)}%` }}
                ></div>
              </div>
            </div>

            <div className="result-interpretation">
              {result.interpretation ? (
                <p>{result.interpretation}</p>
              ) : (
                <p>
                  {isPass ? 
                    'Great! Based on your study habits, you have a good probability of passing.' : 
                    'You may need to improve your study habits to increase your chances of passing.'
                  }
                </p>
              )}
            </div>

            {result.warnings && result.warnings.length > 0 && (
              <div className="warnings">
                <h4>⚠️ Warnings:</h4>
                <ul>
                  {result.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const warnings = getRealisticWarnings();

  return (
    <div className="container">
      <h1>Student Performance Predictor</h1>
      <p className="subtitle">Enter your study habits to predict academic success</p>
      
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {formFields.map(field => (
            <div key={field.id} className="form-group">
              <label htmlFor={field.id}>
                {field.label}
              </label>
              <input
                type="number"
                id={field.id}
                name={field.name}
                min={field.min}
                max={field.max}
                step={field.step}
                required
                placeholder={field.placeholder}
                value={formData[field.name]}
                onChange={handleInputChange}
                onInput={(e) => validateInput(e.target)}
              />
              <div className="input-hint">{field.hint}</div>
            </div>
          ))}

          {warnings.length > 0 && (
            <div className="recommendations">
              <h4>💡 Recommendations:</h4>
              <ul>
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className="btn"
          >
            {loading ? 'Analyzing...' : 'Get Prediction'}
          </button>
        </form>

        {loading && (
          <div className={`loading ${loading ? 'show' : ''}`}>
            <div className="spinner"></div>
            <p>Analyzing your data...</p>
          </div>
        )}

        {renderResult()}
      </div>

      <div className="footer-tip">
        <p>💡 Tip: Balanced study habits with adequate sleep and good attendance typically yield the best results!</p>
      </div>
    </div>
  );
}

export default App;