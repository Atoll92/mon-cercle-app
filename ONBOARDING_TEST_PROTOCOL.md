# Onboarding Test Protocol

This document provides a comprehensive test protocol for all onboarding flows in the Conclav application. This protocol can be executed to verify the complete user journey from network creation to member onboarding.

## Test Environment Setup

### Prerequisites
- Local development environment running (`npm run dev`)
- Supabase backend configured and accessible
- Email service functional for invitation testing
- Browser with developer tools access
- Multiple email accounts for testing different user scenarios

### Test Data Setup
- Prepare 3-5 unique email addresses for testing
- Have test images ready for logo uploads (PNG/JPG, various sizes)
- CSV file with test email addresses for batch invitations

## Test Suite 1: Network Admin Onboarding

### Test Case 1.1: Complete Network Creation Wizard

**Objective**: Test the full network creation flow from start to finish

**Steps**:
1. Navigate to `/network-onboarding` (or trigger from signup flow)
2. **Step 1 - Network Basics**:
   - Enter network name: "Test Network Protocol"
   - Enter description: "Testing complete onboarding flows"
   - Select purpose: "Professional"
   - Click "Next"
   - **Verify**: Form validation works, next button enabled

3. **Step 2 - Privacy & Access**:
   - Test each privacy level option:
     - Select "Private" → verify description updates
     - Select "Restricted" → verify description updates  
     - Select "Public" → verify description updates
   - Choose "Restricted" for test
   - Click "Next"
   - **Verify**: Privacy selection persists, descriptions are accurate

4. **Step 3 - Features & Modules**:
   - Toggle features on/off to test state management:
     - Enable: Events, News, Chat, Files, Wiki
     - Disable: Moodboards, Location Services, Email Notifications
   - Click "Next"
   - **Verify**: Feature toggles work, state persists between navigation

5. **Step 4 - Branding & Layout**:
   - Upload a test logo (test with different sizes/formats)
   - Choose a custom theme color (test color picker)
   - Drag tabs to reorder navigation
   - Test tab visibility toggles
   - Click "Next"
   - **Verify**: Logo uploads successfully, color changes preview, drag-drop works

6. **Step 5 - Review & Create**:
   - Review all configured settings
   - Click "Create Network"
   - **Verify**: Network created successfully, redirected to network page

**Expected Results**:
- Wizard completes without errors
- Network appears in database with correct settings
- User assigned admin role automatically
- Network page loads with configured features
- Logo and theme applied correctly

### Test Case 1.2: Wizard Navigation & Validation

**Objective**: Test wizard navigation, validation, and error handling

**Steps**:
1. Start new network creation wizard
2. **Test Back Navigation**:
   - Proceed to Step 3
   - Click "Back" twice
   - **Verify**: Returns to Step 1 with data preserved
3. **Test Required Field Validation**:
   - Leave network name empty, try to proceed
   - **Verify**: Error message appears, cannot proceed
4. **Test Logo Upload Validation**:
   - Try uploading invalid file types (PDF, TXT)
   - Try uploading oversized image (>5MB)
   - **Verify**: Appropriate error messages shown
5. **Test Abandonment & Resume**:
   - Partially fill wizard, navigate away
   - Return to wizard
   - **Verify**: Progress preserved or restarted appropriately

**Expected Results**:
- Navigation works smoothly in both directions
- Validation prevents invalid submissions
- Error messages are clear and helpful
- Data persistence works as expected

## Test Suite 2: Invitation System Testing

### Test Case 2.1: Email Invitation Flow (Admin Perspective)

**Objective**: Test sending email invitations and monitoring their status

**Steps**:
1. As network admin, navigate to Admin Panel → Members Tab
2. **Individual Email Invitation**:
   - Click "Invite Member"
   - Enter test email address
   - Select role: "Member"
   - Click "Send Invitation"
   - **Verify**: Success message appears, invitation in pending list

3. **Batch Email Invitation**:
   - Click "Batch Invite"
   - Test manual email entry (add 3 emails)
   - Test CSV upload functionality
   - Select role: "Member"
   - Click "Send Invitations"
   - **Verify**: Progress tracker works, success/failure counts accurate

4. **Invitation Management**:
   - View invitation list with status tracking
   - Try resending failed invitations
   - Cancel pending invitations
   - **Verify**: All management functions work correctly

**Expected Results**:
- Invitations sent successfully to email service
- Status tracking accurate (pending/sent/failed)
- Batch processing handles errors gracefully
- Management interface responsive and functional

