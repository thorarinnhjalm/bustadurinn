# Bústaðurinn.is API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Bústaðurinn.is application.

## Base URL

- **Production**: `https://bustadurinn.is/api/`
- **Development**: `http://localhost:5001/api/`

## Authentication

Most API endpoints require authentication via Firebase ID tokens.

### Authentication Header

```
Authorization: Bearer <firebase-id-token>
```

### Authentication Errors

| Status Code | Error | Description |
|-------------|-------|-------------|
| `401` | Unauthorized | Missing or invalid authorization header |
| `403` | Forbidden | Valid token but insufficient permissions |

---

## Endpoints

### 1. User Management

#### POST `/api/join-house`

Join a house using an invite code or token.

**Authentication**: Required

**Request Body**:
```json
{
  "houseId": "string",
  "inviteCode": "string (optional)",
  "token": "string (optional)"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Joined house successfully"
}
```

**Error Responses**:
- `400`: Missing required fields or invalid invite
- `404`: Invalid or expired token
- `500`: Internal server error

---

#### POST `/api/invite-member`

Invite a member to a house (creates invitation or adds existing user).

**Authentication**: Required

**Request Body**:
```json
{
  "email": "user@example.com",
  "houseId": "string",
  "houseName": "string",
  "senderName": "string",
  "senderUid": "string"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Existing user added and notified." | "Invitation sent to new user."
}
```

**Error Responses**:
- `400`: Missing fields, user already member, or invalid input
- `403`: Forbidden - only house owners/managers can invite
- `404`: House not found
- `500`: Internal server error

---

#### POST `/api/admin-delete-user`

Delete a user account (super admin only).

**Authentication**: Required (super_admin role)

**Request Body**:
```json
{
  "userId": "string"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "User deleted successfully",
  "userId": "string"
}
```

**Error Responses**:
- `400`: Missing userId
- `403`: Admin access required
- `404`: User not found
- `500`: Internal server error

---

### 2. Email Service

#### POST `/api/send-email`

Send templated emails using Firestore templates.

**Authentication**: Required

**Request Body**:
```json
{
  "templateId": "string",
  "to": "string | string[]",
  "variables": {
    "variableName": "value"
  }
}
```

**Available Templates**:
- `welcome` - Welcome email for new users
- `general_notification` - Generic notification template
- `onboarding_complete` - Onboarding completion email
- `trial_ending` - Trial expiration reminder

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "email-id"
  }
}
```

**Error Responses**:
- `400`: Missing templateId/recipient or template inactive
- `404`: Template not found
- `500`: Internal server error

---

#### POST `/api/send-invite`

Send bulk invitation emails.

**Authentication**: Not required (public endpoint)

**Request Body**:
```json
{
  "emails": "comma,separated,emails",
  "houseName": "string",
  "houseId": "string",
  "inviteCode": "string",
  "senderName": "string"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "batch-email-id"
  }
}
```

**Error Responses**:
- `400`: Missing fields or no valid emails
- `500`: Internal server error

---

### 3. Contact & Feedback

#### POST `/api/contact`

Submit contact form message.

**Authentication**: Not required

**Rate Limit**: 5 requests per hour per IP

**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "message": "string"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

**Error Responses**:
- `400`: Missing required fields or validation error
- `429`: Rate limit exceeded
- `500`: Internal server error

---

### 4. Push Notifications

#### POST `/api/push-notification`

Send push notifications to multiple devices.

**Authentication**: Not explicitly enforced (internal use)

**Request Body**:
```json
{
  "tokens": ["fcm-token-1", "fcm-token-2"],
  "title": "string",
  "body": "string",
  "data": {
    "link": "https://bustadurinn.is/dashboard"
  }
}
```

**Success Response** (200):
```json
{
  "success": true,
  "successCount": 2,
  "failureCount": 0
}
```

**Error Responses**:
- `500`: Failed to send notification

---

### 5. Payment Integration

#### POST `/api/payday-create-invoice`

Create invoice via Payday API.

**Authentication**: Required

**Rate Limit**: 5 requests per hour per user

**Request Body**:
```json
{
  "customerId": "string",
  "lineItems": [
    {
      "description": "string (max 500 chars)",
      "quantity": "number (1-10000)",
      "unitPrice": "number (0-10000000)",
      "discount": "number (0-100, optional)"
    }
  ],
  "dueDate": "YYYY-MM-DD",
  "issueDate": "YYYY-MM-DD"
}
```

**Validation Rules**:
- Maximum 100 line items per invoice
- Description required (max 500 characters)
- Quantity between 1 and 10,000
- Unit price between 0 and 10,000,000
- Discount between 0 and 100%

**Success Response** (200):
```json
{
  "success": true,
  "invoiceId": "string",
  "invoiceNumber": "string"
}
```

**Error Responses**:
- `400`: Validation error or missing fields
- `429`: Rate limit exceeded
- `500`: Internal server error

---

### 6. Cron Jobs

#### GET `/api/cron/trial-reminders`

Send trial expiration reminders (7 days before expiry).

**Authentication**: Required (Cron secret via Authorization header)

**Request Headers**:
```
Authorization: Bearer <CRON_SECRET>
```

**Success Response** (200):
```json
{
  "success": true,
  "emailsSent": 3,
  "housesChecked": 5,
  "timestamp": "2026-01-21T22:00:00.000Z"
}
```

**Error Responses**:
- `401`: Unauthorized (invalid cron secret)
- `500`: Internal server error

---

## Security Features

### Rate Limiting

Rate limits are implemented using Upstash Redis with fail-closed behavior:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/contact` | 5 requests | 1 hour (per IP) |
| `/api/send-email` | 10 requests | 1 hour (per user) |
| `/api/payday-create-invoice` | 5 requests | 1 hour (per user) |

