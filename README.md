# Shopify Printful Custom Codes

A Shopify customization solution integrating Printful's Embedded Design Maker (EDM) for custom product design and personalization.

## Project Structure

```
├── customize-btn.html              # Basic customization modal interface
├── printful-catalog.liquid         # Product catalog section for Shopify themes
├── printful-designer.liquid        # EDM integration section for Shopify themes
├── printful-edm-integration.js     # Core EDM integration class
└── README.md                       # This file
```

## Setup Instructions

### Prerequisites

- Shopify store with theme customization access
- Printful API access
- Backend API endpoint running at `https://customizer-app-backend.vercel.app` (can be changed base on what is the URL of the backend)

### Installation

1. **Upload JavaScript Assets**
   - Upload `printful-edm-integration.js` to your theme's `assets` folder

2. **Add Liquid Sections**
   - Upload `printful-catalog.liquid` and `printful-designer.liquid` to your theme's `sections` folder

3. **Configure Pages**
   - Create a "Product Catalog" page in Shopify Admin
   - Create a "Customize Product" page in Shopify Admin
   - Add the respective sections to each page using the theme customizer

4. **API Configuration**
   - Ensure your backend API is accessible at `https://customizer-app-backend.vercel.app` 
   - Configure Printful API credentials in your backend

### Page URLs Expected

- Product catalog: `/pages/product-catalog`
- Product customization: `/pages/customize-product?id={productId}`

## EDM Session Handling

### Authentication Flow

The EDM integration uses a nonce-based authentication system:

1. **Nonce Request**: When initializing EDM, the system requests an authentication nonce from the backend
   ```javascript
   const auth = await this.getAuthNonce();
   ```

2. **Backend Endpoint**: `POST /api/printful/embedded-designer/nonces`
   - Sends `external_product_id` in request body
   - Returns nonce object for EDM authentication

3. **EDM Initialization**: The nonce is used to authenticate with Printful's EDM service
   ```javascript
   new window.PFDesignMaker({
     nonce: auth.result.nonce.nonce,
     external_product_id: this.prodID,
     ...options
   });
   ```

### Session Management

- **Product Selection**: Selected products are stored in `sessionStorage` for navigation between catalog and designer
- **User Data**: User information (name, email) is stored in `localStorage` for design attribution
- **Design Persistence**: Saved designs are associated with user data and product IDs

### Error Handling

- Connection failures show user-friendly error messages
- Automatic retry mechanisms for API calls
- Loading states during EDM initialization

## Printful API Integration

### Core Endpoints Used

1. **Catalog Products**: `/v2/catalog-products`
   - Fetches available products for customization
   - Supports pagination with `limit` and `offset` parameters
   - Returns product metadata, images, and variant information

2. **EDM Nonces**: `/embedded-designer/nonces`
   - Generates authentication tokens for EDM sessions
   - Required for secure EDM initialization

3. **Template Storage**: `/api/shopify/template`
   - Saves completed designs with user attribution
   - Associates templates with specific products and users

### API Request Flow

```
User → Catalog Page → Product Selection → EDM Initialization → Design Creation → Template Save
     ↓                    ↓                    ↓                     ↓               ↓
  Fetch Products    Store Selection    Request Nonce        Use EDM API    Save to Backend
```

### Authentication

- API requests are made through the backend proxy to handle Printful API authentication
- No direct Printful API keys exposed in frontend code
- Backend handles rate limiting and error responses

### Product Data Structure

Products from the catalog API include:
- `id`: Unique product identifier
- `name`: Product display name  
- `image`: Main product image URL
- `description`: Product description
- `brand`: Manufacturer brand
- `model`: Product model/type
- `variant_count`: Number of available variants
- `techniques`: Available customization methods

### Error Handling

- Network failures gracefully degrade with retry options
- Invalid product IDs show appropriate error messages

## Features

### Product Catalog
- Grid view of available Printful products
- Pagination support for large catalogs
- Product filtering and search
- Modal product details with variant information

### Design Customization
- Full Printful EDM integration
- Real-time design preview
- Multiple design techniques support
- Live pricing integration
- Template saving functionality

### User Management
- User data collection modal
- Design attribution to users
- Session-based workflow

## Development Notes

- All API calls are proxied through the backend for security
- Frontend uses vanilla JavaScript (no framework dependencies)
- Liquid templates are customizable through Shopify theme settings