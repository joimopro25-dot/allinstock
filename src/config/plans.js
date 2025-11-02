// Subscription Plans Configuration

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    namePortuguese: 'Gratuito',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    features: {
      users: 1,
      products: 50,
      locations: 5,
      clients: 100,
      suppliers: 50,
      quotations: 20,
      invoices: 20,
      purchaseOrders: 20,
      emailIntegration: false,
      calendarIntegration: false,
      advancedAnalytics: false,
      apiAccess: false,
      support: 'email_48h'
    },
    description: {
      en: 'Perfect for small businesses just starting out',
      pt: 'Perfeito para pequenas empresas a começar'
    },
    highlights: {
      en: [
        '1 user account',
        'Up to 50 products',
        '5 stock locations',
        'Basic stock management',
        'Email support (48h)'
      ],
      pt: [
        '1 utilizador',
        'Até 50 produtos',
        '5 localizações de stock',
        'Gestão básica de stock',
        'Suporte por email (48h)'
      ]
    }
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    namePortuguese: 'Iniciante',
    price: 10,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: null, // Will be set after Stripe setup
    features: {
      users: 3,
      products: 500,
      locations: 20,
      clients: 500,
      suppliers: 200,
      quotations: 100,
      invoices: 100,
      purchaseOrders: 100,
      emailIntegration: true,
      calendarIntegration: true,
      advancedAnalytics: false,
      apiAccess: false,
      support: 'email_24h'
    },
    description: {
      en: 'Ideal for growing businesses with multiple users',
      pt: 'Ideal para empresas em crescimento com vários utilizadores'
    },
    highlights: {
      en: [
        '3 user accounts',
        'Up to 500 products',
        '20 stock locations',
        'Email & Calendar integration',
        'Email support (24h)'
      ],
      pt: [
        '3 utilizadores',
        'Até 500 produtos',
        '20 localizações de stock',
        'Integração Email & Calendário',
        'Suporte por email (24h)'
      ]
    },
    popular: true
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    namePortuguese: 'Profissional',
    price: 15,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: null, // Will be set after Stripe setup
    features: {
      users: 10,
      products: 2000,
      locations: -1, // -1 means unlimited
      clients: 2000,
      suppliers: 1000,
      quotations: 500,
      invoices: 500,
      purchaseOrders: 500,
      emailIntegration: true,
      calendarIntegration: true,
      advancedAnalytics: true,
      apiAccess: false,
      support: 'priority_12h'
    },
    description: {
      en: 'For established businesses needing advanced features',
      pt: 'Para empresas estabelecidas que precisam de funcionalidades avançadas'
    },
    highlights: {
      en: [
        '10 user accounts',
        'Up to 2000 products',
        'Unlimited locations',
        'Advanced analytics & reports',
        'Priority support (12h)'
      ],
      pt: [
        '10 utilizadores',
        'Até 2000 produtos',
        'Localizações ilimitadas',
        'Análises avançadas & relatórios',
        'Suporte prioritário (12h)'
      ]
    }
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    namePortuguese: 'Empresarial',
    price: 25,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: null, // Will be set after Stripe setup
    features: {
      users: -1, // unlimited
      products: -1, // unlimited
      locations: -1, // unlimited
      clients: -1, // unlimited
      suppliers: -1, // unlimited
      quotations: -1, // unlimited
      invoices: -1, // unlimited
      purchaseOrders: -1, // unlimited
      emailIntegration: true,
      calendarIntegration: true,
      advancedAnalytics: true,
      apiAccess: true,
      support: 'dedicated'
    },
    description: {
      en: 'Complete solution for large enterprises',
      pt: 'Solução completa para grandes empresas'
    },
    highlights: {
      en: [
        'Unlimited users',
        'Unlimited products',
        'Unlimited locations',
        'API access & integrations',
        'Dedicated account manager',
        'Phone support'
      ],
      pt: [
        'Utilizadores ilimitados',
        'Produtos ilimitados',
        'Localizações ilimitadas',
        'Acesso à API & integrações',
        'Gestor de conta dedicado',
        'Suporte por telefone'
      ]
    }
  }
};

// Helper function to get plan by ID
export const getPlan = (planId) => {
  return PLANS[planId] || PLANS.free;
};

// Helper function to check if feature is available
export const hasFeature = (plan, feature) => {
  const planConfig = getPlan(plan);
  return planConfig.features[feature] || false;
};

// Helper function to get feature limit
export const getFeatureLimit = (plan, feature) => {
  const planConfig = getPlan(plan);
  return planConfig.features[feature];
};

// Helper function to check if limit is reached
export const isLimitReached = (plan, feature, currentUsage) => {
  const limit = getFeatureLimit(plan, feature);

  // -1 means unlimited
  if (limit === -1) return false;

  return currentUsage >= limit;
};

// Get all plans as array
export const getAllPlans = () => {
  return Object.values(PLANS);
};

// Promo code discount types
export const PROMO_CODE_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_TRIAL: 'free_trial'
};

// Promo code duration types
export const PROMO_DURATION = {
  ONCE: 'once',
  REPEATING: 'repeating',
  FOREVER: 'forever'
};
