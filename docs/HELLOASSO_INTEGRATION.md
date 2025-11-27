# HelloAsso Event Ticketing Integration

This document explains how the HelloAsso ticketing widget integration works for events in Conclav.

## Overview

When an event's `event_link` field contains a HelloAsso URL, the EventPage will automatically detect it and display an embedded ticketing widget, allowing users to purchase tickets directly from the event page.

## Features

- **Automatic Detection**: Detects HelloAsso URLs in event links
- **Embedded Widget**: Displays the HelloAsso ticketing widget directly on the event page
- **Fallback Options**: Provides a direct link to HelloAsso if the widget fails to load
- **Past Event Handling**: Only shows the widget for upcoming events (not past events)
- **Bilingual Support**: Full translation support for English and French

## Supported HelloAsso URL Formats

The integration supports the following HelloAsso URL patterns:

- Events: `https://www.helloasso.com/associations/{organizationSlug}/evenements/{eventSlug}`
- Memberships: `https://www.helloasso.com/associations/{organizationSlug}/adhesions/{membershipSlug}`
- Forms: `https://www.helloasso.com/associations/{organizationSlug}/formulaires/{formSlug}`

## How It Works

### 1. URL Detection
When the EventPage loads, it checks if the `event_link` contains a HelloAsso URL:

```javascript
const helloAssoInfo = useMemo(() => {
  if (!event?.event_link) return null;
  if (!isHelloAssoUrl(event.event_link)) return null;
  return extractHelloAssoInfo(event.event_link);
}, [event?.event_link]);
```

### 2. Widget Display
If a HelloAsso URL is detected and the event is not past, the widget is displayed:

```jsx
{helloAssoInfo && !isPastEvent && (
  <>
    <Divider sx={{ my: 3 }} />
    <HelloAssoWidget
      organizationSlug={helloAssoInfo.organizationSlug}
      formSlug={helloAssoInfo.formSlug}
      formType={helloAssoInfo.formType}
      eventLink={event.event_link}
    />
  </>
)}
```

### 3. Widget Components

The integration consists of three main parts:

#### a. Utility Functions ([src/utils/helloAssoEmbed.js](../src/utils/helloAssoEmbed.js))
- `isHelloAssoUrl(url)`: Checks if a URL is a HelloAsso URL
- `extractHelloAssoInfo(url)`: Extracts organization slug, form slug, and form type
- `getHelloAssoEmbedUrl(...)`: Generates the embed widget URL
- `getHelloAssoButtonUrl(...)`: Generates the button widget URL

#### b. Widget Component ([src/components/HelloAssoWidget.jsx](../src/components/HelloAssoWidget.jsx))
- Displays the HelloAsso iframe widget
- Shows loading skeleton while the widget loads
- Provides error handling with fallback link
- Includes "Open in HelloAsso" button for direct access

#### c. EventPage Integration ([src/pages/EventPage.jsx](../src/pages/EventPage.jsx))
- Detects HelloAsso URLs in event links
- Conditionally renders the widget
- Only displays for upcoming events

## User Experience

### For Event Viewers
1. Navigate to an event page with a HelloAsso link
2. See the "Buy Tickets" section below the event description
3. Purchase tickets directly through the embedded widget
4. Option to open HelloAsso in a new tab if preferred

### For Event Organizers
1. Create or edit an event in the network
2. Add a HelloAsso event URL in the "Event Link" field
3. The ticketing widget will automatically appear on the event page
4. No additional configuration needed

## Translation Keys

The following translation keys are used (available in English and French):

- `pages.event.buyTickets`: "Buy Tickets" / "Acheter des billets"
- `pages.event.openHelloAsso`: "Open in HelloAsso" / "Ouvrir dans HelloAsso"
- `pages.event.helloAssoDescription`: Widget description
- `pages.event.helloAssoLoadError`: Error message when widget fails to load
- `pages.event.poweredByHelloAsso`: Attribution text

## Example

For an event with this HelloAsso link:
```
https://www.helloasso.com/associations/mon-association/evenements/super-event-2024
```

The widget will:
1. Extract: `organizationSlug = "mon-association"`, `formSlug = "super-event-2024"`
2. Generate embed URL: `https://www.helloasso.com/associations/mon-association/evenements/super-event-2024/widget`
3. Display the widget in an iframe with proper styling and error handling

## Security

The iframe uses the following sandbox attributes for security:
- `allow-scripts`: Required for HelloAsso widget functionality
- `allow-same-origin`: Required for iframe communication
- `allow-forms`: Required for ticket purchase forms
- `allow-popups`: Required for payment processing
- `allow-popups-to-escape-sandbox`: Required for payment processing

## Browser Compatibility

The widget works in all modern browsers that support iframes and postMessage API:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Future Enhancements

Potential improvements for future versions:
- Support for other ticketing platforms (Eventbrite, Billetweb, etc.)
- Analytics tracking for ticket purchases
- Display ticket availability directly on event cards
- Webhook integration for real-time ticket sales updates
