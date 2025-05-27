# Storage Usage Feature Testing Guide

## Overview
This guide outlines how to test the new storage usage monitoring feature in the network admin panel.

## Features Implemented

### 1. Storage Usage Display in Network Info Panel
- **Location**: Network Admin Page > Network Settings Tab > Network Information Panel
- **Shows**:
  - Current storage usage (in MB/GB/TB)
  - Storage limit based on subscription plan
  - Progress bar showing percentage used
  - Current subscription plan badge
  - Warning alerts at 90% usage
  - Error alert and upgrade prompt at 100% usage

### 2. Storage Limits by Plan
- **Family**: 2GB
- **Community**: 10GB
- **Non-Profit**: 50GB
- **Organization**: 100GB
- **Network**: 1TB
- **Business**: 5TB
- **Enterprise**: Unlimited

### 3. MediaUpload Component Integration
- **Prevents uploads when storage limit is reached**
- **Shows storage warnings when near limit (90%+)**
- **Displays remaining storage space**
- **Validates file size against remaining storage before upload**

## API Functions Added

### In `src/api/networks.jsx`:
- `getStorageLimit(plan)` - Returns storage limit in MB for a given plan
- `calculateNetworkStorage(networkId)` - Calculates total storage used by a network
- `getNetworkStorageInfo(networkId)` - Returns complete storage info including usage, limit, and percentage

## Components Modified

### 1. NetworkInfoPanel (`src/components/admin/NetworkInfoPanel.jsx`)
- Added storage usage section with progress bar
- Shows alerts when storage is near or at capacity
- Includes upgrade buttons that navigate to pricing page

### 2. MediaUpload (`src/components/MediaUpload.jsx`)
- Added storage checking before file upload
- Shows warnings when near storage limit
- Prevents uploads when storage limit is reached
- Displays remaining storage space

## Testing Steps

### 1. Test Storage Display
1. Navigate to Network Admin Page
2. Check Network Information panel for storage usage section
3. Verify:
   - Storage usage is displayed correctly
   - Progress bar shows correct percentage
   - Plan name is shown correctly

### 2. Test Storage Warnings
1. If network is using >90% of storage:
   - Yellow warning alert should appear
   - "View Plans" button should be visible
2. If network is at 100% storage:
   - Red error alert should appear
   - "Upgrade" button should be visible
   - Clicking upgrade should navigate to pricing page

### 3. Test Upload Restrictions
1. Go to any page with MediaUpload component (News, Chat, etc.)
2. If storage is at 100%:
   - Upload button should be disabled
   - Error message should appear
3. Try uploading a file larger than remaining storage:
   - Should show error about insufficient space

### 4. Test Different Plans
1. Check networks with different subscription plans
2. Verify correct storage limits are shown:
   - Free/Family: 2GB
   - Community: 10GB
   - Organization: 100GB
   - etc.

## Storage Calculation Method

The system calculates storage by counting:
1. **network_files**: Actual file sizes from database
2. **Portfolio media**: ~2MB per item
3. **Profile pictures**: ~500KB per profile
4. **News media**: ~1.5MB per item
5. **Chat media**: ~2MB per message
6. **Wiki pages**: ~100KB per page (embedded content)
7. **Moodboard items**: ~1MB per image
8. **Network assets**: ~5MB (logo + background)

## Known Limitations

1. Storage calculation is an estimate for media files without explicit sizes
2. Direct message media is not included in the calculation
3. Storage updates may have a slight delay after uploads/deletions

## Troubleshooting

### Storage not updating:
- Check browser console for errors
- Verify network ID is correct
- Check if `getNetworkStorageInfo` API call is successful

### Upload still working at 100%:
- Clear browser cache
- Check if MediaUpload component has latest changes
- Verify `storageInfo.isAtLimit` is true

### Wrong storage limit shown:
- Check network's `subscription_plan` in database
- Verify plan name matches those in `STORAGE_LIMITS` constant