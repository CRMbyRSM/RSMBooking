# Deployment Checklist

Use this checklist to deploy Calendar Sales to your HubSpot developer account.

## Pre-Deployment

- [ ] HubSpot CLI installed (`npm install -g @hubspot/cli`)
- [ ] HubSpot CLI authenticated (`hs auth`)
- [ ] Developer account ID noted
- [ ] Applied for App Objects access (required, allow 1-3 days for approval)
- [ ] Approval received from HubSpot for App Objects

## Initial Setup

- [ ] Clone repository: `git clone [YOUR_REPO_URL]`
- [ ] Navigate to directory: `cd calendar-sales`
- [ ] Review `SETUP.md` for detailed instructions

## First Deployment

- [ ] Verify `hsproject.json` is present
- [ ] Upload project: `hs project upload`
- [ ] Check build status in HubSpot Developer Portal
- [ ] Verify Product Slots object created
- [ ] Verify UI extensions registered

## Testing in Development Account

### Create Test Products
- [ ] Go to Sales > Products in HubSpot
- [ ] Create 3-5 test products with these properties:
  - Name (e.g., "Studio A", "Ad Slot 1")
  - Price (daily rate, e.g., 500)
  - `product_type` (e.g., "Studio", "Advertising")
  - `product_team` (e.g., "Sales Team A")
  - `product_size` (e.g., "Large", "Standard")

### Test Calendar Grid View
- [ ] Find "Calendar Sales Grid" in HubSpot navigation
- [ ] Verify products appear as rows
- [ ] Verify 50 date columns appear
- [ ] Test "Previous 50 Days" button
- [ ] Test "Next 50 Days" button
- [ ] Test "Today" button
- [ ] Check empty cells show as available (light gray)

### Test Booking Flow
- [ ] Create test Contact
- [ ] Create test Company
- [ ] Create test Deal, associate with Contact and Company
- [ ] Open Deal record
- [ ] Find "Product Bookings" card in right sidebar
- [ ] Click "Book Slots" button
- [ ] Select a product from dropdown
- [ ] Choose start date (e.g., today)
- [ ] Choose end date (e.g., 5 days from today)
- [ ] Add notes (optional)
- [ ] Click "Create Booking"
- [ ] Verify success message appears

### Verify Booking Created
- [ ] Check Deal card shows new booking
- [ ] Verify booking appears in calendar grid
- [ ] Verify cell spans multiple days (if multi-day booking)
- [ ] Verify status shows "On Hold" (orange/yellow)
- [ ] Click on booking cell, verify details display

### Test CRM Cards
- [ ] Open Contact record → verify "Bookings" card shows booking
- [ ] Open Company record → verify "Company Bookings" card shows booking
- [ ] Verify amounts, dates, and status display correctly

### Test Deal Stage Automation (if workflow created)
- [ ] Change Deal stage to "Closed Won"
- [ ] Refresh Product Slot
- [ ] Verify status changed to "Sold" (green)
- [ ] Test other stage changes

## Advanced Testing

### Multi-Day Bookings
- [ ] Create booking spanning 10+ days
- [ ] Verify grid shows spanning cell across all dates
- [ ] Verify cell displays: status, amount, duration

### Multiple Bookings
- [ ] Create 5+ bookings for different products
- [ ] Verify calendar shows all bookings
- [ ] Check for visual overlaps (should not happen on same product)
- [ ] Test different statuses (On Hold, Sold, Configuration, Delivered)

### Filtering (if implemented)
- [ ] Test product type filter
- [ ] Test status filter
- [ ] Verify filtered results correct

### Date Navigation
- [ ] Navigate forward 200 days (4 x Next button)
- [ ] Navigate backward 200 days (4 x Previous button)
- [ ] Return to today
- [ ] Verify no errors in console

## Error Handling

- [ ] Try booking with missing product (should show error)
- [ ] Try booking with end date before start date (should show error)
- [ ] Try booking without selecting dates (should show error)
- [ ] Verify all error messages are user-friendly

## Performance Testing

- [ ] Create 20+ products
- [ ] Create 50+ bookings
- [ ] Test grid load time (should be < 3 seconds)
- [ ] Test scrolling performance
- [ ] Check browser console for errors

## Pre-Marketplace Submission

- [ ] 3 active customer installs (real customers, not test accounts)
- [ ] All test cases above passed
- [ ] No console errors during normal usage
- [ ] All CRM cards display correctly
- [ ] Calendar grid responsive and performant
- [ ] Documentation complete (README, SETUP)
- [ ] App icon created (512x512px PNG)
- [ ] Screenshots prepared (at least 3)
- [ ] Privacy policy URL ready
- [ ] Terms of service URL ready
- [ ] Support email configured
- [ ] Pricing model defined

## Marketplace Submission

- [ ] Go to HubSpot Developer Portal
- [ ] Navigate to app settings
- [ ] Click "Submit for Review"
- [ ] Upload app icon
- [ ] Upload screenshots
- [ ] Fill out app description
- [ ] Add setup documentation URL
- [ ] Add support email
- [ ] Add privacy policy URL
- [ ] Add terms of service URL
- [ ] Submit for review

## Post-Submission

- [ ] Monitor review status (5-10 business days)
- [ ] Respond to any HubSpot feedback
- [ ] Make requested changes if any
- [ ] Re-submit if needed

## Post-Approval

- [ ] App listed on HubSpot Marketplace
- [ ] Monitor install analytics
- [ ] Track support requests
- [ ] Gather user feedback
- [ ] Plan feature enhancements (see README roadmap)

---

## Troubleshooting

If any step fails, refer to `SETUP.md` Troubleshooting section or create a GitHub issue.

---

## Notes

- Allow 1-3 business days for App Objects access approval
- HubSpot review typically takes 5-10 business days
- Save this checklist and check off items as you complete them
- Keep documentation updated with any issues encountered

---

**Good luck with your deployment!** 🚀
