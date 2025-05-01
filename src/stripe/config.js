// src/stripe/config.js
export const STRIPE_PUBLIC_KEY = 'pk_live_51PomwV2KqNIKpvjTaSUJSUuF41j7eSjsJxc2oPFf3omKBkUJAz0Q2hHSsDdATg2vZie9bOKSiFanC3jClektBUmR00GVvQFFkl';

// Price IDs for different plans (you'll need to create these in your Stripe dashboard)
export const PRICE_IDS = {
  community: 'price_community', // Free plan, no price ID needed
  nonprofit: 'price_nonprofit', // €49/month
  organization: 'price_organization', // €97/month  
  network: 'price_network', // €247/month
  business: 'price_business', // €497/month
  enterprise: 'price_enterprise', // Custom pricing
};

export const PRICE_ID = 'price_1RK6Vk2KqNIKpvjTKgFNpV0y'; // €97/month

// Annual Price IDs (discounted)
export const ANNUAL_PRICE_IDS = {
  nonprofit: 'price_nonprofit_annual', // €41/month (billed annually)
  organization: 'price_organization_annual', // €81/month (billed annually)
  network: 'price_network_annual', // €206/month (billed annually)
  business: 'price_business_annual', // €414/month (billed annually)
};