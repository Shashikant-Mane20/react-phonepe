import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Checkout from './components/checkout';

function Success() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-green-100">
      <h1 className="text-4xl font-extrabold text-green-700 mb-4">Payment Successful!</h1>
      <p className="text-lg text-green-600 mb-6">Thank you for your payment. Your transaction was completed successfully.</p>
      <a href="/" className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
        Go to Home
      </a>
    </div>
  );
}

function Failure() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-red-100">
      <h1 className="text-4xl font-extrabold text-red-700 mb-4">Payment Failed!</h1>
      <p className="text-lg text-red-600 mb-6">Unfortunately, your payment was not successful. Please try again or contact support.</p>
      <a href="/" className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
        Try Again
      </a>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Checkout />} />
        <Route path="/payment-success" element={<Success />} />
        <Route path="/payment-failure" element={<Failure />} />
      </Routes>
    </Router>
  );
}

export default App;
