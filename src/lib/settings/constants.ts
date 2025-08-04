// Settings-related constants and static data

export const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "British Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
] as const;

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español (Coming Soon)', disabled: true },
  { value: 'fr', label: 'Français (Coming Soon)', disabled: true },
  { value: 'de', label: 'Deutsch (Coming Soon)', disabled: true },
  { value: 'pt', label: 'Português (Coming Soon)', disabled: true },
  { value: 'ja', label: '日本語 (Coming Soon)', disabled: true },
] as const;

export const AI_TONES = [
  {
    value: 'casual',
    label: 'Casual',
    description: 'Friendly and relaxed'
  },
  {
    value: 'motivational',
    label: 'Motivational', 
    description: 'Inspiring and uplifting'
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Clear and focused'
  },
  {
    value: 'formal',
    label: 'Formal',
    description: 'Structured and formal'
  }
] as const;

export const TEXT_SIZES = [
  { value: 'small', label: 'Small', className: 'text-sm' },
  { value: 'normal', label: 'Normal', className: '' },
  { value: 'large', label: 'Large', className: 'text-lg' },
] as const;

export const PRIVACY_LEVELS = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see your letters',
    icon: 'EyeOff'
  },
  {
    value: 'shared',
    label: 'Shared',
    description: 'Visible to selected mentors or family',
    icon: 'Users'
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone with link can view (anonymized)',
    icon: 'Eye'
  }
] as const;

export const DEFAULT_SETTINGS = {
  SEND_DATE_OFFSET: 180, // 6 months in days
  LETTER_TEMPLATE: `Dear Future Me,

As I write this today...

Looking back, I hope...`,
  GOAL_FORMAT: `By the time you read this, I will have...

My main focus areas are:
1. 
2. 
3. `,
  AI_PREFERENCES: {
    enabled: true,
    tone: 'motivational' as const,
    auto_apply: false,
  },
  NOTIFICATION_PREFERENCES: {
    email: true,
    push: false,
    draft_reminders: true,
    delivery_alerts: true,
    enhancement_notifications: true,
    milestone_reminders: true,
  },
  ACCESSIBILITY_PREFERENCES: {
    high_contrast: false,
    text_size: 'normal' as const,
  },
  PRIVACY_SETTINGS: {
    letter_visibility: 'private' as const,
  },
} as const;