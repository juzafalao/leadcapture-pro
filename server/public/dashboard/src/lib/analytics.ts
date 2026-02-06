import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST as string | undefined;
const IS_DEV = import.meta.env.DEV as boolean;

if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (ph) => {
      if (IS_DEV) {
        console.log('✅ PostHog inicializado');
      }
    },
  });
}

const isPostHogEnabled = typeof window !== 'undefined' && !!POSTHOG_KEY;

export const analytics = {
  init: () => {
    // Inicialização já feita acima
    if (IS_DEV) {
      console.log('🚀 Analytics iniciado');
    }
  },

  landingViewed: () => {
    if (isPostHogEnabled) {
      posthog.capture('landing_viewed');
    } else {
      console.log('📊 Event: landing_viewed');
    }
  },

  ctaClicked: (location: string) => {
    if (isPostHogEnabled) {
      posthog.capture('cta_clicked', { location });
    } else {
      console.log('📊 Event: cta_clicked', { location });
    }
  },

  signupStarted: () => {
    if (isPostHogEnabled) {
      posthog.capture('signup_started');
    } else {
      console.log('📊 Event: signup_started');
    }
  },

  signupCompleted: (method: string) => {
    if (isPostHogEnabled) {
      posthog.capture('signup_completed', { method });
    } else {
      console.log('📊 Event: signup_completed', { method });
    }
  },

  signupFailed: (error: string) => {
    if (isPostHogEnabled) {
      posthog.capture('signup_failed', { error });
    } else {
      console.log('📊 Event: signup_failed', { error });
    }
  },

  firstLeadCreated: () => {
    if (isPostHogEnabled) {
      posthog.capture('first_lead_created');
    } else {
      console.log('📊 Event: first_lead_created');
    }
  },

  firstLeadQualified: (score: number, status: string) => {
    if (isPostHogEnabled) {
      posthog.capture('first_lead_qualified', { score, status });
    } else {
      console.log('📊 Event: first_lead_qualified', { score, status });
    }
  },

  leadViewed: (leadId: string) => {
    if (isPostHogEnabled) {
      posthog.capture('lead_viewed', { leadId });
    } else {
      console.log('📊 Event: lead_viewed', { leadId });
    }
  },

  leadStatusChanged: (from: string, to: string) => {
    if (isPostHogEnabled) {
      posthog.capture('lead_status_changed', { from, to });
    } else {
      console.log('📊 Event: lead_status_changed', { from, to });
    }
  },

  dailyActive: () => {
    if (isPostHogEnabled) {
      posthog.capture('daily_active_user');
    } else {
      console.log('📊 Event: daily_active_user');
    }
  },

  identify: (userId: string, properties?: Record<string, any>) => {
    if (isPostHogEnabled) {
      posthog.identify(userId, properties);
    } else {
      console.log('🔍 Usuário identificado:', userId, properties);
    }
  },

  reset: () => {
    if (isPostHogEnabled) {
      posthog.reset();
    } else {
      console.log('🔄 Reset analytics');
    }
  },
};

export default analytics;