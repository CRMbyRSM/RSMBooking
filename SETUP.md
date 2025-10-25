# Calendar Sales - Setup Guide

Complete setup instructions for deploying the Calendar Sales HubSpot app.

## Prerequisites

1. **HubSpot Developer Account**
   - Create at: https://developers.hubspot.com/
   - Note your Account ID (found in Account Settings)

2. **Required Software**
   - Node.js v18+ ([Download](https://nodejs.org/))
   - Git ([Download](https://git-scm.com/))
   - HubSpot CLI v7.8.0+

3. **HubSpot Requirements**
   - Sales Hub (any tier) for customers
   - Enterprise account required (for custom objects)

---

## Step 1: Clone Repository

```bash
git clone https://github.com/[YOUR-ORG]/calendar-sales.git
cd calendar-sales
```

---

## Step 2: Install HubSpot CLI

```bash
npm install -g @hubspot/cli
```

Verify installation:
```bash
hs --version
# Should show 7.8.0 or higher
```

---

## Step 3: Authenticate with HubSpot

```bash
hs auth
```

Follow the prompts:
1. Select "OAuth" or "Personal Access Key" authentication
2. Enter your HubSpot developer account ID
3. Complete browser authentication flow
4. Confirm connection successful

Verify:
```bash
hs account list
# Should show your authenticated account
```

---

## Step 4: Apply for App Objects Access

**IMPORTANT:** App Objects require HubSpot approval before you can use them.

1. Visit HubSpot Developer Portal
2. Navigate to your app settings
3. Find "App Objects" section
4. Submit application for access
5. Wait for HubSpot approval (typically 1-3 business days)

---

## Step 5: Upload Project to HubSpot

```bash
hs project upload
```

This will:
- Package your project
- Upload to HubSpot
- Create a new build
- Deploy the Product Slots object
- Register UI extensions

Check build status:
```bash
hs project builds list
```

Or visit: https://app.hubspot.com/developer/{ACCOUNT_ID}/projects

---

## Step 6: Test in Development Account

1. **Create Products**
   - Go to Sales > Products in HubSpot
   - Create sample products with pricing
   - Add custom properties: `product_type`, `product_team`, `product_size`

2. **Access Calendar Grid**
   - In HubSpot navigation, find "Calendar Sales Grid"
   - Should show your products as rows
   - Empty cells = available dates

3. **Test Booking Flow**
   - Create a test Deal
   - Go to Deal record
   - Find "Product Bookings" card in right sidebar
   - Click "Book Slots"
   - Fill form and create booking
   - Verify slot appears in calendar grid

4. **Check CRM Cards**
   - Open Contact record → see "Bookings" card
   - Open Company record → see "Company Bookings" card
   - Verify bookings display correctly

---

## Step 7: Enable Local Development (Optional)

For rapid development with hot reload:

```bash
hs project dev
```

This starts a local development server. Changes to `.jsx` files will reflect immediately in HubSpot without re-uploading.

---

## Step 8: Set Up Deal Stage Automation

To automatically sync Deal stages to Product Slot statuses:

1. Go to Automation > Workflows in HubSpot
2. Create workflow: "Update Product Slot Status from Deal"
3. Trigger: Deal stage changes
4. Actions:
   - If stage = "Appointment Scheduled" → Update associated Product Slot status to "On Hold"
   - If stage = "Closed Won" → Update to "Sold"
   - If stage = "In Progress" → Update to "Configuration"
   - If stage = "Completed" → Update to "Delivered"

---

## Step 9: Prepare for Marketplace Submission

Before submitting to HubSpot App Marketplace:

### Requirements Checklist

- [ ] 3 active customer installs (test accounts don't count)
- [ ] App Objects access approved by HubSpot
- [ ] App icon (512x512px PNG)
- [ ] App listing description
- [ ] Screenshots (at least 3)
- [ ] Setup documentation (public URL)
- [ ] Support email address
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Pricing model defined (free or paid)

### Submission Process

1. Go to Developer Portal
2. Navigate to your app
3. Click "Submit for Review"
4. Fill out marketplace listing form
5. Upload assets (icon, screenshots)
6. Submit for HubSpot review

Review typically takes 5-10 business days.

---

## Troubleshooting

### "App Objects not available"
- Ensure you've applied for App Objects access
- Check approval status in Developer Portal
- Contact HubSpot support if pending > 5 days

### "Failed to upload project"
- Verify `hs auth` is successful
- Check `hsproject.json` is valid JSON
- Ensure you have write permissions on account

### "UI Extensions not appearing"
- Clear browser cache
- Wait 2-3 minutes after upload (propagation delay)
- Check build logs: `hs project builds list`

### "Product Slots object not created"
- Verify App Objects access approved
- Check `src/app/objects/product_slots.json` exists
- Review build logs for errors

### "Associations not working"
- Ensure object type IDs are correct:
  - Contacts: `0-1`
  - Companies: `0-2`
  - Deals: `0-3`
  - Products: `0-7`
- Check association definitions in `product_slots.json`

---

## Development Workflow

### Making Changes

1. Edit files locally
2. Test with `hs project dev` (hot reload)
3. Or upload: `hs project upload`
4. Test in HubSpot
5. Commit to Git

### Watch Mode (Recommended)

```bash
hs project watch
```

Automatically uploads on file save.

### Deployment

```bash
# Development/testing
hs project upload

# After testing, commit to Git
git add .
git commit -m "Description of changes"
git push origin main
```

---

## Production Deployment

Once approved for marketplace:

1. **Version Bumping**
   - Update `version` in `package.json`
   - Update `version` in `src/app/app-hsmeta.json`
   - Commit changes

2. **Upload Production Build**
   ```bash
   hs project upload
   ```

3. **Create Release Notes**
   - Document new features
   - List bug fixes
   - Note breaking changes

4. **Monitor Installs**
   - Track install count in Developer Portal
   - Monitor support requests
   - Gather user feedback

---

## Support & Resources

- **Documentation**: [Your docs URL]
- **GitHub Issues**: [Repository URL]/issues
- **Support Email**: [Your support email]
- **HubSpot Developer Docs**: https://developers.hubspot.com/docs
- **HubSpot Community**: https://community.hubspot.com/

---

## Next Steps

After setup:
1. ✅ Test all features with real data
2. ✅ Get 3 customers to install (for marketplace submission)
3. ✅ Gather user feedback
4. ✅ Iterate based on feedback
5. ✅ Submit to marketplace

---

## Roadmap

See [README.md](./README.md) for planned features in Version 2.0.

---

Built with ❤️ for the HubSpot community
