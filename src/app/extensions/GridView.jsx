import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  hubspot,
  Flex,
  Text,
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  LoadingSpinner,
  Select,
  Alert,
  Box,
  Tile
} from '@hubspot/ui-extensions';

// Register the extension
hubspot.extend(({ runServerlessFunction }) => (
  <CalendarGridView runServerless={runServerlessFunction} />
));

const CalendarGridView = ({ runServerless }) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('');

  // Generate 50-day date range
  const dateRange = useMemo(() => {
    const dates = [];
    const start = new Date(startDate);
    for (let i = 0; i < 50; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [startDate]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await runServerless({
        name: 'getAllSlots',
        parameters: {}
      });

      if (result.status === 'SUCCESS') {
        setProducts(result.response.body.products);
        setSlots(result.response.body.slots);
      } else {
        setError(result.response?.body?.message || 'Failed to load calendar data');
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [runServerless]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigate dates
  const navigateDays = (days) => {
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() + days);
    setStartDate(newStart);
  };

  const goToToday = () => {
    setStartDate(new Date());
  };

  // Get slot for a specific product and date
  const getSlotForCell = useCallback((productId, date) => {
    return slots.find(slot => {
      if (slot.productId !== productId) return false;

      const slotStart = new Date(slot.start_date);
      const slotEnd = new Date(slot.end_date);
      const cellDate = new Date(date);

      // Normalize to start of day for comparison
      slotStart.setHours(0, 0, 0, 0);
      slotEnd.setHours(0, 0, 0, 0);
      cellDate.setHours(0, 0, 0, 0);

      return cellDate >= slotStart && cellDate <= slotEnd;
    });
  }, [slots]);

  // Check if cell is the first day of a slot
  const isSlotStart = useCallback((slot, date) => {
    if (!slot) return false;
    const slotStart = new Date(slot.start_date);
    const cellDate = new Date(date);
    slotStart.setHours(0, 0, 0, 0);
    cellDate.setHours(0, 0, 0, 0);
    return cellDate.getTime() === slotStart.getTime();
  }, []);

  // Get status styling
  const getStatusStyle = (status) => {
    const styles = {
      on_hold: { bg: '#FFF4E6', border: '#F0AD4E', text: 'On Hold' },
      sold: { bg: '#D4EDDA', border: '#28A745', text: 'Sold' },
      configuration: { bg: '#FFF3CD', border: '#FFC107', text: 'Config' },
      delivered: { bg: '#D1ECF1', border: '#17A2B8', text: 'Delivered' }
    };
    return styles[status] || { bg: '#F8F9FA', border: '#DEE2E6', text: status };
  };

  // Format date header
  const formatDateHeader = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    return { date: `${month}/${day}`, weekday };
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" gap="lg">
        <LoadingSpinner />
        <Text>Loading calendar...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex direction="column" gap="md">
        <Alert title="Error" variant="error">
          {error}
        </Alert>
        <Button onClick={fetchData}>Retry</Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="md">
      {/* Header */}
      <Flex justify="between" align="center">
        <Text format={{ fontWeight: 'bold' }}>
          Calendar Sales Grid
        </Text>
        <Flex gap="sm">
          <Button size="sm" onClick={() => navigateDays(-50)}>
            ← Previous
          </Button>
          <Button size="sm" variant="secondary" onClick={goToToday}>
            Today
          </Button>
          <Button size="sm" onClick={() => navigateDays(50)}>
            Next →
          </Button>
        </Flex>
      </Flex>

      {/* Date Range Display */}
      <Text variant="microcopy">
        Showing: {dateRange[0].toLocaleDateString()} - {dateRange[dateRange.length - 1].toLocaleDateString()}
      </Text>

      {/* Filters */}
      <Flex gap="sm">
        <Select
          label="Filter by Status"
          value={filterStatus}
          onChange={(value) => setFilterStatus(value)}
          options={[
            { label: 'All Statuses', value: '' },
            { label: 'On Hold', value: 'on_hold' },
            { label: 'Sold', value: 'sold' },
            { label: 'Configuration', value: 'configuration' },
            { label: 'Delivered', value: 'delivered' }
          ]}
        />
        <Button variant="secondary" size="sm" onClick={fetchData}>
          Refresh
        </Button>
      </Flex>

      {/* Legend */}
      <Flex gap="md" wrap="wrap">
        <Text variant="microcopy" format={{ fontWeight: 'bold' }}>Legend:</Text>
        <Flex gap="xs" align="center">
          <Box inline={true}>
            <div style={{ width: 16, height: 16, backgroundColor: '#F8F9FA', border: '1px solid #DEE2E6' }} />
          </Box>
          <Text variant="microcopy">Available</Text>
        </Flex>
        <Flex gap="xs" align="center">
          <Box inline={true}>
            <div style={{ width: 16, height: 16, backgroundColor: '#FFF4E6', border: '1px solid #F0AD4E' }} />
          </Box>
          <Text variant="microcopy">On Hold</Text>
        </Flex>
        <Flex gap="xs" align="center">
          <Box inline={true}>
            <div style={{ width: 16, height: 16, backgroundColor: '#D4EDDA', border: '1px solid #28A745' }} />
          </Box>
          <Text variant="microcopy">Sold</Text>
        </Flex>
        <Flex gap="xs" align="center">
          <Box inline={true}>
            <div style={{ width: 16, height: 16, backgroundColor: '#D1ECF1', border: '1px solid #17A2B8' }} />
          </Box>
          <Text variant="microcopy">Delivered</Text>
        </Flex>
      </Flex>

      {/* Grid */}
      {products.length > 0 ? (
        <Box>
          <Table bordered={true}>
            <TableHead>
              <TableRow>
                <TableHeader>Product</TableHeader>
                {dateRange.map((date, idx) => {
                  const { date: dateStr, weekday } = formatDateHeader(date);
                  const todayStyle = isToday(date) ? { fontWeight: 'bold' } : {};
                  const weekendStyle = isWeekend(date) ? { color: '#6C757D' } : {};

                  return (
                    <TableHeader key={idx}>
                      <Flex direction="column" align="center">
                        <Text variant="microcopy" format={{ ...todayStyle, ...weekendStyle }}>
                          {weekday}
                        </Text>
                        <Text variant="microcopy" format={{ ...todayStyle, ...weekendStyle }}>
                          {dateStr}
                        </Text>
                      </Flex>
                    </TableHeader>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map(product => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Flex direction="column">
                      <Text format={{ fontWeight: 'bold' }}>
                        {product.name}
                      </Text>
                      <Text variant="microcopy">
                        ${product.price || 0}/day
                      </Text>
                    </Flex>
                  </TableCell>
                  {dateRange.map((date, dateIdx) => {
                    const slot = getSlotForCell(product.id, date);

                    // Apply filter
                    if (filterStatus && slot && slot.status !== filterStatus) {
                      return (
                        <TableCell key={dateIdx}>
                          <div style={{
                            width: '100%',
                            height: 40,
                            backgroundColor: '#F8F9FA'
                          }} />
                        </TableCell>
                      );
                    }

                    if (slot) {
                      const style = getStatusStyle(slot.status);
                      const showDetails = isSlotStart(slot, date);

                      return (
                        <TableCell key={dateIdx}>
                          <div style={{
                            width: '100%',
                            minHeight: 40,
                            backgroundColor: style.bg,
                            borderLeft: `3px solid ${style.border}`,
                            padding: 4,
                            fontSize: 11
                          }}>
                            {showDetails ? (
                              <Flex direction="column">
                                <Text variant="microcopy" format={{ fontWeight: 'bold' }}>
                                  {style.text}
                                </Text>
                                {slot.total_amount && (
                                  <Text variant="microcopy">
                                    ${parseFloat(slot.total_amount).toFixed(0)}
                                  </Text>
                                )}
                              </Flex>
                            ) : (
                              <Text variant="microcopy">•</Text>
                            )}
                          </div>
                        </TableCell>
                      );
                    }

                    // Empty cell - available
                    return (
                      <TableCell key={dateIdx}>
                        <div style={{
                          width: '100%',
                          height: 40,
                          backgroundColor: isWeekend(date) ? '#F1F3F5' : '#F8F9FA'
                        }} />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Tile>
          <Flex direction="column" align="center" gap="md">
            <Text format={{ fontWeight: 'bold' }}>No Products Found</Text>
            <Text>
              Create products in HubSpot (Sales → Products) to start booking slots.
            </Text>
          </Flex>
        </Tile>
      )}

      {/* Summary */}
      <Flex justify="between">
        <Text variant="microcopy">
          {products.length} products • {slots.length} active bookings
        </Text>
        <Text variant="microcopy">
          Last refreshed: {new Date().toLocaleTimeString()}
        </Text>
      </Flex>
    </Flex>
  );
};

export default CalendarGridView;
