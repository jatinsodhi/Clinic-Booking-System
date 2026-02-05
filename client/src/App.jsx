import React from 'react';
import BookingForm from './components/BookingForm';
import LiveTerminal from './components/LiveTerminal';

function App() {
  return (
    <div className="app-container">
      <div className="left-panel">
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-primary)' }}>🏥 ClinicOS</h2>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>Event-Driven Booking System v1.0</span>
        </div>
        <BookingForm />
      </div>

      <div className="right-panel" style={{ width: '65%' }}>
        <LiveTerminal />
      </div>
    </div>
  );
}

export default App;