### Test Case 2.2: Invitation Link Management

**Objective**: Test creation and management of shareable invitation links

**Steps**:
1. Navigate to Admin Panel → Invitation Links Tab
2. **Create Invitation Link**:
   - Click "Create Link"
   - Set custom name: "Developer Recruitment"
   - Select role: "Member"
   - Set max uses: 10
   - Set expiration: 30 days from now
   - Click "Create"
   - **Verify**: Link generated with QR code

3. **Link Management**:
   - Copy link URL and QR code
   - Toggle link active/inactive status
   - Edit link settings (name, limits)
   - Delete test links
   - **Verify**: All operations work correctly

4. **Usage Tracking**:
   - Note current usage count
   - Use link to join (next test case)
   - Return and verify usage count incremented
   - **Verify**: Usage statistics accurate

**Expected Results**:
- Links generate correctly with proper codes
- QR codes scannable and valid
- Usage limits enforced properly
- Management interface intuitive

### Test Case 2.3: Email Invitation Acceptance (Member Perspective)

**Objective**: Test the member experience accepting email invitations

**Steps**:
1. **New User Scenario**:
   - Check test email for invitation
   - Click invitation link
   - **Verify**: Redirected to signup page with email prefilled
   - Complete signup process
   - **Verify**: Automatically joined network with correct role

2. **Existing User Scenario**:
   - Send invitation to email of existing user
   - Log in as that user
   - Click invitation link
   - **Verify**: Direct join without signup required

3. **Invitation Code Validation**:
   - Test expired invitation link
   - Test already-used single-use invitation
   - **Verify**: Appropriate error messages displayed

**Expected Results**:
- Email prefilling works for new users
- Existing users join immediately
- Invalid invitations handled gracefully
- User assigned correct role and network access

### Test Case 2.4: Invitation Link Join Flow

**Objective**: Test joining via shareable invitation links

**Steps**:
1. **Unauthenticated User**:
   - Open invitation link in incognito/private browser
   - **Verify**: Network preview shown with member count
   - Click "Join Network"
   - **Verify**: Redirected to signup with return URL
   - Complete signup
   - **Verify**: Automatically joined after signup

2. **Authenticated User**:
   - Log in as different user
   - Visit invitation link
   - **Verify**: Join button available immediately
   - Click "Join Network"
   - **Verify**: Instant join with role assignment

3. **Link Validation**:
   - Test inactive link
   - Test expired link
   - Test usage limit exceeded
   - **Verify**: Appropriate error messages for each scenario

**Expected Results**:
- Link preview informative and attractive
- Join process smooth for both user types
- Validation prevents invalid joins
- Usage tracking accurate

## Test Suite 3: Member Welcome Experience

### Test Case 3.1: Welcome Message & Confetti Animation

**Objective**: Test the celebration experience for new members

**Steps**:
1. **Fresh Join Detection**:
   - Join network via invitation link
   - **Verify**: Welcome dialog appears with confetti animation
   - **Verify**: Network features overview displayed
   - **Verify**: Option to start guided tour present

2. **Welcome Message Content**:
   - Read through welcome message
   - **Verify**: Network-specific information accurate
   - **Verify**: Feature highlights relevant to enabled features
   - Click "Start Tour" if offered
   - **Verify**: Onboarding guide launches

3. **Welcome Persistence**:
   - Dismiss welcome message
   - Refresh page
   - **Verify**: Welcome message doesn't reappear
   - Log out and back in
   - **Verify**: Welcome message still dismissed

**Expected Results**:
- Confetti animation plays smoothly
- Welcome content informative and engaging
- Tour integration works properly
- Dismissal state persists correctly

### Test Case 3.2: Interactive Onboarding Guide

**Objective**: Test the guided tour for new network members

**Steps**:
1. **Guide Triggering**:
   - Join a network with ≤2 members
   - **Verify**: Onboarding guide auto-starts
   - Or click "Take Tour" from welcome message
   - **Verify**: Guide launches properly

2. **Guide Navigation**:
   - **Step 1**: Admin panel highlight
     - **Verify**: Admin button highlighted with tooltip
     - Click highlighted element
     - **Verify**: Navigates to admin panel
   - **Step 2**: Members tab highlight
     - **Verify**: Members tab highlighted
     - Click highlighted element
   - **Step 3**: Invite functionality highlight
     - **Verify**: Invite button highlighted
     - **Verify**: Tooltip explains functionality

