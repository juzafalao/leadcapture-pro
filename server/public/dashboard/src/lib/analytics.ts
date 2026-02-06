import posthog from 'posthog-js';

export type AnalyticsEvent = 
  | 'landing_viewed'
  | 'cta_clicked'
  | 'pricing_viewed'
  | 'demo_video_played'
  | 'signup_started'
  | 'signup_completed'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'first_lead_created'
  | 'first_lead_qualified'
  | 'first_lead_contacted'
  | 'lead_created'
  | 'lead_viewed'
  | 'lead_updated'
  | 'lead_deleted'
  | 'lead_assigned'
  | 'lead_status_changed'
  | 'filter_applied'
  | 'search_performed'
  | 'kpi_filter_changed'
  | 'meus_leads_toggled'
  | 'dashboard_viewed'
  | 'lead_modal_opened'
  | 'lead_timeline_viewed'
  | 'whatsapp_notification_sent'
  | 'tenant_configured'
  | 'team_member_invited'
  | 'integration_connected'
  | 'webhook_configured'
  | 'pricing_page_viewed'
  | 'checkout_started'
  | 'payment_completed'
  | 'subscription_cancelled'
  | 'subscription_upgraded';

interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  private initialized = false;

  init() {
    if (this.initialized) return;
    if (typeof window === 'undefined') return;
    
    const key = import.meta.env.VITE_POSTHOG_KEY;
    const host = import.meta.env.VITE_POSTHOG_HOST;

    if (!key) {
      console.warn('⚠️ PostHog key não encontrada. Analytics desabilitado.');
      return;
    }

    posthog.init(key, {
      api_host: host || 'https://app.posthog.com',
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          console.log('✅ PostHog inicializado');
        }
      },
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
      session_recording: {
        enabled: true,
        maskAllInputs: true,
        maskTextSelector: '[data-sensitive]',
      },
    });

    this.initialized = true;
  }

  identify(userId: string, properties?: {
    email?: string;
    nome?: string;
    role?: string;
    tenant_id?: string;
    [key: string]: any;
  }) {
    if (!this.initialized) return;
    posthog.identify(userId, properties);
    if (import.meta.env.DEV) {
      console.log('🔍 Usuário identificado:', userId, properties);
    }
  }

  reset() {
    if (!this.initialized) return;
    posthog.reset();
  }

  track(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    if (!this.initialized) return;
    posthog.capture(event, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
    if (import.meta.env.DEV) {
      console.log('📊 Evento:', event, properties);
    }
  }

  setUserProperties(properties: AnalyticsProperties) {
    if (!this.initialized) return;
    posthog.people.set(properties);
  }

  incrementProperty(property: string, value: number = 1) {
    if (!this.initialized) return;
    posthog.people.increment(property, value);
  }

  isFeatureEnabled(flag: string): boolean {
    if (!this.initialized) return false;
    return posthog.isFeatureEnabled(flag) || false;
  }

  captureException(error: Error, context?: AnalyticsProperties) {
    if (!this.initialized) return;
    posthog.capture('$exception', {
      $exception_message: error.message,
      $exception_type: error.name,
      $exception_stack: error.stack,
      ...context,
    });
  }
}

export const analytics = new Analytics();

export const trackEvent = {
  landingViewed: () => analytics.track('landing_viewed'),
  ctaClicked: (location: string) => analytics.track('cta_clicked', { location }),
  pricingViewed: () => analytics.track('pricing_viewed'),
  demoVideoPlayed: () => analytics.track('demo_video_played'),

  signupStarted: () => analytics.track('signup_started'),
  signupCompleted: (method: 'email' | 'google' | 'github') => analytics.track('signup_completed', { method }),
  loginSuccess: () => analytics.track('login_success'),
  loginFailed: (reason: string) => analytics.track('login_failed', { reason }),
  logout: () => analytics.track('logout'),

  onboardingStarted: () => analytics.track('onboarding_started'),
  onboardingStepCompleted: (step: number, stepName: string) => analytics.track('onboarding_step_completed', { step, stepName }),
  onboardingCompleted: () => analytics.track('onboarding_completed'),
  onboardingSkipped: () => analytics.track('onboarding_skipped'),

  firstLeadCreated: (leadId: string, source: string) => analytics.track('first_lead_created', { leadId, source }),
  firstLeadQualified: (leadId: string, score: number) => analytics.track('first_lead_qualified', { leadId, score }),

  leadCreated: (leadId: string, source: string) => analytics.track('lead_created', { leadId, source }),
  leadViewed: (leadId: string) => analytics.track('lead_viewed', { leadId }),
  leadUpdated: (leadId: string, fields: string[]) => analytics.track('lead_updated', { leadId, fields: fields.join(',') }),
  leadDeleted: (leadId: string) => analytics.track('lead_deleted', { leadId }),
  leadAssigned: (leadId: string, operadorId: string) => analytics.track('lead_assigned', { leadId, operadorId }),
  leadStatusChanged: (leadId: string, oldStatus: string, newStatus: string) => analytics.track('lead_status_changed', { leadId, oldStatus, newStatus }),

  filterApplied: (filterType: string, value: string) => analytics.track('filter_applied', { filterType, value }),
  searchPerformed: (query: string, resultsCount: number) => analytics.track('search_performed', { query, resultsCount }),
  kpiFilterChanged: (from: string, to: string) => analytics.track('kpi_filter_changed', { from, to }),
  meusLeadsToggled: (enabled: boolean, leadsCount: number) => analytics.track('meus_leads_toggled', { enabled, leadsCount }),

  dashboardViewed: () => analytics.track('dashboard_viewed'),
  leadModalOpened: (leadId: string | null) => analytics.track('lead_modal_opened', { leadId, isNew: !leadId }),
  leadTimelineViewed: (leadId: string) => analytics.track('lead_timeline_viewed', { leadId }),

  tenantConfigured: () => analytics.track('tenant_configured'),
  teamMemberInvited: (email: string, role: string) => analytics.track('team_member_invited', { email, role }),

  pricingPageViewed: () => analytics.track('pricing_page_viewed'),
  checkoutStarted: (plan: string, amount: number) => analytics.track('checkout_started', { plan, amount }),
  paymentCompleted: (plan: string, amount: number) => analytics.track('payment_completed', { plan, amount }),
};

export default analytics;
