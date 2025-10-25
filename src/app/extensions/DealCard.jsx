<<<<<<< HEAD
import React from 'react';
import { Text } from '@hubspot/ui-extensions';

export default function SimpleCard() {
  return <Text>Hello from Calendar Sales</Text>;
}
=======
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
  Modal,
  Form,
  Select,
  DateInput,
  NumberInput,
  TextArea,
  Alert,
  hubspot
} from '@hubspot/ui-extensions';

const DealCard = ({ context, actions, runServerless }) => {
  const [loading, setLoading] = useState(true);
  const [productSlots, setProductSlots] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [dealProperties, setDealProperties] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state for booking
  const [bookingForm, setBookingForm] = useState({
    productId: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  const dealId = context.crm?.objectId;

  // Fetch deal properties and associated product slots
  useEffect(() => {
    const fetchData = async () => {
      if (!dealId) return;

      setLoading(true);
      try {
        // Fetch deal properties
        const dealResponse = await hubspot.crm.objects.deal.get({
          objectId: dealId,
          properties: ['dealname', 'amount', 'dealstage', 'hs_object_id'],
          associations: ['contacts', 'companies', 'line_items', 'product_slots']
        });
        setDealProperties(dealResponse);

        // Fetch associated product slots
        if (dealResponse.associations?.product_slots) {
          const slotIds = dealResponse.associations.product_slots.map(s => s.id);
          const slotsPromises = slotIds.map(id =>
            hubspot.crm.objects.custom.product_slots.get({
              objectId: id,
              properties: [
                'slot_name',
                'start_date',
                'end_date',
                'status',
                'product_name',
                'total_amount',
                'duration_days'
              ]
            })
          );
          const slots = await Promise.all(slotsPromises);
          setProductSlots(slots);
        }

        // Fetch all products for booking dropdown
        const productsResponse = await hubspot.crm.objects.products.list({
          limit: 100,
          properties: ['name', 'price', 'product_type']
        });
        setProducts(productsResponse.results || []);

      } catch (err) {
        console.error('Error fetching deal data:', err);
        setError('Failed to load booking data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dealId]);

  // Handle booking form submission
  const handleBookSlot = async () => {
    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!bookingForm.productId || !bookingForm.startDate || !bookingForm.endDate) {
        setError('Please fill in all required fields');
        return;
      }

      const startDate = new Date(bookingForm.startDate);
      const endDate = new Date(bookingForm.endDate);

      if (endDate < startDate) {
        setError('End date must be after start date');
        return;
      }

      // Calculate duration
      const durationMs = endDate - startDate;
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;

      // Get product details
      const selectedProduct = products.find(p => p.id === bookingForm.productId);
      const dailyRate = parseFloat(selectedProduct?.properties?.price || 0);
      const totalAmount = dailyRate * durationDays;

      // Create product slot
      const slotName = `${selectedProduct?.properties?.name} - ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;

      const newSlot = await hubspot.crm.objects.custom.product_slots.create({
        properties: {
          slot_name: slotName,
          start_date: bookingForm.startDate,
          end_date: bookingForm.endDate,
          status: 'on_hold', // Default status for new bookings
          product_name: selectedProduct?.properties?.name,
          product_type: selectedProduct?.properties?.product_type,
          daily_rate: dailyRate,
          total_amount: totalAmount,
          duration_days: durationDays,
          booking_notes: bookingForm.notes
        }
      });

      // Associate slot with deal
      await hubspot.crm.associations.create({
        fromObjectType: 'product_slots',
        fromObjectId: newSlot.id,
        toObjectType: 'deals',
        toObjectId: dealId,
        associationType: 'product_slot_to_deal'
      });

      // Associate slot with product
      await hubspot.crm.associations.create({
        fromObjectType: 'product_slots',
        fromObjectId: newSlot.id,
        toObjectType: 'products',
        toObjectId: bookingForm.productId,
        associationType: 'product_slot_to_product'
      });

      // Associate slot with contacts from deal
      if (dealProperties?.associations?.contacts) {
        for (const contact of dealProperties.associations.contacts) {
          await hubspot.crm.associations.create({
            fromObjectType: 'product_slots',
            fromObjectId: newSlot.id,
            toObjectType: 'contacts',
            toObjectId: contact.id,
            associationType: 'product_slot_to_contact'
          });
        }
      }

      // Associate slot with companies from deal
      if (dealProperties?.associations?.companies) {
        for (const company of dealProperties.associations.companies) {
          await hubspot.crm.associations.create({
            fromObjectType: 'product_slots',
            fromObjectId: newSlot.id,
            toObjectType: 'companies',
            toObjectId: company.id,
            associationType: 'product_slot_to_company'
          });
        }
      }

      // Add product as line item to deal (optional)
      // This would require line items API implementation

      setSuccess(`Successfully booked ${durationDays} days for ${selectedProduct?.properties?.name}`);
      setShowBookingModal(false);

      // Refresh product slots
      setProductSlots([...productSlots, newSlot]);

      // Reset form
      setBookingForm({
        productId: '',
        startDate: '',
        endDate: '',
        notes: ''
      });

    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const badges = {
      on_hold: { color: 'warning', text: 'On Hold' },
      sold: { color: 'success', text: 'Sold' },
      configuration: { color: 'info', text: 'Configuration' },
      delivered: { color: 'default', text: 'Delivered' }
    };
    return badges[status] || { color: 'default', text: status };
  };

  if (loading) {
    return (
      <Flex align="center" justify="center">
        <LoadingSpinner />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="medium">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Flex justify="space-between" align="center">
        <Text format={{ fontWeight: 'bold' }}>Product Bookings</Text>
        <Button variant="primary" onClick={() => setShowBookingModal(true)}>
          Book Slots
        </Button>
      </Flex>

      {productSlots.length > 0 ? (
        <Table bordered>
          <TableHead>
            <TableRow>
              <TableHeader>Product</TableHeader>
              <TableHeader>Dates</TableHeader>
              <TableHeader>Duration</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {productSlots.map(slot => (
              <TableRow key={slot.id}>
                <TableCell>{slot.properties.product_name || 'N/A'}</TableCell>
                <TableCell>
                  {new Date(slot.properties.start_date).toLocaleDateString()} -
                  {new Date(slot.properties.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{slot.properties.duration_days} days</TableCell>
                <TableCell>${slot.properties.total_amount || 0}</TableCell>
                <TableCell>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: slot.properties.status === 'sold' ? '#d4edda' : '#fff4e6',
                    fontSize: '0.85em'
                  }}>
                    {getStatusBadge(slot.properties.status).text}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Text>No bookings yet. Click "Book Slots" to create your first booking.</Text>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <Modal
          title="Book Product Slots"
          onClose={() => setShowBookingModal(false)}
          width="medium"
        >
          <Flex direction="column" gap="medium">
            <Select
              label="Product"
              name="productId"
              required
              value={bookingForm.productId}
              onChange={(value) => setBookingForm({ ...bookingForm, productId: value })}
              options={[
                { value: '', label: 'Select a product...' },
                ...products.map(p => ({
                  value: p.id,
                  label: `${p.properties.name} - $${p.properties.price || 0}/day`
                }))
              ]}
            />

            <DateInput
              label="Start Date"
              name="startDate"
              required
              value={bookingForm.startDate}
              onChange={(value) => setBookingForm({ ...bookingForm, startDate: value })}
            />

            <DateInput
              label="End Date"
              name="endDate"
              required
              value={bookingForm.endDate}
              onChange={(value) => setBookingForm({ ...bookingForm, endDate: value })}
            />

            <TextArea
              label="Booking Notes"
              name="notes"
              value={bookingForm.notes}
              onChange={(value) => setBookingForm({ ...bookingForm, notes: value })}
              placeholder="Any special requirements or notes..."
            />

            <Flex gap="small" justify="end">
              <Button onClick={() => setShowBookingModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleBookSlot}>
                Create Booking
              </Button>
            </Flex>
          </Flex>
        </Modal>
      )}
    </Flex>
  );
};

export default DealCard;
>>>>>>> backup-full-version
