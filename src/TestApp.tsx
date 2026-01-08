import React from 'react'

const TestApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>
        🚛 FairLoad Test Page
      </h1>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <p style={{ color: '#666', marginBottom: '10px' }}>
          ✅ React is working
        </p>
        <p style={{ color: '#666', marginBottom: '10px' }}>
          ✅ TypeScript is working
        </p>
        <p style={{ color: '#666', marginBottom: '10px' }}>
          ✅ Frontend server is running
        </p>
        <button 
          style={{ 
            backgroundColor: '#2563eb', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          onClick={() => alert('Button clicked! React events are working.')}
        >
          Test Button
        </button>
      </div>
    </div>
  )
}

export default TestApp