3. **Guide Completion**:
   - Complete all steps
   - **Verify**: Guide concludes with completion message
   - **Verify**: Guide doesn't restart on page refresh

**Expected Results**:
- Guide highlights correct elements
- Tooltips informative and well-positioned
- Navigation works between steps
- Completion state persists

## Test Suite 4: Error Handling & Edge Cases

### Test Case 4.1: Network Creation Error Scenarios

**Objective**: Test error handling during network creation

**Steps**:
1. **Network Limit Testing**:
   - Create multiple networks with same admin
   - **Verify**: Proper limits enforced per subscription plan
2. **Upload Failures**:
   - Test logo upload with poor connection
   - Test with corrupted image files
   - **Verify**: Graceful error handling and retry options
3. **Database Errors**:
   - Simulate network creation during maintenance
   - **Verify**: User-friendly error messages displayed

### Test Case 4.2: Invitation System Edge Cases

**Objective**: Test invitation system with edge cases

**Steps**:
1. **Duplicate Invitations**:
   - Send invitation to already-invited email
   - **Verify**: Appropriate handling (update existing or prevent duplicate)
2. **Invalid Email Formats**:
   - Test malformed email addresses in batch upload
   - **Verify**: Validation catches errors, provides feedback
3. **Concurrent Joins**:
   - Multiple users join via same link simultaneously
   - **Verify**: Usage limits respected, no race conditions

### Test Case 4.3: Welcome Experience Edge Cases

**Objective**: Test welcome system with unusual scenarios

**Steps**:
1. **Multiple Network Joins**:
   - Join multiple networks in sequence
   - **Verify**: Welcome shown appropriately for each
2. **Tour Interruption**:
   - Start onboarding guide, navigate away mid-tour
   - Return later
   - **Verify**: Tour state handled properly
3. **Admin vs Member Welcome**:
   - Test welcome experience for admin role assignment
   - **Verify**: Content appropriate for role level

## Test Suite 5: Integration & Performance Testing

### Test Case 5.1: Cross-Feature Integration

**Objective**: Verify onboarding integrates properly with other features

**Steps**:
1. **Badge System Integration**:
   - Join network as new member
   - **Verify**: "Early Adopter" or welcome badges awarded
2. **Subscription Integration**:
   - Create network with trial subscription
   - **Verify**: Trial status shown during onboarding
3. **Theme Integration**:
   - Complete onboarding with custom theme
   - **Verify**: Theme applied consistently across app

### Test Case 5.2: Performance & Responsiveness

**Objective**: Test onboarding performance under various conditions

**Steps**:
1. **Mobile Responsiveness**:
   - Test entire onboarding flow on mobile device
   - **Verify**: All interactions work touch-friendly
2. **Slow Connection Testing**:
   - Throttle network to 3G speeds
   - Test image uploads and wizard navigation
   - **Verify**: Acceptable performance and loading states
3. **Large Batch Operations**:
   - Test batch invitation with 100+ emails
   - **Verify**: System handles load without timeouts

## Test Execution Checklist

### Pre-Test Setup
- [ ] Development environment running
- [ ] Test email accounts prepared
- [ ] Test files (images, CSV) ready
- [ ] Browser developer tools open

### Test Execution
- [ ] Test Suite 1: Network Admin Onboarding
- [ ] Test Suite 2: Invitation System Testing  
- [ ] Test Suite 3: Member Welcome Experience
- [ ] Test Suite 4: Error Handling & Edge Cases
- [ ] Test Suite 5: Integration & Performance Testing

### Post-Test Verification
- [ ] All test networks cleaned up
- [ ] Test invitations cancelled/removed
- [ ] Database state verified clean
- [ ] Performance metrics documented

## Bug Reporting Template

When issues are found during testing:

```
**Test Case**: [Test Suite X.Y - Test Name]
**Steps to Reproduce**: 
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]
**Environment**: [Browser, device, etc.]
**Severity**: [Critical/High/Medium/Low]
**Additional Info**: [Screenshots, console errors, etc.]
```

## Success Criteria

All test cases should pass with:
- No critical errors or crashes
- User experience smooth and intuitive
- Data persistence working correctly
- Performance within acceptable limits
- Error messages helpful and actionable
- All features accessible and functional

This protocol should be executed before any major releases involving onboarding flows and repeated after significant changes to the invitation or network creation systems.