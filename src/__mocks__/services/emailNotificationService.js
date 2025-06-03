import { vi } from 'vitest';

export const sendEmailNotification = vi.fn().mockResolvedValue({ success: true });
export const processEmailQueue = vi.fn().mockResolvedValue({ processed: 0 });
export const retryFailedEmails = vi.fn().mockResolvedValue({ retried: 0 });
export const getEmailQueueStatus = vi.fn().mockResolvedValue({ pending: 0, failed: 0 });

// Default export to match the import pattern
export default {
  sendEmailNotification,
  processEmailQueue,
  retryFailedEmails,
  getEmailQueueStatus
};