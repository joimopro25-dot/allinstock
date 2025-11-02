# Stock Locations 360° View - Complete Inventory Control

## Overview

The Stock Locations feature provides a comprehensive 360° view of your entire inventory across multiple physical locations. This allows you to track exactly where every product is located, whether it's in warehouses, vans, offices, or workplaces.

## Features Implemented

### 1. **Google Maps Integration**
- **Visual Location Mapping**: See all your stock locations plotted on an interactive Google Maps interface
- **Custom Markers**: Different colors for different location types (warehouses, vans, offices)
- **Info Windows**: Click on markers to see location details and stock information
- **Dark Theme**: Custom map styling that matches the app's futuristic dark theme

### 2. **Multiple Location Types**
- **Warehouses** (`warehouse`) - Primary storage facilities
- **Vans** (`van`) - Mobile inventory (Van1, Van2, etc.)
- **Offices** (`office`) - Office storage
- **Workplaces** (`workplace`) - Active job sites

### 3. **Comprehensive Location Management**
- **Create Locations**: Add new storage locations with address and GPS coordinates
- **Edit Locations**: Update location details, contact information, and coordinates
- **Delete Locations**: Remove obsolete locations (with warnings if stock exists)
- **Filter & Search**: Quickly find locations by name, address, or type

### 4. **360° Stock View Dashboard**
- **Total Locations**: See how many storage locations you have
- **Total Products**: Track total product count across all locations
- **Total Stock Value**: Calculate combined value of all inventory
- **Per-Location Analytics**:
  - Number of products at each location
  - Total value of stock at each location
  - List of products stored at each location

### 5. **Location Details**
Each location can store:
- **Name**: Location identifier (e.g., "Central Warehouse", "Van 1")
- **Type**: Category (warehouse, van, office, workplace)
- **Address**: Full street address
- **GPS Coordinates**: Latitude/Longitude for map display
- **Contact Person**: Who manages this location
- **Contact Phone**: Phone number for location manager
- **Notes**: Additional information

## Files Created

### Main Components
1. **[src/pages/stockLocations/StockLocations.jsx](src/pages/stockLocations/StockLocations.jsx)**
   - Main page component with Google Maps integration
   - Location management (CRUD operations)
   - Stock analytics and filtering
   - Responsive design with sidebar

2. **[src/pages/stockLocations/StockLocations.css](src/pages/stockLocations/StockLocations.css)**
   - Futuristic dark theme styling
   - Glassmorphism effects
   - Responsive grid layouts
   - Map container styling
   - Modal and form styling

### Configuration
3. **[.env.example](.env.example)**
   - Google Maps API key configuration
   - Firebase configuration template
   - Google Calendar OAuth template

4. **[STOCK_LOCATIONS_360.md](STOCK_LOCATIONS_360.md)** (this file)
   - Complete feature documentation

