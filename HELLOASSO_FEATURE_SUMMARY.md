# HelloAsso Event Ticketing Integration - Feature Summary

## What Was Implemented

Added automatic HelloAsso ticketing widget integration for events. When an event has a HelloAsso URL as its event link, a ticketing widget is automatically embedded on the event page.

## Files Created/Modified

### New Files
1. **`src/utils/helloAssoEmbed.js`** - Utility functions for HelloAsso URL detection and parsing
2. **`src/components/HelloAssoWidget.jsx`** - React component that displays the HelloAsso iframe widget
3. **`docs/HELLOASSO_INTEGRATION.md`** - Complete documentation

### Modified Files
1. **`src/pages/EventPage.jsx`** - Added HelloAsso detection and widget rendering
2. **`src/locales/en.json`** - Added English translations
3. **`src/locales/fr.json`** - Added French translations

## How It Works

### For Event Organizers
1. Create/edit an event
2. Paste a HelloAsso event URL in the "Event Link" field
   - Example: `https://www.helloasso.com/associations/my-org/evenements/my-event`
3. Save the event
4. The ticketing widget automatically appears on the event page

### For Event Attendees
1. View an event with a HelloAsso link
2. See a "Buy Tickets" section below the event description
3. Purchase tickets directly through the embedded widget
4. Option to open HelloAsso in a new tab if needed

## Key Features

✅ **Automatic Detection** - Detects HelloAsso URLs automatically
✅ **No Configuration** - Works out of the box, no setup needed
✅ **Smart Display** - Only shows for upcoming events (hides for past events)
✅ **Error Handling** - Fallback link if widget fails to load
✅ **Loading State** - Skeleton loader while widget loads
✅ **Bilingual** - Full support for English and French
✅ **Responsive** - Works on desktop and mobile
✅ **Secure** - Proper iframe sandboxing for security

## Supported HelloAsso URLs

The integration automatically detects these URL patterns:

- **Events**: `/associations/{org}/evenements/{event}`
- **Memberships**: `/associations/{org}/adhesions/{membership}`
- **Forms**: `/associations/{org}/formulaires/{form}`

## UI Components

### Buy Tickets Section
```
┌─────────────────────────────────────────────────────┐
│ 🎫 Buy Tickets              [Open in HelloAsso →] │
├─────────────────────────────────────────────────────┤
│ Purchase your tickets securely through HelloAsso   │
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │                                               │ │
│ │         HelloAsso Widget (iframe)            │ │
│ │                                               │ │
│ │         [Ticket Options]                      │ │
│ │         [Pricing]                             │ │
│ │         [Purchase Button]                     │ │
│ │                                               │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Powered by HelloAsso - Secure online ticketing     │
└─────────────────────────────────────────────────────┘
```

## Technical Details

### Widget Placement
The widget appears on the EventPage:
1. After the event description
2. Before the organizer information
3. Only for upcoming events
4. Only when HelloAsso URL is detected

### Security
The iframe includes proper sandbox attributes:
- `allow-scripts` - Required for widget functionality
- `allow-same-origin` - Required for iframe communication
- `allow-forms` - Required for ticket purchases
- `allow-popups` - Required for payment processing

### Performance
- Widget loads asynchronously
- Skeleton loader prevents layout shift
- 2-second timeout for loading state

## Example Usage

An event organizer creates an event and adds this link:
```
https://www.helloasso.com/associations/conclav-paris/evenements/conference-2024
```

The system:
1. Detects it's a HelloAsso URL
2. Extracts: organization="conclav-paris", event="conference-2024"
3. Generates widget URL
4. Displays embedded ticketing on the event page

## Testing

To test the feature:
1. Create a test event
2. Add a HelloAsso event URL (you can use a public HelloAsso event for testing)
3. Save and view the event page
4. Verify the widget appears below the description
5. Verify the "Open in HelloAsso" button works
6. Test on mobile and desktop

## Browser Support

Works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Future Enhancements

Possible future improvements:
- Support for other ticketing platforms (Eventbrite, Billetweb, etc.)
- Display ticket availability on event cards
- Analytics tracking for purchases
- Webhook integration for real-time updates
