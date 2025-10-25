# Calendar Sales - HubSpot App

A HubSpot marketplace app for managing calendar-based product bookings and inventory sales.

## Overview

Calendar Sales enables businesses to sell products with date-based availability directly within HubSpot. Perfect for:
- Studio/space rentals
- Advertising slot sales
- Camping spot reservations
- Equipment rentals
- Any product sold by day/date

## Features

### MVP (Version 1.0)
- **Product Slots Management**: Custom object for tracking product bookings across dates
- **Grid View Interface**: Visual calendar showing 50-day rolling availability
- **Deal Integration**: "Book Slots" button on Deal records
- **Automatic Status Sync**: Deal stages automatically update Product Slot status
- **CRM Cards**: View bookings on Contact, Company, and Deal records
- **Multi-day Bookings**: Single booking can span multiple consecutive days
- **Filtering**: Filter by product, date range, status, and owner

### Product Slot Statuses
- **Available**: Empty cells in grid (no record exists)
- **On Hold**: Inquiry received, not yet sold
- **Sold**: Deal closed, booking confirmed
- **Configuration**: Work in progress for the booking
- **Delivered**: Booking date has passed, service delivered

### Deal-to-Slot Status Mapping
| Deal Stage | Product Slot Status |
|------------|-------------------|
| Appointment Scheduled | On Hold |
| Contract Sent | On Hold |
| Closed Won | Sold |
| In Progress | Configuration |
| Completed | Delivered |

## Architecture

### App Objects
- **Product Slots** - Custom object tracking date-based product bookings
  - Start Date
  - End Date
  - Product (association)
  - Deal (association)
  - Contact (association)
  - Company (association)
  - Status
  - Owner

### UI Extensions
- **Grid View** (Custom Page) - 50-day scrollable calendar view
  - Rows: Products
  - Columns: Dates
  - Cells: Spanning multi-day bookings with color-coded status
- **Deal CRM Card** - "Book Slots" button and booking management
- **Contact/Company CRM Cards** - View customer's bookings

### Automation
- Deal stage changes trigger Product Slot status updates via workflow

## Requirements

### For Customers Installing the App
- HubSpot Sales Hub (any tier)
- Enterprise account (required for custom objects)

### For Development
- HubSpot Developer Account
- HubSpot CLI v7.8.0+
- Node.js v22+
- GitHub account

## Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/[YOUR-ORG]/calendar-sales.git
cd calendar-sales
```

### 2. Install HubSpot CLI
```bash
npm install -g @hubspot/cli
```

### 3. Authenticate with HubSpot
```bash
hs auth
# Follow prompts to connect to your developer account
```

### 4. Upload Project to HubSpot
```bash
hs project upload
```

### 5. Enable Local Development
```bash
hs project dev
# Opens local development server with hot reload
```

## Project Structure

```
calendar-sales/
├── hsproject.json              # HubSpot project configuration
├── src/
│   └── app/
│       ├── extensions/         # UI Extensions (React components)
│       │   ├── GridView.jsx    # Main calendar grid view
│       │   ├── DealCard.jsx    # Deal CRM card with booking button
│       │   ├── ContactCard.jsx # Contact bookings view
│       │   └── CompanyCard.jsx # Company bookings view
│       ├── app.functions/      # Serverless functions
│       │   └── booking-api.js  # API for creating/updating slots
│       └── app-hsmeta.json     # App metadata and configuration
└── README.md
```

## Deployment

### Development
```bash
hs project watch
# Automatically uploads changes on file save
```

### Production
```bash
hs project upload
# Creates new build for testing
```

### Marketplace Submission
- Requires 3 active customer installs
- Must meet HubSpot App Marketplace listing requirements
- Apply for App Objects access via HubSpot developer portal

## Roadmap

### Version 1.0 (MVP) - Current
- ✅ Product Slots object
- ✅ Grid view interface
- ✅ Deal integration
- ✅ Basic CRM cards
- ✅ Status automation

### Version 2.0 (Future)
- Recurring bookings
- Projects object integration (work tracking)
- Self-service customer portal
- External calendar sync (Google, Outlook)
- Payment integration (Stripe, PayPal)
- Advanced analytics dashboard
- Partial day bookings (AM/PM)
- Capacity management for shared resources

## Support

For issues, feature requests, or questions:
- GitHub Issues: [Repository URL]
- Email: [Support email]
- Documentation: [Docs URL]

## License

[Choose license - MIT, Apache 2.0, etc.]

## Contributing

[Contribution guidelines if applicable]

---

Built with ❤️ for the HubSpot community