### Routes & Navigation
5. **[src/App.jsx](src/App.jsx#L143-L150)** - Added `/stock-locations` route
6. **[src/components/common/Sidebar.jsx](src/components/common/Sidebar.jsx#L43-L48)** - Added sidebar navigation

## Google Maps Setup

### 1. Get API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Maps JavaScript API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### 2. Configure Environment
Create a `.env` file in the project root:
```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Secure Your API Key (Recommended)
In Google Cloud Console:
- **Application restrictions**: HTTP referrers
- Add your domain: `localhost:5174/*` (development)
- Add production domain when deployed
- **API restrictions**: Restrict to Maps JavaScript API only

## Usage

### Accessing Stock Locations
1. Navigate to **Sidebar** → **Stock Locations** (📍 icon)
2. Or go directly to `/stock-locations`

### Creating a Location
1. Click **"New Location"** button
2. Fill in the form:
   - **Name**: Required (e.g., "Main Warehouse")
   - **Type**: Select from dropdown
   - **Address**: Full address
   - **Latitude/Longitude**: GPS coordinates for map display
   - **Contact Person**: Optional
   - **Contact Phone**: Optional
   - **Notes**: Optional additional info
3. Click **"Save"**

### Finding GPS Coordinates
1. Open [Google Maps](https://maps.google.com)
2. Right-click on your location
3. Click on the coordinates to copy them
4. Paste into Latitude/Longitude fields

Example:
- Latitude: `38.7223`
- Longitude: `-9.1393`

### Viewing on Map
- Locations with GPS coordinates appear as colored markers
- **Green**: Warehouses
- **Orange**: Vans
- **Purple**: Offices/Workplaces
- Click markers to see location details

### Filtering Locations
- **Search Bar**: Filter by name or address
- **Type Buttons**: Filter by location type
  - All
  - Warehouses
  - Vans
  - Offices

### Editing a Location
1. Click the **Edit** (✏️) button on a location card
2. Modify the desired fields
3. Click **"Save"**

### Deleting a Location
1. Click the **Delete** (🗑️) button
2. Confirm deletion in the modal
3. **Warning**: If stock exists at this location, you'll be notified

## Integration with Stock Management

### Linking Products to Locations
The Stock Locations feature integrates with the existing product management system:

1. In **Stock Management** (`/stock`), each product can have multiple stock locations
2. Click on a product's **"Stock Locations"** button
3. Add/edit/delete stock at specific locations
4. The 360° view aggregates all this data

### Data Structure
```javascript
// Location Document
{
  id: "location123",
  name: "Central Warehouse",
  type: "warehouse",
  address: "123 Main St, Lisbon",
  latitude: 38.7223,
  longitude: -9.1393,
  contactPerson: "João Silva",
  contactPhone: "+351 912 345 678",
  notes: "24/7 access",
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Product Stock Location
{
  productId: "product456",
  locations: [
    {
      locationId: "location123",
      quantity: 50,
      unit: "units"
    }
  ]
}
```

## Benefits

### 1. **Complete Visibility**
- Know exactly where every product is located
- No more searching multiple warehouses
- Track inventory in transit (vans)

### 2. **Better Planning**
- Optimize stock distribution
- Reduce transfer time between locations
- Plan deliveries based on proximity

### 3. **Accurate Reporting**
- Calculate stock value by location
- Identify overstocked/understocked locations
- Better inventory forecasting

### 4. **Mobile Workforce**
- Van inventory tracking
- Technicians know which van has needed parts
- Reduce duplicate stock purchases

### 5. **Scalability**
- Add unlimited locations
- Perfect for multi-warehouse operations
- Supports business growth

## Technical Details

### Dependencies
```json
{
  "@react-google-maps/api": "^2.19.3",
  "firebase": "^10.x",
  "react": "^19.1.1",
  "react-router-dom": "^6.x"
}
```

### Firestore Collections
- `companies/{companyId}/stockLocations` - Location documents
- `companies/{companyId}/products` - Product documents with stock locations

### Performance
- **Lazy Loading**: Google Maps API loaded only on Stock Locations page
- **Optimized Queries**: Parallel loading of locations and products
- **Caching**: Map tiles cached by Google Maps
- **Responsive**: Works on desktop, tablet, and mobile

### Security
- **Protected Routes**: Requires authentication
- **Company Isolation**: Each company sees only their locations
- **Firestore Rules**: Enforce company-level data access

## Future Enhancements

### Potential Features
1. **Stock Transfer Functionality**
   - Move stock between locations
   - Transfer history tracking
   - Approval workflows

2. **Low Stock Alerts by Location**
   - Get notified when a specific location is low on stock
   - Automated reorder suggestions

3. **Route Optimization**
   - Calculate best routes between locations
   - Delivery planning

4. **Barcode Scanning**
   - Scan products during location transfers
   - Real-time location updates

5. **Location Analytics**
   - Stock turnover by location
   - Most/least active locations
   - Cost analysis per location

6. **Integration with Deliveries**
   - Assign delivery addresses to closest warehouse
   - Calculate shipping from optimal location

## Troubleshooting

### Map Not Showing
1. **Check API Key**: Ensure `VITE_GOOGLE_MAPS_API_KEY` is set in `.env`
2. **Restart Dev Server**: After adding `.env`, restart with `npm run dev`
3. **Check Browser Console**: Look for Google Maps API errors
4. **Verify API Enabled**: Ensure Maps JavaScript API is enabled in Google Cloud

### Markers Not Appearing
1. **Check Coordinates**: Ensure latitude/longitude are valid numbers
2. **Zoom Level**: Try adjusting map zoom
3. **Filter Active**: Disable type filters to see all locations

### Location Not Saving
1. **Required Fields**: Name is required
2. **Permissions**: Check Firestore security rules
3. **Network**: Verify internet connection

## Support

For issues or feature requests:
1. Check this documentation
2. Review the code comments in source files
3. Contact the development team

---

**Status**: ✅ Complete and Production Ready

The Stock Locations 360° View provides professional-grade inventory management with visual mapping and complete location control!
