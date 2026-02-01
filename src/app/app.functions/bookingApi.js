/**
 * RSMBooking - Serverless Functions
 * 
 * These functions handle all HubSpot API operations for the booking system.
 * UI Extensions call these via runServerless().
 */

const hubspot = require('@hubspot/api-client');

// Initialize HubSpot client with private app token
const getHubSpotClient = (context) => {
  return new hubspot.Client({
    accessToken: process.env.PRIVATE_APP_ACCESS_TOKEN
  });
};

/**
 * Get all products for booking dropdown
 */
exports.getProducts = async (context, sendResponse) => {
  const client = getHubSpotClient(context);
  
  try {
    const response = await client.crm.objects.basicApi.getPage(
      'products',
      100, // limit
      undefined, // after
      ['name', 'price', 'hs_sku', 'description']
    );
    
    sendResponse({
      status: 'SUCCESS',
      body: {
        products: response.results.map(p => ({
          id: p.id,
          name: p.properties.name,
          price: p.properties.price || '0',
          sku: p.properties.hs_sku,
          description: p.properties.description
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    sendResponse({
      status: 'ERROR',
      body: { message: error.message }
    });
  }
};

/**
 * Get product slots for a specific deal
 */
exports.getSlotsForDeal = async (context, sendResponse) => {
  const client = getHubSpotClient(context);
  const { dealId } = context.parameters;
  
  try {
    // Get deal with associations to product_slots
    const deal = await client.crm.deals.basicApi.getById(
      dealId,
      ['dealname', 'amount', 'dealstage'],
      undefined,
      ['product_slots']
    );
    
    const slotIds = deal.associations?.product_slots?.results?.map(a => a.id) || [];
    
    if (slotIds.length === 0) {
      sendResponse({
        status: 'SUCCESS',
        body: { slots: [], deal: deal.properties }
      });
      return;
    }
    
    // Fetch slot details
    const slotsResponse = await client.crm.objects.batchApi.read(
      'product_slots',
      {
        inputs: slotIds.map(id => ({ id })),
        properties: [
          'slot_name', 'start_date', 'end_date', 'status',
          'product_name', 'product_type', 'daily_rate',
          'total_amount', 'duration_days', 'booking_notes'
        ]
      }
    );
    
    sendResponse({
      status: 'SUCCESS',
      body: {
        slots: slotsResponse.results.map(s => ({
          id: s.id,
          ...s.properties
        })),
        deal: deal.properties
      }
    });
  } catch (error) {
    console.error('Error fetching slots for deal:', error);
    sendResponse({
      status: 'ERROR',
      body: { message: error.message }
    });
  }
};

/**
 * Get product slots for a contact
 */
exports.getSlotsForContact = async (context, sendResponse) => {
  const client = getHubSpotClient(context);
  const { contactId } = context.parameters;
  
  try {
    const contact = await client.crm.contacts.basicApi.getById(
      contactId,
      ['firstname', 'lastname', 'email'],
      undefined,
      ['product_slots']
    );
    
    const slotIds = contact.associations?.product_slots?.results?.map(a => a.id) || [];
    
    if (slotIds.length === 0) {
      sendResponse({
        status: 'SUCCESS',
        body: { slots: [], contact: contact.properties }
      });
      return;
    }
    
    const slotsResponse = await client.crm.objects.batchApi.read(
      'product_slots',
      {
        inputs: slotIds.map(id => ({ id })),
        properties: [
          'slot_name', 'start_date', 'end_date', 'status',
          'product_name', 'total_amount', 'duration_days'
        ]
      }
    );
    
    sendResponse({
      status: 'SUCCESS',
      body: {
        slots: slotsResponse.results.map(s => ({
          id: s.id,
          ...s.properties
        })),
        contact: contact.properties
      }
    });
  } catch (error) {
    console.error('Error fetching slots for contact:', error);
    sendResponse({
      status: 'ERROR',
      body: { message: error.message }
    });
  }
};

/**
 * Get product slots for a company
 */
exports.getSlotsForCompany = async (context, sendResponse) => {
  const client = getHubSpotClient(context);
  const { companyId } = context.parameters;
  
  try {
    const company = await client.crm.companies.basicApi.getById(
      companyId,
      ['name', 'domain'],
      undefined,
      ['product_slots']
    );
    
    const slotIds = company.associations?.product_slots?.results?.map(a => a.id) || [];
    
    if (slotIds.length === 0) {
      sendResponse({
        status: 'SUCCESS',
        body: { slots: [], company: company.properties }
      });
      return;
    }
    
    const slotsResponse = await client.crm.objects.batchApi.read(
      'product_slots',
      {
        inputs: slotIds.map(id => ({ id })),
        properties: [
          'slot_name', 'start_date', 'end_date', 'status',
          'product_name', 'total_amount', 'duration_days'
        ]
      }
    );
    
    sendResponse({
      status: 'SUCCESS',
      body: {
        slots: slotsResponse.results.map(s => ({
          id: s.id,
          ...s.properties
        })),
        company: company.properties
      }
    });
  } catch (error) {
    console.error('Error fetching slots for company:', error);
    sendResponse({
      status: 'ERROR',
      body: { message: error.message }
    });
  }
};

/**
 * Create a new booking (product slot)
 */
exports.createBooking = async (context, sendResponse) => {
  const client = getHubSpotClient(context);
  const {
    dealId,
    productId,
    productName,
    productPrice,
    startDate,
    endDate,
    notes,
    contactIds = [],
    companyIds = []
  } = context.parameters;
  
  try {
    // Calculate duration and total
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end - start;
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;
    const dailyRate = parseFloat(productPrice) || 0;
    const totalAmount = dailyRate * durationDays;
    
    // Generate slot name
    const slotName = `${productName} - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
    
    // Create the product slot
    const slot = await client.crm.objects.basicApi.create(
      'product_slots',
      {
        properties: {
          slot_name: slotName,
          start_date: startDate,
          end_date: endDate,
          status: 'on_hold', // Default for new bookings
          product_name: productName,
          daily_rate: dailyRate.toString(),
          total_amount: totalAmount.toString(),
          duration_days: durationDays.toString(),
          booking_notes: notes || ''
        }
      }
    );
    
    // Create associations
    const associations = [];
    
    // Associate with Deal
    if (dealId) {
      associations.push(
        client.crm.associations.v4.basicApi.create(
          'product_slots', slot.id,
          'deals', dealId,
          [{ associationCategory: 'USER_DEFINED', associationTypeId: 1 }] // Adjust type ID as needed
        )
      );
    }
    
    // Associate with Product
    if (productId) {
      associations.push(
        client.crm.associations.v4.basicApi.create(
          'product_slots', slot.id,
          'products', productId,
          [{ associationCategory: 'USER_DEFINED', associationTypeId: 1 }]
        )
      );
    }
    
    // Associate with Contacts
    for (const contactId of contactIds) {
      associations.push(
        client.crm.associations.v4.basicApi.create(
          'product_slots', slot.id,
          'contacts', contactId,
          [{ associationCategory: 'USER_DEFINED', associationTypeId: 1 }]
        )
      );
    }
    
    // Associate with Companies
    for (const companyId of companyIds) {
      associations.push(
        client.crm.associations.v4.basicApi.create(
          'product_slots', slot.id,
          'companies', companyId,
          [{ associationCategory: 'USER_DEFINED', associationTypeId: 1 }]
        )
      );
    }
    
    // Wait for all associations
    await Promise.all(associations);
    
    sendResponse({
      status: 'SUCCESS',
      body: {
        slot: {
          id: slot.id,
          ...slot.properties
        },
        message: `Booked ${durationDays} days for ${productName}`
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    sendResponse({
      status: 'ERROR',
      body: { message: error.message }
    });
  }
};

/**
 * Update a booking's status
 */
exports.updateBookingStatus = async (context, sendResponse) => {
  const client = getHubSpotClient(context);
  const { slotId, status } = context.parameters;
  
  try {
    const updated = await client.crm.objects.basicApi.update(
      'product_slots',
      slotId,
      { properties: { status } }
    );
    
    sendResponse({
      status: 'SUCCESS',
      body: {
        slot: {
          id: updated.id,
          ...updated.properties
        }
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    sendResponse({
      status: 'ERROR',
      body: { message: error.message }
    });
  }
};

/**
 * Get all product slots for the calendar grid view
 */
exports.getAllSlots = async (context, sendResponse) => {
  const client = getHubSpotClient(context);
  const { startDate, endDate } = context.parameters;
  
  try {
    // Fetch all products
    const productsResponse = await client.crm.objects.basicApi.getPage(
      'products',
      100,
      undefined,
      ['name', 'price', 'hs_sku']
    );
    
    // Fetch all product slots
    // In production, you'd want to filter by date range
    const slotsResponse = await client.crm.objects.basicApi.getPage(
      'product_slots',
      500,
      undefined,
      [
        'slot_name', 'start_date', 'end_date', 'status',
        'product_name', 'total_amount', 'duration_days'
      ]
    );
    
    // Get associations for each slot to know which product it belongs to
    const slotsWithProducts = await Promise.all(
      slotsResponse.results.map(async (slot) => {
        try {
          const assoc = await client.crm.associations.v4.basicApi.getPage(
            'product_slots', slot.id,
            'products',
            undefined, 100
          );
          return {
            ...slot,
            productId: assoc.results?.[0]?.toObjectId
          };
        } catch {
          return { ...slot, productId: null };
        }
      })
    );
    
    sendResponse({
      status: 'SUCCESS',
      body: {
        products: productsResponse.results.map(p => ({
          id: p.id,
          name: p.properties.name,
          price: p.properties.price
        })),
        slots: slotsWithProducts.map(s => ({
          id: s.id,
          productId: s.productId,
          ...s.properties
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching all slots:', error);
    sendResponse({
      status: 'ERROR',
      body: { message: error.message }
    });
  }
};

/**
 * Check slot availability for a product in a date range
 */
exports.checkAvailability = async (context, sendResponse) => {
  const client = getHubSpotClient(context);
  const { productId, startDate, endDate } = context.parameters;
  
  try {
    // Get all slots for this product
    const searchResponse = await client.crm.objects.searchApi.doSearch(
      'product_slots',
      {
        filterGroups: [{
          filters: [{
            propertyName: 'product_name',
            operator: 'HAS_PROPERTY'
          }]
        }],
        properties: ['start_date', 'end_date', 'status', 'product_name'],
        limit: 100
      }
    );
    
    // Check for conflicts
    const requestedStart = new Date(startDate);
    const requestedEnd = new Date(endDate);
    
    const conflicts = searchResponse.results.filter(slot => {
      const slotStart = new Date(slot.properties.start_date);
      const slotEnd = new Date(slot.properties.end_date);
      
      // Check if dates overlap
      const overlaps = requestedStart <= slotEnd && requestedEnd >= slotStart;
      
      // Only consider non-available slots as conflicts
      const isBlocking = ['on_hold', 'sold', 'configuration'].includes(slot.properties.status);
      
      return overlaps && isBlocking;
    });
    
    sendResponse({
      status: 'SUCCESS',
      body: {
        available: conflicts.length === 0,
        conflicts: conflicts.map(c => ({
          id: c.id,
          startDate: c.properties.start_date,
          endDate: c.properties.end_date,
          status: c.properties.status
        }))
      }
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    sendResponse({
      status: 'ERROR',
      body: { message: error.message }
    });
  }
};
