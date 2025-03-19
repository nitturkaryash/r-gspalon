import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dashboard, Spa, Inventory } from '@mui/icons-material';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <Link to="/dashboard">
        <div className="nav-item">
          <Dashboard /> Dashboard
        </div>
      </Link>
      
      <Link to="/services">
        <div className="nav-item">
          <Spa /> Services
        </div>
      </Link>
      
      <Link to="/products">
        <div className="nav-item">
          <Inventory /> Products
        </div>
      </Link>
    </div>
  );
};

export default Sidebar; 