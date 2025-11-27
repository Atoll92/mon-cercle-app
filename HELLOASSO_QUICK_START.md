# HelloAsso Integration - Quick Start Guide

## ✅ What's Been Added

Your Conclav app now automatically detects and embeds HelloAsso ticketing widgets for events!

## 🚀 How to Use

### For Event Organizers

1. **Create or Edit an Event**
   - Go to your network's Events tab
   - Click "Create Event" or edit an existing event

2. **Add HelloAsso URL**
   - In the event form, find the "Event Link" field
   - Paste your HelloAsso event URL
   - Example: `https://www.helloasso.com/associations/my-org/evenements/my-event-2024`

3. **Save the Event**
   - Complete the rest of the event details
   - Save the event

4. **Done!**
   - The ticketing widget will automatically appear on the event page
   - Users can purchase tickets directly from your network

### For Event Attendees

1. **View Event**
   - Navigate to any event with a HelloAsso link

2. **Purchase Tickets**
   - Scroll down to the "Buy Tickets" section
   - Complete the purchase through the embedded widget
   - OR click "Open in HelloAsso" to purchase on HelloAsso directly

## 📋 Example URLs

These HelloAsso URL formats are supported:

**Events:**
```
https://www.helloasso.com/associations/conclav-paris/evenements/conference-2024
https://helloasso.com/associations/my-association/evenements/workshop-jan
```

**Memberships:**
```
https://www.helloasso.com/associations/my-org/adhesions/annual-membership
```

**Forms:**
```
https://www.helloasso.com/associations/my-org/formulaires/registration-form
```

## 🎨 What It Looks Like

When someone views an event with a HelloAsso link, they'll see:

```
┌────────────────────────────────────────────────┐
│  🎫 Buy Tickets         [Open in HelloAsso →] │
├────────────────────────────────────────────────┤
│  Purchase your tickets securely via HelloAsso │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │                                          │ │
│  │     HelloAsso Ticketing Widget          │ │
│  │     (embedded iframe)                    │ │
│  │                                          │ │
│  │     - Ticket options                     │ │
│  │     - Pricing                            │ │
│  │     - Secure checkout                    │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Powered by HelloAsso - Secure ticketing      │
└────────────────────────────────────────────────┘
```

## ⚙️ Features

✅ **Automatic Detection** - Just paste the URL, widget appears automatically
✅ **No Configuration** - Works immediately, no setup needed
✅ **Smart Display** - Only shows for upcoming events
✅ **Mobile Friendly** - Responsive design for all devices
✅ **Error Handling** - Fallback to direct HelloAsso link if widget fails
✅ **Loading States** - Skeleton loader while widget loads
✅ **Bilingual** - Full support for English and French
✅ **Secure** - Proper iframe sandboxing

## 📱 Mobile Support

The widget is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones (iOS/Android)

## 🌍 Language Support

Automatically displays in the user's selected language:
- English
- French (Français)

## 🔒 Security

The widget uses secure iframe sandboxing:
- Scripts run in isolated context
- Forms are processed securely
- Payment processing handled by HelloAsso's secure platform

## 📞 Support

If you have questions:
1. Check the full documentation: `/docs/HELLOASSO_INTEGRATION.md`
2. Contact support with any issues

## 🎯 Tips

- **Test First**: Create a test event with a HelloAsso URL to see how it works
- **Use Real Links**: The widget works with real HelloAsso event URLs
- **Past Events**: The widget won't show for events that have already ended
- **Mobile Testing**: Test the widget on mobile devices for best user experience

## 🚨 Troubleshooting

**Widget not showing?**
- Check that the event link is a valid HelloAsso URL
- Verify the event is not in the past
- Clear browser cache and reload

**Widget shows error?**
- Click "Open in HelloAsso" button to complete purchase directly
- Check HelloAsso URL is correct and event is still active

**Need help?**
- Full documentation: `/docs/HELLOASSO_INTEGRATION.md`
- Check browser console for any errors
