export const formatGBP = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

export const getSavingsPercentage = (monthlyPrice: number, yearlyPrice: number): number => {
  const annualMonthlyEquivalent = monthlyPrice * 12;
  const savings = annualMonthlyEquivalent - yearlyPrice;
  return Math.round((savings / annualMonthlyEquivalent) * 100);
};

export const SUBSCRIPTION_PRICING = {
  essential: {
    monthly: 49,
    yearly: 470, // ~20% discount
    features: [
      "Up to 1000 calls per month",
      "24/7 AI receptionist",
      "Basic appointment booking",
      "Email notifications",
      "Standard support",
      "UK phone number included",
      "Call recording & transcripts"
    ]
  },
  professional: {
    monthly: 149,
    yearly: 1430, // ~20% discount
    features: [
      "Up to 2,000 calls per month",
      "Advanced AI conversations",
      "Smart appointment scheduling",
      "Google Calendar integration", 
      "SMS notifications",
      "Analytics dashboard",
      "Priority support",
      "Multiple phone numbers",
      "Custom AI personality",
      "Export all data"
    ]
  },
  enterprise: {
    monthly: 299,
    yearly: 2870, // ~20% discount
    features: [
      "Unlimited calls",
      "Multi-location support",
      "Advanced analytics",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "24/7 phone support",
      "White-label options",
      "Advanced security features",
      "SLA guarantee"
    ]
  }
} as const;