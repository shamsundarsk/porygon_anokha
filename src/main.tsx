import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import DiagnosticApp from './DiagnosticApp.tsx'
import SimpleApp from './SimpleApp.tsx'
import './index.css'

// Check URL parameters to determine which app to show
const urlParams = new URLSearchParams(window.location.search)
const showDiagnostic = urlParams.has('diagnostic')
const showSimple = urlParams.has('simple')

let AppComponent = App

if (showDiagnostic) {
  AppComponent = DiagnosticApp
} else if (showSimple) {
  AppComponent = SimpleApp
}

// Add error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#fee2e2',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '20px' }}>
            ❌ Application Error
          </h1>
          <p style={{ color: '#7f1d1d', marginBottom: '20px' }}>
            Something went wrong while loading the application.
          </p>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'left',
            maxWidth: '600px'
          }}>
            <h3>Error Details:</h3>
            <pre style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              {this.state.error?.toString()}
            </pre>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => window.location.href = '/?simple'}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Try Simple Mode
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppComponent />
    </ErrorBoundary>
  </React.StrictMode>,
)