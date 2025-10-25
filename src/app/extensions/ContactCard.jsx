import React, { useState, useEffect } from 'react';
import {
  Flex,
  LoadingSpinner,
  Text,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  hubspot
} from '@hubspot/ui-extensions';

const ContactCard = ({ context }) => {
  const [loading, setLoading] = useState(true);
  const [productSlots, setProductSlots] = useState([]);

  const contactId = context.crm?.objectId;

  useEffect(() => {
    const fetchProductSlots = async () => {
      if (!contactId) return;

      setLoading(true);
      try {
        // Fetch contact with associations
        const contactResponse = await hubspot.crm.objects.contact.get({
          objectId: contactId,
          associations: ['product_slots']
        });

        // Fetch associated product slots
        if (contactResponse.associations?.product_slots) {
          const slotIds = contactResponse.associations.product_slots.map(s => s.id);
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
      } catch (error) {
        console.error('Error fetching product slots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductSlots();
  }, [contactId]);

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      on_hold: { bg: '#FFF4E6', text: 'On Hold' },
      sold: { bg: '#D4EDDA', text: 'Sold' },
      configuration: { bg: '#FFF3CD', text: 'Configuration' },
      delivered: { bg: '#D1ECF1', text: 'Delivered' }
    };
    return badges[status] || { bg: '#f8f9fa', text: status };
  };

  if (loading) {
    return (
      <Flex align="center" justify="center">
        <LoadingSpinner />
      </Flex>
    );
  }

  if (productSlots.length === 0) {
    return (
      <Flex direction="column" gap="small">
        <Text format={{ fontWeight: 'bold' }}>Bookings</Text>
        <Text>No bookings found for this contact.</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="medium">
      <Text format={{ fontWeight: 'bold' }}>Bookings ({productSlots.length})</Text>

      <Table bordered>
        <TableHead>
          <TableRow>
            <TableHeader>Product</TableHeader>
            <TableHeader>Dates</TableHeader>
            <TableHeader>Amount</TableHeader>
            <TableHeader>Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {productSlots.map(slot => {
            const badge = getStatusBadge(slot.properties.status);
            return (
              <TableRow key={slot.id}>
                <TableCell>
                  <Text format={{ fontWeight: 'bold' }}>
                    {slot.properties.product_name || 'N/A'}
                  </Text>
                </TableCell>
                <TableCell>
                  <div>{new Date(slot.properties.start_date).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                    to {new Date(slot.properties.end_date).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                    ({slot.properties.duration_days} days)
                  </div>
                </TableCell>
                <TableCell>
                  ${slot.properties.total_amount || 0}
                </TableCell>
                <TableCell>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: badge.bg,
                    fontSize: '0.85em'
                  }}>
                    {badge.text}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Text format={{ fontSize: 'small', color: 'secondary' }}>
        Total bookings value: ${productSlots.reduce((sum, slot) => sum + (parseFloat(slot.properties.total_amount) || 0), 0).toFixed(2)}
      </Text>
    </Flex>
  );
};

export default ContactCard;
