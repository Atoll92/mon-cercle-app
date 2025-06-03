# API Documentation

This document describes the API layer functions and services in the Conclav application.

## API Layer (`src/api/`)

### auth.jsx
Authentication-related functions for user management.

**Key Functions:**
- User registration and login
- Password reset and update
- Session management
- Profile creation and updates

### networks.jsx
Network CRUD operations and management.

**Key Functions:**
- Network creation and configuration
- Member management (add, remove, update roles)
- Event management
- News/posts management
- Moderation actions
- Storage tracking and limits
- Network statistics

### directMessages.js
Direct messaging API with dark mode support.

**Key Functions:**
- Conversation creation and management
- Message sending with media support
- Read receipts
- Real-time message updates
- Conversation listing with unread counts

### moodboards.jsx
Moodboard operations for visual content management.

**Key Functions:**
- Moodboard creation (personal/collaborative)
- Item manipulation (add, update, delete, reorder)
- Sharing and permissions
- Canvas state management

### polls.js
Polling system with multiple question types.

**Key Functions:**
- Poll creation with various types (multiple choice, yes/no, date picker)
- Vote submission and tracking
- Anonymous voting support
- Poll statistics and results
- Real-time vote updates

### invitations.js
Enhanced invitation management system.

**Key Functions:**
- Email invitation sending (single and batch)
- Invitation link generation with QR codes
- Role assignment for invitations
- Invitation acceptance flow
- Usage tracking and expiration

### superAdmin.js
Admin dashboard API for system-wide management.

**Key Functions:**
- Network analytics and monitoring
- User management across networks
- System health metrics
- Subscription management
- Support ticket oversight

### comments.js
Social wall comments system with threading.

**Key Functions:**
- Comment creation with nested replies
- Comment fetching with pagination
- Moderation (hide/show comments)
- Real-time comment updates

### tickets.js
Support ticket system for help desk functionality.

**Key Functions:**
- Ticket creation with categorization
- Ticket updates and status changes
- Message threading
- Internal notes (super admin only)
- Ticket assignment and priority

### badges.js
Engagement badges system for user recognition.

**Key Functions:**
- Badge creation and configuration
- Automatic badge awarding based on criteria
- Manual badge assignment
- User activity statistics
- Badge removal

### categories.js
Category management for content organization.

**Key Functions:**
- Category CRUD operations
- Category assignment to content
- Hierarchical category support

## Services Layer (`src/services/`)

### emailNotificationService.js
Queue-based email notification system.

**Key Features:**
- Notification preference checking
- Template-based email generation
- Retry mechanism for failed sends
- Batch processing
- Queue monitoring

### networkFiles.js
File management and storage operations.

**Key Features:**
- File upload with validation
- Storage quota enforcement
- File type restrictions
- Download tracking
- Batch operations

### opengraphService.js
Enhanced URL preview generation.

**Key Features:**
- Multiple proxy support with fallbacks
- Meta tag extraction (OpenGraph, Twitter cards)
- Image URL resolution
- Smart caching with placeholder detection
- Favicon detection with Google service fallback

### stripeService.js
Payment processing integration.

**Key Features:**
- Checkout session creation
- Subscription management
- Payment method handling
- Invoice generation
- Webhook processing

### subscriptionService.js
Subscription lifecycle management.

**Key Features:**
- Plan comparison and limits
- Trial period management
- Usage tracking
- Upgrade/downgrade flows
- Billing portal access

## Edge Functions (`supabase/functions/`)

### create-checkout-session
Creates Stripe checkout sessions for subscriptions.

**Endpoint:** POST `/functions/v1/create-checkout-session`

**Request Body:**
```json
{
  "priceId": "price_xxx",
  "networkId": "uuid",
  "successUrl": "https://...",
  "cancelUrl": "https://..."
}
```

### stripe-webhook
Processes Stripe webhook events for payment updates.

**Endpoint:** POST `/functions/v1/stripe-webhook`

**Handles:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### network-invite
Sends invitation emails to users.

**Endpoint:** POST `/functions/v1/network-invite`

**Request Body:**
```json
{
  "email": "user@example.com",
  "networkName": "Network Name",
  "inviterName": "Inviter Name",
  "inviteCode": "ABC123",
  "role": "member" | "admin"
}
```

### manage-subscription
Handles subscription management operations.

**Endpoint:** POST `/functions/v1/manage-subscription`

**Operations:**
- Cancel subscription
- Resume subscription
- Change plan
- Update payment method

### test-stripe
Testing endpoint for Stripe integration.

**Endpoint:** GET `/functions/v1/test-stripe`

## Common Patterns

### Error Handling
All API functions follow consistent error handling:
```javascript
try {
  // API logic
} catch (error) {
  console.error('Function name:', error);
  throw error;
}
```

### Authentication
Most API functions require authentication:
```javascript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated');
```

### Pagination
List operations support pagination:
```javascript
const { data, count } = await supabase
  .from('table')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1);
```

### Real-time Subscriptions
Real-time updates use Supabase channels:
```javascript
const channel = supabase
  .channel('channel-name')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'table_name' },
    (payload) => handleChange(payload)
  )
  .subscribe();
```