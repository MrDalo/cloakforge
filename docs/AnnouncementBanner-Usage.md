# AnnouncementBanner Component Usage Guide

## 🎯 Overview

The AnnouncementBanner component displays site-wide announcements managed through Contentful CMS. It appears as a floating banner at the top of the page and can be dismissed by users.

## 🏗️ Features

### ✅ **Smart Display Logic**

- **Page Targeting**: Show on specific pages or all pages
- **Date Range**: Auto-show/hide based on start/end dates
- **User Dismissal**: Users can close banners (stored in localStorage)
- **Type-based Styling**: Different colors for info, warning, and maintenance

### 🎨 **Visual Types**

- **Info** (Blue): General announcements, new features
- **Warning** (Amber): Important notices, upcoming changes
- **Maintenance** (Red): Downtime notifications, critical alerts

### 🔧 **Contentful Configuration**

#### Required Fields in Contentful `siteBanner` Content Type:

```
- isActive: Boolean (required)
- type: Choice ('info', 'warning', 'maintenance')
- title: Short Text (required)
- message: Short Text (required)
- showOnPages: Short Text, list (required)
- startDate: Date and time (optional)
- endDate: Date and time (optional)
```

#### Example Contentful Entry:

```
Title: "New Token Auditor Tool Released!"
Type: "info"
Message: "Discover security vulnerabilities in your Solana tokens with our new auditing tool."
Show On Pages: ["all"] or ["token-creator", "burn-tokens"]
Start Date: 2025-01-25T00:00:00
End Date: 2025-02-01T00:00:00
Is Active: true
```

## 📱 **Usage Examples**

### Basic Integration (Already added to layout.tsx):

```tsx
import { AnnouncementBanner } from '@/components/common/AnnouncementBanner'

// In your layout or page
;<AnnouncementBanner currentPage='token-creator' />
```

### Page-Specific Usage:

```tsx
// Show only on blog pages
<AnnouncementBanner currentPage="blog" />

// Show on all pages (default)
<AnnouncementBanner />
```

## 🎭 **Animation Features**

- **Smooth entrance**: Slides down from top with opacity fade
- **Smooth exit**: Slides up and fades out when dismissed
- **Backdrop blur**: Modern glassmorphism effect
- **Responsive design**: Works on all device sizes

## 💾 **Local Storage**

The component automatically tracks dismissed banners in localStorage:

```javascript
// Storage key: 'dismissedBanners'
// Format: Array of banner IDs
;['New Feature Announcement-2025-01-25', 'Maintenance Notice-2025-01-26']
```

## 🔧 **Customization**

### Custom Page Targeting:

```tsx
// For specific tools
<AnnouncementBanner currentPage="token-creator" />
<AnnouncementBanner currentPage="burn-tokens" />

// For page groups
<AnnouncementBanner currentPage="account" />  // Shows on all /account/* pages
```

### Contentful showOnPages Examples:

- `["all"]` - Show on every page
- `["blog", "token-creator"]` - Show only on blog and token creator pages
- `["account"]` - Show on account page and all subpages

## 🚀 **Ready to Use!**

The banner is now integrated into your layout and will automatically:

1. Fetch active banners from Contentful via API route
2. Check if they should display on the current page
3. Respect user dismissals and date ranges
4. Display with smooth animations
5. Allow users to dismiss them

## 🏗️ Technical Architecture

The AnnouncementBanner system consists of:

1. **API Route**: `/api/site-banner` - Server-side endpoint that fetches data from Contentful
2. **Client Component**: `AnnouncementBanner` - Fetches from API route and handles UI
3. **Contentful Integration**: Uses the `SiteBanner` content type for banner configuration
4. **Local Storage**: Tracks user dismissals to prevent showing dismissed banners
5. **Environment Separation**: Contentful credentials stay server-side for security

This architecture ensures that sensitive Contentful credentials are never exposed to the client-side.

Just create a banner in Contentful and it will appear on your site! 🎉