**Rate Limit Response** (429):
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "remaining": 0
}
```

**Service Unavailable** (503):
```json
{
  "error": "Service temporarily unavailable",
  "message": "Rate limiting service temporarily unavailable. Please try again shortly."
}
```

### HTML Sanitization

All user-controlled input in emails is sanitized using DOMPurify with `ALLOWED_TAGS: []` to prevent XSS attacks:

- User names
- House names
- Custom messages
- Template variables

### RBAC (Role-Based Access Control)

#### System Roles

| Role | Permissions |
|------|-------------|
| `super_admin` | All permissions (wildcard) |
| `support_admin` | view_all_houses, view_analytics |
| `regular_user` | No system permissions |

#### House Roles

| Role | Permissions |
|------|-------------|
| `owner` | All house permissions including delete_house |
| `admin` | Manage members, settings, tasks, finances (no delete) |
| `member` | Create bookings/tasks, view finances |
| `viewer` | No permissions (read-only implied by app logic) |

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "code": "error_code (optional)"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `rate_limit_exceeded` | Too many requests |
| `validation_error` | Input validation failed |
| `internal_server_error` | Unexpected server error |

### Development vs Production

In production mode (`NODE_ENV=production`):
- Stack traces are NOT exposed
- Generic error messages are returned
- Detailed errors logged server-side only

---

## Firebase Admin SDK

All API endpoints use centralized Firebase Admin initialization via `api/utils/firebaseAdmin.ts`:

```typescript
import { initializeFirebaseAdmin, admin, db, auth } from './utils/firebaseAdmin';

// Auto-initialized on import
// Use exported db, auth, admin instances
```

---

## Testing

### Running Tests

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### Test Coverage

- **RBAC Tests**: 21 tests covering all permission scenarios
- **Email Sanitization Tests**: 29 tests covering XSS prevention
- **Component Tests**: Error boundaries, hooks, utilities

---

## Rate Limiter Configuration

### Environment Variables

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Behavior

- **Fail-Closed**: Returns 503 when Redis is unavailable
- **Analytics**: Tracks rate limit hits for monitoring
- **Sliding Window**: Prevents burst attacks

---

## Deployment Checklist

Before deploying API changes:

1. ✅ Run `npm run build` - verify no TypeScript errors
2. ✅ Run `npm test` - ensure all tests pass
3. ✅ Check environment variables are set
4. ✅ Verify rate limiting is configured
5. ✅ Test authentication flows
6. ✅ Review error handling for production mode

---

## Support

For API issues or questions:
- **Email**: hjalp@bustadurinn.is
- **GitHub Issues**: [Report a bug](https://github.com/your-repo/issues)

---

## Changelog

### 2026-01-21
- Consolidated Firebase Admin SDK across all API endpoints
- Implemented fail-closed rate limiting
- Added comprehensive XSS prevention via DOMPurify
- Fixed RBAC hierarchical permission checking
- Enhanced error handling and validation

### Previous
- Initial API implementation
- Firebase integration
- Email templating system
- Payday payment integration
