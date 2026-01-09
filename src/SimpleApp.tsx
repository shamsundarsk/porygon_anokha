import React from 'react'

const SimpleApp = () => {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{ 
          color: '#2563eb', 
          marginBottom: '20px',
          fontSize: '2.5rem',
          fontWeight: 'bold'
        }}>
          🚛 PakkaDrop Platform
        </h1>
        
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '30px',
          fontSize: '1.1rem',
          lineHeight: '1.6'
        }}>
          Smart Logistics Platform - Connecting Customers, Drivers & Businesses
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <button 
            onClick={() => window.location.href = '/?diagnostic'}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '15px 25px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            🔧 Run Diagnostics
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: '15px 25px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          >
            🏠 Go to Main App
          </button>
        </div>

        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#374151', marginBottom: '15px' }}>✅ System Status</h3>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            textAlign: 'left'
          }}>
            <li style={{ color: '#059669', marginBottom: '8px' }}>✅ Frontend Server: Running</li>
            <li style={{ color: '#059669', marginBottom: '8px' }}>✅ React Application: Loaded</li>
            <li style={{ color: '#059669', marginBottom: '8px' }}>✅ TypeScript: Compiled</li>
            <li style={{ color: '#059669', marginBottom: '8px' }}>✅ Vite Dev Server: Active</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #f59e0b'
        }}>
          <p style={{ 
            color: '#92400e', 
            margin: 0,
            fontSize: '0.9rem'
          }}>
            <strong>Note:</strong> If you were seeing a blank screen, this confirms the frontend is working. 
            The issue might be browser cache or a specific component error.
          </p>
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <p>Current URL: {window.location.href}</p>
        <p>Timestamp: {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}

export default SimpleApp