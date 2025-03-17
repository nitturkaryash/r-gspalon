import React from 'react';
import { Link } from 'react-router-dom';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';

const Sidebar = () => {
  const location = { pathname: window.location.pathname };
  const listItemStyle = {
    padding: '10px 20px',
    borderRadius: '0 20px 20px 0',
    marginBottom: '10px',
    backgroundColor: location.pathname === '/settings' ? '#007bff' : 'transparent',
    '&:hover': {
      backgroundColor: '#007bff',
    },
  };

  return (
    <div>
      <ListItemButton
        component={Link}
        to="/settings"
        selected={location.pathname === '/settings'}
        sx={listItemStyle}
      >
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>
        <ListItemText primary="Settings" />
      </ListItemButton>

      {/* Development mode only */}
      {process.env.NODE_ENV === 'development' && (
        <ListItemButton
          component={Link}
          to="/local-data"
          selected={location.pathname === '/local-data'}
          sx={listItemStyle}
        >
          <ListItemIcon>
            <StorageIcon />
          </ListItemIcon>
          <ListItemText primary="Local Data" />
        </ListItemButton>
      )}
    </div>
  );
};

export default Sidebar; 