import React, { useState, useEffect, useCallback } from 'react';
import {
  hubspot,
  Flex,
  Text,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  LoadingSpinner,
  Tag,
  EmptyState,
  Alert,
  Statistics,
  StatisticsItem
} from '@hubspot/ui-extensions';

// Register the extension
hubspot.extend(({ context, runServerlessFunction }) => (
  <CompanyBookingsCard
    context={context}
    runServerless={runServerlessFunction}
  />
));

const CompanyBookingsCard = ({ context, runServerless }) => {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [error, setError] = useState(null);

  const companyId = context.crm.objectId;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await runServerless({
        name: 'getSlotsForCompany',
        parameters: { companyId }
      });

      if (result.status === 'SUCCESS') {
        // Sort by start date descending
        const sortedSlots = result.response.body.slots.sort(
          (a, b) => new Date(b.start_date) - new Date(a.start_date)
        );
        setSlots(sortedSlots);
        setCompanyInfo(result.response.body.company);
      } else {
        setError(result.response?.body?.message || 'Failed to load bookings');
      }
    } catch (err) {
      console.error('Error fetching company bookings:', err);
      setError('Failed to load bookings. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [companyId, runServerless]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate stats
  const stats = {
    total: slots.length,
    totalValue: slots.reduce(
      (sum, slot) => sum + (parseFloat(slot.total_amount) || 0),
      0
    ),
    onHold: slots.filter(s => s.status === 'on_hold').length,
    sold: slots.filter(s => s.status === 'sold').length,
    delivered: slots.filter(s => s.status === 'delivered').length
  };

  // Status badge styling
  const getStatusTag = (status) => {
    const variants = {
      on_hold: 'warning',
      sold: 'success',
      configuration: 'default',
      delivered: 'info'
    };
    const labels = {
      on_hold: 'On Hold',
      sold: 'Sold',
      configuration: 'Configuration',
      delivered: 'Delivered'
    };
    return {
      variant: variants[status] || 'default',
      label: labels[status] || status
    };
  };

  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" gap="md">
        <LoadingSpinner />
        <Text>Loading bookings...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert title="Error" variant="error">
        {error}
      </Alert>
    );
  }

  return (
    <Flex direction="column" gap="md">
      {/* Header */}
      <Flex justify="between" align="center">
        <Text format={{ fontWeight: 'bold' }}>
          Company Bookings
        </Text>
      </Flex>

      {slots.length > 0 ? (
        <>
          {/* Summary Statistics */}
          <Statistics>
            <StatisticsItem label="Total Bookings" number={stats.total} />
            <StatisticsItem
              label="Total Value"
              number={`$${stats.totalValue.toFixed(0)}`}
            />
            {stats.onHold > 0 && (
              <StatisticsItem label="On Hold" number={stats.onHold} />
            )}
            {stats.sold > 0 && (
              <StatisticsItem label="Sold" number={stats.sold} />
            )}
            {stats.delivered > 0 && (
              <StatisticsItem label="Delivered" number={stats.delivered} />
            )}
          </Statistics>

          {/* Bookings Table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Product</TableHeader>
                <TableHeader>Dates</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {slots.map((slot) => {
                const statusTag = getStatusTag(slot.status);
                return (
                  <TableRow key={slot.id}>
                    <TableCell>
                      <Text format={{ fontWeight: 'bold' }}>
                        {slot.product_name || 'N/A'}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Flex direction="column">
                        <Text>
                          {new Date(slot.start_date).toLocaleDateString()}
                        </Text>
                        <Text variant="microcopy">
                          to {new Date(slot.end_date).toLocaleDateString()}
                        </Text>
                        <Text variant="microcopy">
                          ({slot.duration_days} days)
                        </Text>
                      </Flex>
                    </TableCell>
                    <TableCell>
                      <Text format={{ fontWeight: 'bold' }}>
                        ${parseFloat(slot.total_amount || 0).toFixed(2)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Tag variant={statusTag.variant}>
                        {statusTag.label}
                      </Tag>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      ) : (
        <EmptyState
          title="No bookings"
          layout="vertical"
          reverseOrder={true}
        >
          <Text>
            This company has no product bookings yet.
          </Text>
        </EmptyState>
      )}
    </Flex>
  );
};

export default CompanyBookingsCard;
