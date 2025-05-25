// src/stripe/config.js
import { config, getPriceIds } from '../config/environment';

export const STRIPE_PUBLIC_KEY = config.stripe.publicKey;

// Get environment-specific price IDs
const envPriceIds = getPriceIds();

// Price IDs for different plans
export const PRICE_IDS = {
  community: 'price_community', // Free plan, no price ID needed
  nonprofit: envPriceIds.nonprofit || 'price_nonprofit', // €49/month
  organization: envPriceIds.organization || 'price_organization', // €97/month  
  network: envPriceIds.network || 'price_network', // €247/month
  business: envPriceIds.business || 'price_business', // €497/month
  enterprise: 'price_enterprise', // Custom pricing
};

export const PRICE_ID = envPriceIds.organization || 'price_1RK6Vk2KqNIKpvjTKgFNpV0y'; // €97/month

// Annual Price IDs (discounted)
export const ANNUAL_PRICE_IDS = {
  nonprofit: 'price_nonprofit_annual', // €41/month (billed annually)
  organization: 'price_organization_annual', // €81/month (billed annually)
  network: 'price_network_annual', // €206/month (billed annually)
  business: 'price_business_annual', // €414/month (billed annually)
};