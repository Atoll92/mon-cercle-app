import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as stripeService from './stripeService';
import { supabase } from '../supabaseclient';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    redirectToCheckout: vi.fn()
  }))
}));

describe('Stripe Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location
    delete window.location;
    window.location = { origin: 'http://localhost:3000' };
    
    // Mock authenticated user
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user1', email: 'test@example.com' } },
      error: null
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/session123'
      };

      supabase.functions.invoke.mockResolvedValue({
        data: mockSession,
        error: null
      });

      const result = await stripeService.createCheckoutSession(
        'net1',
        'price_1234',
        'user1',
        'test@example.com'
      );

      expect(supabase.functions.invoke).toHaveBeenCalledWith('create-checkout-session', {
        body: {
          networkId: 'net1',
          priceId: 'price_1234',
          userId: 'user1',
          customerEmail: 'test@example.com',
          successUrl: 'http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: 'http://localhost:3000/pricing'
        }
      });

      expect(result).toEqual({ data: mockSession, error: null });
    });

    it('should handle checkout session error', async () => {
      const mockError = { message: 'Invalid price ID' };

      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await stripeService.createCheckoutSession(
        'net1',
        'invalid_price',
        'user1',
        'test@example.com'
      );

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('redirectToCheckout', () => {
    it('should redirect to Stripe checkout', async () => {
      const mockStripe = {
        redirectToCheckout: vi.fn().mockResolvedValue({ error: null })
      };

      const { loadStripe } = await import('@stripe/stripe-js');
      loadStripe.mockResolvedValue(mockStripe);

      // Mock environment variable
      import.meta.env.VITE_STRIPE_PUBLIC_KEY = 'pk_test_123';

      const result = await stripeService.redirectToCheckout('cs_test_123');

      expect(mockStripe.redirectToCheckout).toHaveBeenCalledWith({
        sessionId: 'cs_test_123'
      });

      expect(result).toEqual({ error: null });
    });

    it('should handle redirect error', async () => {
      const mockError = { message: 'Payment cancelled' };
      const mockStripe = {
        redirectToCheckout: vi.fn().mockResolvedValue({ error: mockError })
      };

      const { loadStripe } = await import('@stripe/stripe-js');
      loadStripe.mockResolvedValue(mockStripe);

      const result = await stripeService.redirectToCheckout('cs_test_123');

      expect(result).toEqual({ error: mockError });
    });
  });

  describe('createBillingPortalSession', () => {
    it('should create billing portal session', async () => {
      const mockPortalSession = {
        url: 'https://billing.stripe.com/session123'
      };

      supabase.functions.invoke.mockResolvedValue({
        data: mockPortalSession,
        error: null
      });

      const result = await stripeService.createBillingPortalSession(
        'cus_123',
        'http://localhost:3000/billing'
      );

      expect(supabase.functions.invoke).toHaveBeenCalledWith('manage-subscription', {
        body: {
          customerId: 'cus_123',
          returnUrl: 'http://localhost:3000/billing'
        }
      });

      expect(result).toEqual({ data: mockPortalSession, error: null });
    });

    it('should handle billing portal error', async () => {
      const mockError = { message: 'Customer not found' };

      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await stripeService.createBillingPortalSession('invalid_customer');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription', async () => {
      const mockResponse = {
        subscription: {
          id: 'sub_123',
          status: 'canceled'
        }
      };

      supabase.functions.invoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await stripeService.cancelSubscription('sub_123');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('manage-subscription', {
        body: {
          action: 'cancel',
          subscriptionId: 'sub_123'
        }
      });

      expect(result).toEqual({ data: mockResponse, error: null });
    });

    it('should handle cancellation error', async () => {
      const mockError = { message: 'Subscription not found' };

      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await stripeService.cancelSubscription('invalid_sub');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate subscription', async () => {
      const mockResponse = {
        subscription: {
          id: 'sub_123',
          status: 'active'
        }
      };

      supabase.functions.invoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await stripeService.reactivateSubscription('sub_123');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('manage-subscription', {
        body: {
          action: 'reactivate',
          subscriptionId: 'sub_123'
        }
      });

      expect(result).toEqual({ data: mockResponse, error: null });
    });

    it('should handle reactivation error', async () => {
      const mockError = { message: 'Cannot reactivate' };

      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await stripeService.reactivateSubscription('sub_123');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription plan', async () => {
      const mockResponse = {
        subscription: {
          id: 'sub_123',
          items: [{ price: { id: 'price_new' } }]
        }
      };

      supabase.functions.invoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await stripeService.updateSubscription('sub_123', 'price_new');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('manage-subscription', {
        body: {
          action: 'update',
          subscriptionId: 'sub_123',
          priceId: 'price_new'
        }
      });

      expect(result).toEqual({ data: mockResponse, error: null });
    });

    it('should handle update error', async () => {
      const mockError = { message: 'Invalid price' };

      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await stripeService.updateSubscription('sub_123', 'invalid_price');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });
});