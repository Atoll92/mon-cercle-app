# Reactions Feature Toggle

## Overview
Network administrators can now enable or disable emoji reactions for their network through the Network Settings tab.

## How to Enable/Disable Reactions

### For Network Administrators

1. Navigate to your network's Admin dashboard
2. Go to the **Network Settings** tab
3. Scroll to the **Features Configuration** section
4. Find the **Emoji Reactions** toggle
5. Switch it on/off to enable/disable reactions for your network
6. Click **Save Settings** to apply the changes

## Technical Implementation

### Database Configuration
The reactions feature state is stored in the `networks` table's `features_config` JSONB column:

```json
{
  "events": true,
  "news": true,
  "reactions": true,  // Controls reactions feature
  "chat": true,
  // ... other features
}
```

### Component Behavior
When reactions are disabled:
- The `ReactionBar` component returns `null` and doesn't render
- No reaction buttons appear on posts, news, comments, events, or wiki pages
- Existing reactions in the database remain intact but are hidden from view
- Users cannot add new reactions

When reactions are re-enabled:
- All existing reactions become visible again
- Users can add new reactions

### Files Modified

1. **NetworkSettingsTab.jsx** ([src/components/admin/NetworkSettingsTab.jsx](src/components/admin/NetworkSettingsTab.jsx))
   - Added `reactions` to features state initialization (lines 168, 185)
   - Added `reactions` to features_config in handleUpdateNetwork (line 260)
   - Added reactions entry to featuresList array (line 382)
   - Imported `ReactionsIcon` (AddReactionOutlined)

2. **ReactionBar.jsx** ([src/components/ReactionBar.jsx](src/components/ReactionBar.jsx))
   - Imported `useNetwork` from networkContext
   - Added `reactionsEnabled` computed property that checks network features_config
   - Returns `null` if reactions are disabled (lines 198-201)

### Default Behavior
- **New networks**: Reactions are enabled by default (`reactions: true`)
- **Existing networks**: Reactions remain enabled unless explicitly disabled by admin
- **Missing config**: If `features_config` is missing, reactions default to enabled

## Use Cases

### Why Disable Reactions?
1. **Professional Networks**: Some professional or formal networks may prefer to keep engagement more traditional
2. **Focused Communication**: Networks focused on serious topics may want to avoid emoji reactions
3. **Simplified Interface**: Some communities prefer a cleaner, simpler interface
4. **Controlled Engagement**: Admins may want to test or gradually introduce features

### Why Enable Reactions?
1. **Casual Networks**: Social, hobby, or community networks benefit from expressive reactions
2. **Quick Feedback**: Reactions provide quick, low-effort ways to engage with content
3. **Engagement Metrics**: Track what content resonates with members
4. **User Experience**: Modern social features that users expect

## API Integration

The feature flag is automatically checked by the `ReactionBar` component. No additional API changes are required when toggling the feature on/off.

### Future Enhancements

Potential improvements for the reactions system:
1. **Custom Emoji Sets**: Allow admins to configure which emojis are available
2. **Reaction Analytics**: Show admins which reactions are most popular
3. **Per-Content-Type Toggles**: Enable reactions for posts but not comments, etc.
4. **Reaction Permissions**: Control which member roles can add reactions
5. **Reaction Limits**: Limit number of reactions per member per content item

## Testing Checklist

When testing the reactions feature toggle:

- [ ] Verify toggle appears in Network Settings
- [ ] Disable reactions and verify ReactionBar disappears from:
  - [ ] Posts in Social Wall
  - [ ] News items
  - [ ] Comments
  - [ ] Events (if implemented)
  - [ ] Wiki pages (if implemented)
- [ ] Re-enable reactions and verify they reappear
- [ ] Verify existing reactions are preserved when toggling
- [ ] Test with different network roles (admin vs member)
- [ ] Verify settings persist after page refresh

## Related Documentation

- [Reactions System Implementation](./ENGAGEMENT_FEATURES_IMPLEMENTATION.md#1-reactions-system)
- [Network Settings Documentation](./COMPONENTS_GUIDE.md#admin-components)
- [Database Schema](./DATABASE_SCHEMA.md)
