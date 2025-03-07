import { useState, useEffect } from 'react'
import { Box, Button, Snackbar, Stack } from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Development helper component for manual refreshing
 * Only renders in development mode
 */
export function DevRefresher() {
  const queryClient = useQueryClient()
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [open, setOpen] = useState(false)

  // Only show in development
  if (import.meta.env.PROD) {
    return null
  }

  const handleRefresh = () => {
    // Invalidate all queries
    queryClient.invalidateQueries()
    
    // Clear all storage (optional, can be destructive)
    // localStorage.clear()
    // sessionStorage.clear()
    
    // Force browser reload
    // window.location.reload()
    
    // Update last refresh time
    const now = new Date().toLocaleTimeString()
    setLastRefresh(now)
    setOpen(true)
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {lastRefresh && (
          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            Last refresh: {lastRefresh}
          </Box>
        )}
        <Button
          variant="contained"
          color="warning"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Force Refresh
        </Button>
      </Stack>
      
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        message="Application state refreshed"
      />
    </Box>
  )
} 