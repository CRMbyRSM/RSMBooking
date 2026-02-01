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
  Alert
} from '@hubspot/ui-extensions';

// Register the extension
hubspot.extend(({ context, runServerlessFunction }) => (
  <ContactBookingsCard
    context={context}
    runServerless={runServerlessFunction}
  />
));

const ContactBookingsCard = ({ context, runServerless }) => {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [error, setError] = useState(null);

  const contactId = context.crm.objectId;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await runServerless({
        name: 'getSlotsForContact',
        parameters: { contactId }
      });

      if (result.status === 'SUCCESS') {
        setSlots(result.response.body.slots);
        setContactInfo(result.response.body.contact);
      } else {
        setError(result.response?.body?.message || 'Failed to load bookings');
      }
    } catch (err) {
      console.error('Error fetching contact bookings:', err);
      setError('Failed to load bookings. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [contactId, runServerless]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals
  const totalValue = slots.reduce(
    (sum, slot) => sum + (parseFloat(slot.total_amount) || 0),
    0
  );

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
          Bookings ({slots.length})
        </Text>
        {slots.length > 0 && (
          <Text format={{ fontWeight: 'bold' }}>
            Total: ${totalValue.toFixed(2)}
          </Text>
        )}
      </Flex>

      {/* Bookings Table */}
      {slots.length > 0 ? (
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
      ) : (
        <EmptyState
          title="No bookings"
          layout="vertical"
          reverseOrder={true}
        >
          <Text>
            This contact has no product bookings yet.
          </Text>
        </EmptyState>
      )}
    </Flex>
  );
};

export default ContactBookingsCard;
