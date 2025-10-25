import React, { useState, useEffect } from 'react';
import {
  Flex,
  LoadingSpinner,
  Text,
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Select,
  Input,
  hubspot
} from '@hubspot/ui-extensions';

const GridView = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productSlots, setProductSlots] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [filters, setFilters] = useState({
    productType: '',
    status: '',
    owner: ''
  });

  // Generate 50-day date range
  useEffect(() => {
    const dates = [];
    const start = new Date(startDate);
    for (let i = 0; i < 50; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    setDateRange(dates);
  }, [startDate]);

  // Fetch products and product slots
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all products
        const productsResponse = await hubspot.crm.objects.products.list({
          limit: 100,
          properties: ['name', 'hs_sku', 'price', 'product_type', 'product_team', 'product_size']
        });
        setProducts(productsResponse.results || []);

        // Fetch product slots within date range
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 50);

        const slotsResponse = await hubspot.crm.objects.custom.product_slots.list({
          limit: 500,
          properties: [
            'slot_name',
            'start_date',
            'end_date',
            'status',
            'product_name',
            'product_type',
            'total_amount',
            'duration_days'
          ],
          associations: ['deals', 'contacts', 'companies', 'products']
        });

        setProductSlots(slotsResponse.results || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate]);

  // Get slot for a specific product and date
  const getSlotForCell = (productId, date) => {
    return productSlots.find(slot => {
      const slotStart = new Date(slot.properties.start_date);
      const slotEnd = new Date(slot.properties.end_date);
      const cellDate = new Date(date);

      // Check if this slot's product matches and date is within range
      const productMatch = slot.associations?.products?.some(p => p.id === productId);
      const dateMatch = cellDate >= slotStart && cellDate <= slotEnd;

      return productMatch && dateMatch;
    });
  };

  // Check if cell is the first day of a multi-day slot
  const isSlotStart = (slot, date) => {
    if (!slot) return false;
    const slotStart = new Date(slot.properties.start_date);
    const cellDate = new Date(date);
    return cellDate.toDateString() === slotStart.toDateString();
  };

  // Calculate colspan for spanning cells
  const getColspan = (slot, date, dateRange) => {
    if (!slot || !isSlotStart(slot, date)) return 0;

    const slotStart = new Date(slot.properties.start_date);
    const slotEnd = new Date(slot.properties.end_date);

    // Find how many visible columns this slot spans
    let span = 0;
    for (let i = 0; i < dateRange.length; i++) {
      const d = dateRange[i];
      if (d >= slotStart && d <= slotEnd) {
        span++;
      }
    }
    return span;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      available: '#FFFFFF',
      on_hold: '#FFF4E6',
      sold: '#D4EDDA',
      configuration: '#FFF3CD',
      delivered: '#D1ECF1'
    };
    return colors[status] || '#FFFFFF';
  };

  // Navigate to previous/next 50 days
  const navigateDays = (days) => {
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() + days);
    setStartDate(newStart);
  };

  // Format date for display
  const formatDate = (date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Filter products based on filters
  const filteredProducts = products.filter(product => {
    if (filters.productType && product.properties.product_type !== filters.productType) {
      return false;
    }
    // Add more filter logic as needed
    return true;
  });

  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" gap="medium">
        <LoadingSpinner />
        <Text>Loading calendar...</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="medium">
      {/* Header with filters and navigation */}
      <Flex justify="space-between" align="center">
        <Text format={{ fontWeight: 'bold', fontSize: 'large' }}>
          Calendar Sales Grid
        </Text>
        <Flex gap="small">
          <Button onClick={() => navigateDays(-50)}>← Previous 50 Days</Button>
          <Button onClick={() => setStartDate(new Date())}>Today</Button>
          <Button onClick={() => navigateDays(50)}>Next 50 Days →</Button>
        </Flex>
      </Flex>

      {/* Filters */}
      <Flex gap="small">
        <Select
          label="Product Type"
          placeholder="All Types"
          value={filters.productType}
          onChange={(value) => setFilters({ ...filters, productType: value })}
          options={[
            { value: '', label: 'All Types' },
            // Add product type options dynamically
          ]}
        />
        <Select
          label="Status"
          placeholder="All Statuses"
          value={filters.status}
          onChange={(value) => setFilters({ ...filters, status: value })}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'on_hold', label: 'On Hold' },
            { value: 'sold', label: 'Sold' },
            { value: 'configuration', label: 'Configuration' },
            { value: 'delivered', label: 'Delivered' }
          ]}
        />
      </Flex>

      {/* Grid Table */}
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <Table bordered>
          <TableHead>
            <TableRow>
              <TableHeader>Product</TableHeader>
              {dateRange.map((date, idx) => (
                <TableHeader key={idx} style={{ minWidth: '80px', textAlign: 'center' }}>
                  <div>{formatDate(date)}</div>
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map(product => (
              <TableRow key={product.id}>
                <TableCell>
                  <Text format={{ fontWeight: 'bold' }}>
                    {product.properties.name || 'Unnamed Product'}
                  </Text>
                  {product.properties.product_type && (
                    <div style={{ fontSize: '0.8em', color: '#666' }}>
                      {product.properties.product_type}
                    </div>
                  )}
                </TableCell>
                {dateRange.map((date, dateIdx) => {
                  const slot = getSlotForCell(product.id, date);
                  const isStart = isSlotStart(slot, date);
                  const colspan = getColspan(slot, date, dateRange);

                  // Skip cells that are part of a previous spanning cell
                  if (slot && !isStart) {
                    return null;
                  }

                  if (slot && isStart) {
                    return (
                      <TableCell
                        key={dateIdx}
                        colSpan={colspan}
                        style={{
                          backgroundColor: getStatusColor(slot.properties.status),
                          border: '2px solid #ccc',
                          padding: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '0.85em' }}>
                          <div style={{ fontWeight: 'bold' }}>
                            {slot.properties.status.replace('_', ' ').toUpperCase()}
                          </div>
                          {slot.properties.total_amount && (
                            <div>${slot.properties.total_amount}</div>
                          )}
                          <div style={{ fontSize: '0.9em', color: '#555' }}>
                            {slot.properties.duration_days} days
                          </div>
                        </div>
                      </TableCell>
                    );
                  }

                  // Empty cell - available
                  return (
                    <TableCell
                      key={dateIdx}
                      style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        height: '60px'
                      }}
                    />
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <Flex gap="small" wrap="wrap">
        <Text format={{ fontWeight: 'bold' }}>Status Legend:</Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#f8f9fa', border: '1px solid #ccc' }} />
          <Text>Available</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#FFF4E6', border: '1px solid #ccc' }} />
          <Text>On Hold</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#D4EDDA', border: '1px solid #ccc' }} />
          <Text>Sold</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#FFF3CD', border: '1px solid #ccc' }} />
          <Text>Configuration</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#D1ECF1', border: '1px solid #ccc' }} />
          <Text>Delivered</Text>
        </div>
      </Flex>

      {filteredProducts.length === 0 && (
        <Flex align="center" justify="center">
          <Text>No products found. Create products in HubSpot to get started.</Text>
        </Flex>
      )}
    </Flex>
  );
};

export default GridView;
