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

const CompanyCard = ({ context }) => {
  const [loading, setLoading] = useState(true);
  const [productSlots, setProductSlots] = useState([]);

  const companyId = context.crm?.objectId;

  useEffect(() => {
    const fetchProductSlots = async () => {
      if (!companyId) return;

      setLoading(true);
      try {
        // Fetch company with associations
        const companyResponse = await hubspot.crm.objects.company.get({
          objectId: companyId,
          associations: ['product_slots']
        });

        // Fetch associated product slots
        if (companyResponse.associations?.product_slots) {
          const slotIds = companyResponse.associations.product_slots.map(s => s.id);
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

          // Sort by start date descending
          slots.sort((a, b) => new Date(b.properties.start_date) - new Date(a.properties.start_date));

          setProductSlots(slots);
        }
      } catch (error) {
        console.error('Error fetching product slots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductSlots();
  }, [companyId]);

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

  // Calculate summary stats
  const stats = {
    total: productSlots.length,
    totalValue: productSlots.reduce((sum, slot) => sum + (parseFloat(slot.properties.total_amount) || 0), 0),
    onHold: productSlots.filter(s => s.properties.status === 'on_hold').length,
    sold: productSlots.filter(s => s.properties.status === 'sold').length,
    delivered: productSlots.filter(s => s.properties.status === 'delivered').length
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
        <Text format={{ fontWeight: 'bold' }}>Company Bookings</Text>
        <Text>No bookings found for this company.</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="medium">
      <Flex justify="space-between" align="center">
        <Text format={{ fontWeight: 'bold' }}>Company Bookings ({stats.total})</Text>
        <Text format={{ fontSize: 'large', fontWeight: 'bold' }}>
          ${stats.totalValue.toFixed(2)}
        </Text>
      </Flex>

      {/* Summary Stats */}
      <Flex gap="small" wrap="wrap">
        {stats.onHold > 0 && (
          <div style={{ padding: '8px 12px', backgroundColor: '#FFF4E6', borderRadius: '4px', fontSize: '0.9em' }}>
            {stats.onHold} On Hold
          </div>
        )}
        {stats.sold > 0 && (
          <div style={{ padding: '8px 12px', backgroundColor: '#D4EDDA', borderRadius: '4px', fontSize: '0.9em' }}>
            {stats.sold} Sold
          </div>
        )}
        {stats.delivered > 0 && (
          <div style={{ padding: '8px 12px', backgroundColor: '#D1ECF1', borderRadius: '4px', fontSize: '0.9em' }}>
            {stats.delivered} Delivered
          </div>
        )}
      </Flex>

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
    </Flex>
  );
};

export default CompanyCard;
