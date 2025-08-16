export const FORM_FIELDS = ['title', 'goal', 'content'] as const;
export type FieldType = typeof FORM_FIELDS[number];

export const ENHANCEMENT_CONFIG = {
  CACHE_EXPIRATION_HOURS: 1,
  APPLY_FIELD_DELAY: 300,
  APPLY_MILESTONES_DELAY: 500,
  FUNCTION_NAME: 'enhance-letter-complete'
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: {
    title: "Network Error",
    description: "Please check your internet connection and try again."
  },
  SERVICE_UNAVAILABLE: {
    title: "Service Temporarily Unavailable", 
    description: "The enhancement service is currently unavailable. Please try again in a few moments."
  },
  RATE_LIMIT: {
    title: "Rate Limit Exceeded",
    description: "Too many enhancement requests. Please wait a moment before trying again."
  },
  AUTHENTICATION: {
    title: "Authentication Error",
    description: "Please refresh the page and try again."
  },
  FIELD_APPLICATION_FAILED: {
    title: "Failed to Apply Enhancement",
    description: "The form may be locked or there was a validation error."
  },
  MILESTONE_APPLICATION_FAILED: {
    title: "Failed to Apply Milestones",
    description: "There may be a validation error or the form is locked."
  },
  ENHANCEMENT_FAILED: {
    title: "Enhancement Failed",
    description: "Unable to enhance your letter. Please try again."
  },
  ENHANCEMENT_SUCCESS: {
    title: "✨ Letter Enhanced!",
    description: "Your letter has been enhanced with AI. Review the suggestions below."
  },
  FIELD_APPLIED: {
    title: "✅ Enhancement Applied",
    description: "Updated with AI suggestion."
  },
  MILESTONES_APPLIED: {
    title: "✅ Milestones Applied",
    description: "Added suggested milestones."
  }
} as const;
