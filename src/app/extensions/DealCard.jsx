import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Form,
  Select,
  DateInput,
  TextArea,
  Divider,
  Tag,
  EmptyState
} from '@hubspot/ui-extensions';

// Register the extension
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <DealBookingCard
    context={context}
    runServerless={runServerlessFunction}
    actions={actions}
  />
));

const DealBookingCard = ({ context, runServerless, actions }) => {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [products, setProducts] = useState([]);
  const [dealInfo, setDealInfo] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  const dealId = context.crm.objectId;

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch products for dropdown
      const productsResult = await runServerless({
        name: 'getProducts',
        parameters: {}
      });

      if (productsResult.status === 'SUCCESS') {
        setProducts(productsResult.response.body.products);
      }

      // Fetch slots for this deal
      const slotsResult = await runServerless({
        name: 'getSlotsForDeal',
        parameters: { dealId }
      });

      if (slotsResult.status === 'SUCCESS') {
        setSlots(slotsResult.response.body.slots);
        setDealInfo(slotsResult.response.body.deal);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load booking data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [dealId, runServerless]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle form submission
  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.productId) {
      setError('Please select a product');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setError('Please select start and end dates');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate < startDate) {
      setError('End date must be after start date');
      return;
    }

    setSubmitting(true);

    try {
      const selectedProduct = products.find(p => p.id === formData.productId);

      const result = await runServerless({
        name: 'createBooking',
        parameters: {
          dealId,
          productId: formData.productId,
          productName: selectedProduct?.name || 'Unknown Product',
          productPrice: selectedProduct?.price || '0',
          startDate: formData.startDate,
          endDate: formData.endDate,
          notes: formData.notes
        }
      });

      if (result.status === 'SUCCESS') {
        setSuccess(result.response.body.message);
        setShowForm(false);
        setFormData({ productId: '', startDate: '', endDate: '', notes: '' });
        // Refresh slots
        fetchData();
      } else {
        setError(result.response?.body?.message || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update slot status
  const handleStatusChange = async (slotId, newStatus) => {
    try {
      const result = await runServerless({
        name: 'updateBookingStatus',
        parameters: { slotId, status: newStatus }
      });

      if (result.status === 'SUCCESS') {
        setSuccess(`Status updated to ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

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

  return (
    <Flex direction="column" gap="md">
      {/* Header */}
      <Flex justify="between" align="center">
        <Text format={{ fontWeight: 'bold' }}>
          Product Bookings
        </Text>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Book Slots'}
        </Button>
      </Flex>

      {/* Alerts */}
      {error && (
        <Alert title="Error" variant="error">
          {error}
        </Alert>
      )}
      {success && (
        <Alert title="Success" variant="success">
          {success}
        </Alert>
      )}

      {/* Booking Form */}
      {showForm && (
        <Flex direction="column" gap="sm">
          <Divider />
          <Text format={{ fontWeight: 'bold' }}>New Booking</Text>

          <Select
            label="Product"
            name="productId"
            required={true}
            value={formData.productId}
            onChange={(value) => setFormData({ ...formData, productId: value })}
            options={[
              { label: 'Select a product...', value: '' },
              ...products.map(p => ({
                label: `${p.name} - $${p.price || 0}/day`,
                value: p.id
              }))
            ]}
          />

          <Flex gap="sm">
            <DateInput
              label="Start Date"
              name="startDate"
              required={true}
              value={formData.startDate}
              onChange={(value) => setFormData({ ...formData, startDate: value })}
            />
            <DateInput
              label="End Date"
              name="endDate"
              required={true}
              value={formData.endDate}
              onChange={(value) => setFormData({ ...formData, endDate: value })}
            />
          </Flex>

          <TextArea
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={(value) => setFormData({ ...formData, notes: value })}
            placeholder="Special requirements, instructions..."
          />

          <Flex justify="end" gap="sm">
            <Button onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Booking'}
            </Button>
          </Flex>

          <Divider />
        </Flex>
      )}

      {/* Bookings Table */}
      {slots.length > 0 ? (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Product</TableHeader>
                <TableHeader>Dates</TableHeader>
                <TableHeader>Days</TableHeader>
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
                      <Text>
                        {new Date(slot.start_date).toLocaleDateString()} →{' '}
                        {new Date(slot.end_date).toLocaleDateString()}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text>{slot.duration_days}</Text>
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

          {/* Total */}
          <Flex justify="end">
            <Text format={{ fontWeight: 'bold' }}>
              Total: ${totalValue.toFixed(2)}
            </Text>
          </Flex>
        </>
      ) : (
        <EmptyState
          title="No bookings yet"
          layout="vertical"
          reverseOrder={true}
        >
          <Text>
            Click "Book Slots" to reserve products for this deal.
          </Text>
        </EmptyState>
      )}
    </Flex>
  );
};

export default DealBookingCard;
