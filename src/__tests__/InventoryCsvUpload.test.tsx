import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Papa from 'papaparse';
import InventoryCsvUpload from '../components/InventoryCsvUpload';
import { supabase } from '../lib/supabaseClient';

// Mock dependencies
vi.mock('papaparse');
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
    })),
  },
}));

// Setup QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('InventoryCsvUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    
    // Reset mock implementations
    (supabase.from as any).mockImplementation(() => ({
      select: () => Promise.resolve({
        data: [
          { name: 'Product 1', id: 1 },
          { name: 'Product 2', id: 2 },
        ],
        error: null,
      }),
      insert: () => Promise.resolve({
        data: [{ id: 1 }],
        error: null,
      }),
    }));

    (Papa.parse as any).mockImplementation((_, options) => {
      options.complete({
        data: [{
          'Product Name': 'Product 1',
          'HSN Code': '1234',
          'UNITS': 'PCS',
          'Purchase Invoice Number': 'INV001',
          'Purchase Quantity': 10,
          'Purchase Cost per Unit': 100,
          'GST Percentage': 18,
        }],
      });
    });
  });

  it('renders without crashing', async () => {
    render(<InventoryCsvUpload />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Inventory CSV Upload')).toBeInTheDocument();
    });
  });

  it('handles CSV file upload correctly', async () => {
    render(<InventoryCsvUpload />, { wrapper });
    
    const file = new File(
      ['Product Name,HSN Code,UNITS,Purchase Invoice Number,Purchase Quantity,Purchase Cost per Unit,GST Percentage\nProduct 1,1234,PCS,INV001,10,100,18'],
      'test.csv',
      { type: 'text/csv' }
    );

    const input = screen.getByLabelText(/upload csv/i);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });

  it('validates derived fields in CSV data', async () => {
    render(<InventoryCsvUpload />, { wrapper });
    
    const file = new File(
      ['Product Name,HSN Code,UNITS,Purchase Invoice Number,Purchase Quantity,Purchase Cost per Unit,GST Percentage,Purchase Taxable Value\nProduct 1,1234,PCS,INV001,10,100,18,1001'],
      'test.csv',
      { type: 'text/csv' }
    );

    const input = screen.getByLabelText(/upload csv/i);
    
    // Override Papa.parse mock for this test
    (Papa.parse as any).mockImplementation((_, options) => {
      options.complete({
        data: [{
          'Product Name': 'Product 1',
          'HSN Code': '1234',
          'UNITS': 'PCS',
          'Purchase Invoice Number': 'INV001',
          'Purchase Quantity': 10,
          'Purchase Cost per Unit': 100,
          'GST Percentage': 18,
          'Purchase Taxable Value': 1001, // Should be 1000
        }],
      });
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/validation error/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles manual stock input correctly', async () => {
    render(<InventoryCsvUpload />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
    });

    // Fill in manual input fields
    fireEvent.mouseDown(screen.getByLabelText('Product Name'));
    fireEvent.click(screen.getByText('Product 1'));

    fireEvent.change(screen.getByLabelText('HSN Code'), {
      target: { value: '1234' },
    });
    fireEvent.change(screen.getByLabelText('Units'), {
      target: { value: 'PCS' },
    });
    fireEvent.change(screen.getByLabelText('Purchase Invoice Number'), {
      target: { value: 'INV001' },
    });
    fireEvent.change(screen.getByLabelText('Purchase Quantity'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByLabelText('Purchase Cost per Unit'), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText('GST Percentage'), {
      target: { value: '18' },
    });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });

    expect(supabase.from).toHaveBeenCalledWith('purchases');
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    (supabase.from as any).mockImplementation(() => ({
      select: () => Promise.resolve({
        data: null,
        error: new Error('API Error'),
      }),
      insert: () => Promise.resolve({
        data: null,
        error: new Error('API Error'),
      }),
    }));

    render(<InventoryCsvUpload />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('updates stock balance after successful purchase', async () => {
    render(<InventoryCsvUpload />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
    });

    // Fill and submit manual input
    fireEvent.mouseDown(screen.getByLabelText('Product Name'));
    fireEvent.click(screen.getByText('Product 1'));
    
    fireEvent.change(screen.getByLabelText('Purchase Quantity'), {
      target: { value: '10' },
    });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      const queries = queryClient.getQueryCache().findAll(['stock_balances']);
      expect(queries[0]?.isInvalidated()).toBe(true);
    });
  });
}); 