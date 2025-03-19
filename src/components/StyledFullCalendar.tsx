import { styled } from '@mui/material/styles';
import FullCalendar from '@fullcalendar/react';

export const StyledFullCalendar = styled(FullCalendar)(({ theme }) => ({
  height: '100%',
  '& .fc': {
    // Calendar container
    '--fc-page-bg-color': theme.palette.background.default,
    '--fc-border-color': theme.palette.divider,
    '--fc-neutral-bg-color': theme.palette.background.paper,
    '--fc-list-event-hover-bg-color': theme.palette.action.hover,
    
    // Text colors
    '--fc-neutral-text-color': theme.palette.text.primary,
    '--fc-small-font-size': '0.85em',
    
    // Event colors
    '--fc-event-bg-color': theme.palette.primary.main,
    '--fc-event-border-color': theme.palette.primary.main,
    '--fc-event-text-color': theme.palette.primary.contrastText,
    '--fc-event-selected-overlay-color': 'rgba(0, 0, 0, 0.25)',

    // Today colors
    '--fc-today-bg-color': 'rgba(9, 137, 247, 0.08)',
    
    // Non-business hours
    '--fc-non-business-color': 'rgba(0, 0, 0, 0.2)',

    // Button colors
    '--fc-button-bg-color': theme.palette.primary.main,
    '--fc-button-border-color': theme.palette.primary.main,
    '--fc-button-text-color': theme.palette.primary.contrastText,
    '--fc-button-hover-bg-color': theme.palette.primary.dark,
    '--fc-button-hover-border-color': theme.palette.primary.dark,
    '--fc-button-active-bg-color': theme.palette.primary.dark,
    '--fc-button-active-border-color': theme.palette.primary.dark,
  },

  // Additional custom styles
  '& .fc-theme-standard': {
    backgroundColor: theme.palette.background.default,
  },

  '& .fc-theme-standard td, & .fc-theme-standard th': {
    borderColor: theme.palette.divider,
  },

  '& .fc-timegrid-slot': {
    backgroundColor: theme.palette.background.paper,
    '&-minor': {
      borderColor: `${theme.palette.divider} !important`,
    },
  },

  '& .fc-timegrid-now-indicator-line': {
    borderColor: theme.palette.error.main,
  },

  '& .fc-timegrid-now-indicator-arrow': {
    borderColor: theme.palette.error.main,
  },

  // Updated event styling for better text visibility
  '& .fc-event': {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    borderRadius: '4px !important', // More square corners
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    margin: '1px 1px !important', // Reduced margin between events
    minHeight: '24px', // Ensure minimum height
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      cursor: 'pointer',
    },
  },

  // Improved text styling in events
  '& .fc-event-main': {
    padding: '2px 4px',
    color: theme.palette.primary.contrastText,
    whiteSpace: 'normal !important', // Allow text wrapping
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '0.8rem',
    lineHeight: '1.2',
  },

  // Specific styling for month view events
  '& .fc-daygrid-event': {
    borderRadius: '4px !important',
    padding: '1px 2px',
    marginTop: '1px',
    marginBottom: '1px',
    whiteSpace: 'normal', // Allow text wrapping
    overflow: 'hidden',
  },

  // Fix for event title display
  '& .fc-event-title': {
    padding: '0 2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },

  // Adjust event time display
  '& .fc-event-time': {
    padding: '0 2px',
    fontSize: '0.75rem',
    fontWeight: 500,
  },

  '& .fc-toolbar-title': {
    color: theme.palette.text.primary,
  },

  '& .fc-button': {
    textTransform: 'capitalize',
    '&:focus': {
      boxShadow: `0 0 0 0.2rem ${theme.palette.primary.main}40`,
    },
  },

  '& .fc-button-primary:not(:disabled):active, & .fc-button-primary:not(:disabled).fc-button-active': {
    backgroundColor: theme.palette.primary.dark,
    borderColor: theme.palette.primary.dark,
  },

  '& .fc-timegrid-col-events': {
    margin: '0 1px', // Reduced margin
  },

  '& .fc-highlight': {
    backgroundColor: `${theme.palette.primary.main}20`,
  },

  '& .fc-day-today': {
    backgroundColor: 'rgba(9, 137, 247, 0.08) !important',
  },

  '& .fc-cell-shaded': {
    backgroundColor: theme.palette.action.hover,
  },

  '& .fc-list-empty': {
    backgroundColor: theme.palette.background.paper,
  },

  // Time slots
  '& .fc-timegrid-slot-label': {
    color: theme.palette.text.secondary,
  },

  // Header styling
  '& .fc-col-header-cell': {
    backgroundColor: theme.palette.background.paper,
    borderColor: theme.palette.divider,
    '& .fc-col-header-cell-cushion': {
      color: theme.palette.text.primary,
      padding: '8px',
      fontWeight: 600,
    },
  },

  // Day grid event spacing
  '& .fc-daygrid-day-events': {
    margin: '0 1px',
  },

  // Improve multi-day events
  '& .fc-daygrid-block-event': {
    borderRadius: '4px !important',
    margin: '1px 0',
    padding: '1px',
  },
})); 