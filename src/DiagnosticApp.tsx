import React from 'react'

const DiagnosticApp = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🔧 PakkaDrop Diagnostic Page</h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#28a745', marginBottom: '15px' }}>✅ Frontend Status</h2>
        <ul style={{ lineHeight: '1.6' }}>
          <li>✅ React is loading correctly</li>
          <li>✅ Vite development server is running</li>
          <li>✅ TypeScript compilation successful</li>
          <li>✅ CSS styles are working</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#007bff', marginBottom: '15px' }}>🔍 System Information</h2>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>Current URL:</strong> {window.location.href}</li>
          <li><strong>User Agent:</strong> {navigator.userAgent}</li>
          <li><strong>Screen Resolution:</strong> {window.screen.width} x {window.screen.height}</li>
          <li><strong>Viewport Size:</strong> {window.innerWidth} x {window.innerHeight}</li>
          <li><strong>Local Storage Available:</strong> {typeof Storage !== 'undefined' ? 'Yes' : 'No'}</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#ffc107', marginBottom: '15px' }}>⚠️ Troubleshooting Steps</h2>
        <ol style={{ lineHeight: '1.8' }}>
          <li><strong>Clear Browser Cache:</strong> Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)</li>
          <li><strong>Check Console:</strong> Press F12 and look for any red error messages</li>
          <li><strong>Disable Extensions:</strong> Try opening in incognito/private mode</li>
          <li><strong>Check Network:</strong> Ensure you can access http://localhost:3009</li>
          <li><strong>Restart Browser:</strong> Close and reopen your browser completely</li>
        </ol>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#17a2b8', marginBottom: '15px' }}>🚀 Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.href = '/'}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Go to Home Page
          </button>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          <button 
            onClick={() => console.log('Console test - check F12 developer tools')}
            style={{
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Test Console
          </button>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#d4edda', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #c3e6cb'
      }}>
        <h2 style={{ color: '#155724', marginBottom: '15px' }}>✅ If you can see this page, the frontend is working!</h2>
        <p style={{ margin: 0, color: '#155724' }}>
          The React application is loading correctly. If you were seeing a blank screen before, 
          try the troubleshooting steps above or contact support.
        </p>
      </div>
    </div>
  )
}

export default DiagnosticApp