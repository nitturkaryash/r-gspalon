import Products from './pages/Products';

function App() {
  return (
    <Router>
      <Routes>
        {/* ... existing routes */}
        <Route path="/services" element={<Services />} />
        <Route path="/products" element={<Products />} />
        {/* ... other routes */}
      </Routes>
    </Router>
  );
}

export default App; 