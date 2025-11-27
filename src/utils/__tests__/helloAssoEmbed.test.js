import { describe, it, expect } from 'vitest';
import { isHelloAssoUrl, extractHelloAssoInfo, getHelloAssoEmbedUrl } from '../helloAssoEmbed';

describe('helloAssoEmbed utilities', () => {
  describe('isHelloAssoUrl', () => {
    it('should return true for valid HelloAsso URLs', () => {
      expect(isHelloAssoUrl('https://www.helloasso.com/associations/test/evenements/event-1')).toBe(true);
      expect(isHelloAssoUrl('https://helloasso.com/associations/test/evenements/event-1')).toBe(true);
      expect(isHelloAssoUrl('http://www.helloasso.com/associations/test/adhesions/membership')).toBe(true);
    });

    it('should return false for non-HelloAsso URLs', () => {
      expect(isHelloAssoUrl('https://www.google.com')).toBe(false);
      expect(isHelloAssoUrl('https://www.eventbrite.com/event/123')).toBe(false);
      expect(isHelloAssoUrl('')).toBe(false);
      expect(isHelloAssoUrl(null)).toBe(false);
      expect(isHelloAssoUrl(undefined)).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isHelloAssoUrl('not a url')).toBe(false);
      expect(isHelloAssoUrl('helloasso.com')).toBe(false);
    });
  });

  describe('extractHelloAssoInfo', () => {
    it('should extract info from event URLs', () => {
      const url = 'https://www.helloasso.com/associations/mon-asso/evenements/super-event';
      const info = extractHelloAssoInfo(url);

      expect(info).toEqual({
        organizationSlug: 'mon-asso',
        formSlug: 'super-event',
        formType: 'Event'
      });
    });

    it('should extract info from membership URLs', () => {
      const url = 'https://www.helloasso.com/associations/test-org/adhesions/membership-2024';
      const info = extractHelloAssoInfo(url);

      expect(info).toEqual({
        organizationSlug: 'test-org',
        formSlug: 'membership-2024',
        formType: 'Membership'
      });
    });

    it('should extract info from form URLs', () => {
      const url = 'https://www.helloasso.com/associations/my-org/formulaires/contact-form';
      const info = extractHelloAssoInfo(url);

      expect(info).toEqual({
        organizationSlug: 'my-org',
        formSlug: 'contact-form',
        formType: 'Form'
      });
    });

    it('should handle URLs without www', () => {
      const url = 'https://helloasso.com/associations/org/evenements/event';
      const info = extractHelloAssoInfo(url);

      expect(info).toEqual({
        organizationSlug: 'org',
        formSlug: 'event',
        formType: 'Event'
      });
    });

    it('should return null for invalid URLs', () => {
      expect(extractHelloAssoInfo('')).toBe(null);
      expect(extractHelloAssoInfo(null)).toBe(null);
      expect(extractHelloAssoInfo('https://www.google.com')).toBe(null);
      expect(extractHelloAssoInfo('not a url')).toBe(null);
    });

    it('should return null for HelloAsso URLs without proper structure', () => {
      expect(extractHelloAssoInfo('https://www.helloasso.com')).toBe(null);
      expect(extractHelloAssoInfo('https://www.helloasso.com/associations')).toBe(null);
      expect(extractHelloAssoInfo('https://www.helloasso.com/associations/test')).toBe(null);
    });

    it('should handle complex organization and event slugs', () => {
      const url = 'https://www.helloasso.com/associations/my-long-org-name-2024/evenements/super-mega-event-jan-2024';
      const info = extractHelloAssoInfo(url);

      expect(info).toEqual({
        organizationSlug: 'my-long-org-name-2024',
        formSlug: 'super-mega-event-jan-2024',
        formType: 'Event'
      });
    });
  });

  describe('getHelloAssoEmbedUrl', () => {
    it('should generate correct embed URL for events', () => {
      const url = getHelloAssoEmbedUrl('my-org', 'my-event', 'Event');
      expect(url).toBe('https://www.helloasso.com/associations/my-org/evenements/my-event/widget');
    });

    it('should handle uppercase form slugs', () => {
      const url = getHelloAssoEmbedUrl('my-org', 'MY-EVENT', 'Event');
      expect(url).toBe('https://www.helloasso.com/associations/my-org/evenements/my-event/widget');
    });

    it('should default to Event type if not specified', () => {
      const url = getHelloAssoEmbedUrl('my-org', 'my-event');
      expect(url).toBe('https://www.helloasso.com/associations/my-org/evenements/my-event/widget');
    });

    it('should handle different form types', () => {
      const eventUrl = getHelloAssoEmbedUrl('org', 'form', 'Event');
      const membershipUrl = getHelloAssoEmbedUrl('org', 'form', 'Membership');
      const formUrl = getHelloAssoEmbedUrl('org', 'form', 'Form');

      expect(eventUrl).toBe('https://www.helloasso.com/associations/org/evenements/form/widget');
      expect(membershipUrl).toBe('https://www.helloasso.com/associations/org/evenements/form/widget');
      expect(formUrl).toBe('https://www.helloasso.com/associations/org/evenements/form/widget');
    });
  });

  describe('integration tests', () => {
    it('should work end-to-end for a complete URL', () => {
      const originalUrl = 'https://www.helloasso.com/associations/conclav-paris/evenements/conference-2024';

      // Check if it's a HelloAsso URL
      expect(isHelloAssoUrl(originalUrl)).toBe(true);

      // Extract information
      const info = extractHelloAssoInfo(originalUrl);
      expect(info).toBeDefined();
      expect(info.organizationSlug).toBe('conclav-paris');
      expect(info.formSlug).toBe('conference-2024');
      expect(info.formType).toBe('Event');

      // Generate embed URL
      const embedUrl = getHelloAssoEmbedUrl(info.organizationSlug, info.formSlug, info.formType);
      expect(embedUrl).toBe('https://www.helloasso.com/associations/conclav-paris/evenements/conference-2024/widget');
    });

    it('should handle membership URLs end-to-end', () => {
      const originalUrl = 'https://www.helloasso.com/associations/test-org/adhesions/annual-membership';

      expect(isHelloAssoUrl(originalUrl)).toBe(true);

      const info = extractHelloAssoInfo(originalUrl);
      expect(info.organizationSlug).toBe('test-org');
      expect(info.formSlug).toBe('annual-membership');
      expect(info.formType).toBe('Membership');

      const embedUrl = getHelloAssoEmbedUrl(info.organizationSlug, info.formSlug, info.formType);
      expect(embedUrl).toBe('https://www.helloasso.com/associations/test-org/evenements/annual-membership/widget');
    });
  });
});
