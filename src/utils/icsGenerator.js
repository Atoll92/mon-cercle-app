/**
 * ICS (iCalendar) file generator utility
 * Generates .ics files for calendar events that can be attached to emails
 */

/**
 * Format a date for ICS format (YYYYMMDDTHHMMSSZ)
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string
 */
const formatICSDate = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  // Convert to UTC and format as YYYYMMDDTHHMMSSZ
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Escape special characters for ICS format
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
const escapeICSText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\\/g, '\\\\')  // Backslash
    .replace(/,/g, '\\,')    // Comma
    .replace(/;/g, '\\;')    // Semicolon
    .replace(/\n/g, '\\n')   // Newline
    .replace(/\r/g, '')      // Remove carriage return
    .trim();
};

/**
 * Generate a unique identifier for the event
 * @param {string} eventId - The event ID from the database
 * @param {string} domain - The domain of the application
 * @returns {string} - Unique identifier
 */
const generateUID = (eventId, domain = 'mon-cercle.com') => {
  return `event-${eventId}@${domain}`;
};

/**
 * Calculate end time if not provided (default to 1 hour after start)
 * @param {Date|string} startDate - The start date
 * @param {Date|string|null} endDate - The end date (optional)
 * @returns {Date} - The end date
 */
const calculateEndDate = (startDate, endDate = null) => {
  if (endDate) {
    const end = new Date(endDate);
    if (!isNaN(end.getTime())) {
      return end;
    }
  }
  
  // Default to 1 hour after start
  const start = new Date(startDate);
  const end = new Date(start.getTime() + (60 * 60 * 1000)); // Add 1 hour
  return end;
};

/**
 * Generate ICS file content for an event
 * @param {Object} eventData - Event data object
 * @param {string} eventData.id - Event ID
 * @param {string} eventData.title - Event title
 * @param {string} eventData.description - Event description
 * @param {Date|string} eventData.startDate - Event start date
 * @param {Date|string} [eventData.endDate] - Event end date (optional)
 * @param {string} [eventData.location] - Event location
 * @param {string} [eventData.organizer] - Organizer name
 * @param {string} [eventData.organizerEmail] - Organizer email
 * @param {string} [eventData.url] - Event URL
 * @returns {string} - ICS file content
 */
export const generateICSContent = (eventData) => {
  const {
    id,
    title,
    description = '',
    startDate,
    endDate,
    location = '',
    organizer = '',
    organizerEmail = '',
    url = ''
  } = eventData;

  if (!id || !title || !startDate) {
    throw new Error('Event ID, title, and start date are required');
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = calculateEndDate(startDate, endDate);
  
  // Generate ICS content
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mon Cercle//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${generateUID(id)}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${escapeICSText(title)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
  ];

  // Add optional fields
  if (location) {
    icsLines.push(`LOCATION:${escapeICSText(location)}`);
  }

  if (organizer) {
    if (organizerEmail) {
      icsLines.push(`ORGANIZER;CN=${escapeICSText(organizer)}:mailto:${organizerEmail}`);
    } else {
      icsLines.push(`ORGANIZER;CN=${escapeICSText(organizer)}:noreply@mon-cercle.com`);
    }
  }

  if (url) {
    icsLines.push(`URL:${url}`);
  }

  // Add event status and other standard fields
  icsLines.push(
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Event Reminder',
    'TRIGGER:-PT15M', // 15 minutes before
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  );

  // Join with CRLF (required by ICS standard)
  return icsLines.join('\r\n');
};

/**
 * Generate ICS file as base64 encoded string for email attachment
 * @param {Object} eventData - Event data object
 * @returns {string} - Base64 encoded ICS content
 */
export const generateICSBase64 = (eventData) => {
  const icsContent = generateICSContent(eventData);
  
  // Convert to base64 for email attachment
  if (typeof btoa !== 'undefined') {
    // Browser environment
    return btoa(icsContent);
  } else {
    // Node.js environment (for edge functions)
    return Buffer.from(icsContent, 'utf-8').toString('base64');
  }
};

/**
 * Generate filename for the ICS file
 * @param {string} eventTitle - The event title
 * @param {Date|string} eventDate - The event date
 * @returns {string} - Filename for the ICS file
 */
export const generateICSFilename = (eventTitle, eventDate) => {
  const date = new Date(eventDate);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const titleSlug = eventTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30); // Limit length
  
  return `${titleSlug}-${dateStr}.ics`;
};

/**
 * Create attachment object for email services
 * @param {Object} eventData - Event data object
 * @returns {Object} - Attachment object compatible with email services
 */
export const createICSAttachment = (eventData) => {
  const { title, startDate } = eventData;
  
  return {
    filename: generateICSFilename(title, startDate),
    content: generateICSBase64(eventData),
    type: 'text/calendar',
    disposition: 'attachment'
  };
};

/**
 * Helper function to create event data from database event object
 * @param {Object} dbEvent - Event object from database
 * @param {string} [organizerName] - Organizer name
 * @param {string} [organizerEmail] - Organizer email
 * @param {string} [eventUrl] - URL to view the event
 * @returns {Object} - Formatted event data for ICS generation
 */
export const formatEventForICS = (dbEvent, organizerName = '', organizerEmail = '', eventUrl = '') => {
  return {
    id: dbEvent.id,
    title: dbEvent.title || dbEvent.name || 'Untitled Event',
    description: dbEvent.description || dbEvent.content || '',
    startDate: dbEvent.event_date || dbEvent.start_date || dbEvent.date,
    endDate: dbEvent.end_date || null,
    location: dbEvent.location || '',
    organizer: organizerName,
    organizerEmail: organizerEmail,
    url: eventUrl
  };
};

// Default export for the main function
export default {
  generateICSContent,
  generateICSBase64,
  generateICSFilename,
  createICSAttachment,
  formatEventForICS
};