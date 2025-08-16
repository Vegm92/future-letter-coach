# Supabase Edge Functions - FutureLetter AI

This directory contains the standardized Edge Functions for the FutureLetter AI application. All functions now use shared utilities for consistent JWT verification, input validation, error handling, and response formatting.

## 🏗️ Architecture Overview

### Shared Utilities (`_shared/utils.ts`)

- **JWT Verification**: Consistent authentication across all functions
- **Input Validation**: Zod-based schema validation
- **Error Handling**: Standardized error response format
- **Response Formatting**: Consistent success/error response structure
- **OpenAI Integration**: Centralized AI API calls
- **Logging**: Structured logging for debugging and monitoring

### Standard Response Format

#### Success Response

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔐 Authentication

All Edge Functions now require JWT authentication. Include the authorization header in your requests:

```bash
Authorization: Bearer <your-jwt-token>
```

## 📡 API Endpoints

### 1. Letter Enhancement (`/enhance-letter`)

**Purpose**: Enhance letters and optionally generate milestone suggestions

**Method**: `POST`

**Request Body**:

```json
{
  "title": "Optional letter title",
  "goal": "Optional goal description",
  "content": "Optional letter content",
  "send_date": "Optional send date (YYYY-MM-DD)",
  "includeMilestones": true
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "enhancedLetter": {
      "title": "Enhanced title",
      "goal": "SMART goal",
      "content": "Enhanced content"
    },
    "suggestedMilestones": [
      {
        "title": "Milestone title",
        "percentage": 25,
        "target_date": "2024-01-15",
        "description": "Milestone description"
      }
    ]
  }
}
```

**Error Codes**:

- `UNAUTHORIZED`: Authentication required
- `VALIDATION_ERROR`: Input validation failed
- `CONFIGURATION_ERROR`: OpenAI API key not configured
- `OPENAI_API_ERROR`: OpenAI API call failed
- `INTERNAL_ERROR`: Unexpected server error

### 2. Goal Enhancement (`/enhance-goal`)

**Purpose**: Transform vague goals into SMART goals

**Method**: `POST`

**Request Body**:

```json
{
  "goal": "Your goal description"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "enhancedGoal": "Specific, measurable, achievable, relevant, time-bound goal"
  }
}
```

**Error Codes**: Same as letter enhancement

### 3. Milestone Suggestions (`/suggest-milestones`)

**Purpose**: Generate milestone suggestions for a specific goal

**Method**: `POST`

**Request Body**:

```json
{
  "letterId": "uuid",
  "goal": "Goal description",
  "content": "Optional additional context",
  "sendDate": "2024-01-15"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "suggestedMilestones": [
      {
        "title": "Milestone title",
        "percentage": 25,
        "target_date": "2024-01-15",
        "description": "Milestone description"
      }
    ]
  }
}
```

**Error Codes**: Same as letter enhancement

### 4. Letter Delivery (`/trigger-letter-delivery`)

**Purpose**: Schedule or send letters via email

**Method**: `POST`

**Request Body**:

```json
{
  "letterId": "uuid",
  "action": "schedule" | "send"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "Letter scheduled/sent successfully",
    "newStatus": "scheduled" | "sent",
    "emailSent": true
  }
}
```

**Error Codes**:

- `UNAUTHORIZED`: Authentication required
- `VALIDATION_ERROR`: Input validation failed
- `LETTER_NOT_FOUND`: Letter not found
- `FORBIDDEN`: Access denied to letter
- `USER_NOT_FOUND`: User profile not found
- `CONFIGURATION_ERROR`: Missing API keys
- `NOTIFICATION_ERROR`: Failed to create notification
- `UPDATE_ERROR`: Failed to update letter status
- `INTERNAL_ERROR`: Unexpected server error

## 🚀 Deployment

### Prerequisites

- Supabase CLI installed
- OpenAI API key configured
- Resend API key configured (for email delivery)

### Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy enhance-letter

# Deploy with environment variables
supabase functions deploy --env-file .env
```

## 🔧 Development

### Local Development

```bash
# Start Supabase locally
supabase start

# Deploy functions locally
supabase functions serve

# Test functions
curl -X POST http://localhost:54321/functions/v1/enhance-letter \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "goal": "Test goal"}'
```

### Testing

Each function includes comprehensive error handling and logging. Check the function logs in the Supabase dashboard for debugging information.

## 📊 Monitoring

### Logging

All functions use structured logging with:

- Function call details
- Input parameters
- Success/failure results
- Error details with stack traces

### Error Tracking

Standardized error codes and messages for easy monitoring and alerting.

## 🔒 Security Features

- **JWT Verification**: All functions verify authentication
- **Row Level Security**: Database-level access control
- **Input Validation**: Zod schema validation
- **User Isolation**: Users can only access their own data
- **CORS Protection**: Proper CORS headers

## 🚨 Breaking Changes

### From Previous Version

1. **Authentication Required**: All functions now require JWT tokens
2. **Response Format**: Standardized success/error response structure
3. **Input Validation**: Strict input validation with Zod schemas
4. **Consolidated Functions**: `enhance-letter-complete` merged into `enhance-letter`

### Migration Guide

1. Add `Authorization: Bearer <token>` header to all requests
2. Update response handling to use new format
3. Ensure input data matches validation schemas
4. Use `includeMilestones` flag for milestone generation

## 🤝 Contributing

When adding new functions:

1. Use shared utilities from `_shared/utils.ts`
2. Implement proper JWT verification
3. Add input validation with Zod schemas
4. Use standardized error handling
5. Include comprehensive logging
6. Update this README with endpoint documentation
