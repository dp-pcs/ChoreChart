# Forgot Password Implementation

This document describes the implementation of the forgot password functionality for the ChoreChart application.

## Overview

The forgot password feature allows users to reset their passwords via email. The implementation includes:

1. **Database Schema Updates**: Added `resetToken` and `resetTokenExpiry` fields to the User model
2. **API Routes**: Created endpoints for requesting password reset and resetting passwords
3. **UI Components**: Built user-friendly pages for the forgot password flow
4. **Email Integration**: Configured email sending for password reset links

## Files Created/Modified

### Database Schema
- `web/prisma/schema.prisma` - Added password reset fields to User model

### API Routes
- `web/src/app/api/auth/forgot-password/route.ts` - Handles password reset requests
- `web/src/app/api/auth/reset-password/route.ts` - Handles password reset confirmation

### UI Pages
- `web/src/app/auth/forgot-password/page.tsx` - Forgot password form
- `web/src/app/auth/reset-password/page.tsx` - Reset password form
- `web/src/app/auth/signin/page.tsx` - Added "Forgot Password" link

### Configuration
- `web/.env.local` - Environment variables for database and email
- `web/package.json` - Added nodemailer dependency

## Setup Instructions

### 1. Database Migration

Run the Prisma migration to add password reset fields:

```bash
cd web
npx prisma migrate dev --name add_password_reset_fields
```

### 2. Environment Variables

Update your `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chorechart?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/chorechart?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@chorechart.com"
```

### 3. Email Service Setup

#### Option 1: Gmail (Recommended for Development)
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: Google Account → Security → App passwords
3. Use your Gmail address as `SMTP_USER` and the app password as `SMTP_PASSWORD`

#### Option 2: SendGrid (Recommended for Production)
1. Sign up for SendGrid and get an API key
2. Update the email configuration in `forgot-password/route.ts` to use SendGrid

#### Option 3: Other Email Services
- Mailgun, AWS SES, or any SMTP provider can be used
- Update the SMTP configuration accordingly

### 4. Install Dependencies

The nodemailer package should already be installed, but if not:

```bash
cd web
npm install nodemailer @types/nodemailer
```

## Usage Flow

### For Users:
1. **Request Password Reset**: Go to `/auth/forgot-password` or click "Forgot password?" on the sign-in page
2. **Enter Email**: Submit the form with their email address
3. **Check Email**: Receive a password reset email with a secure link
4. **Reset Password**: Click the link to go to `/auth/reset-password` and set a new password
5. **Sign In**: Use the new password to sign in

### For Developers:
1. **Forgot Password API**: `POST /api/auth/forgot-password` with `{ email }`
2. **Reset Password API**: `POST /api/auth/reset-password` with `{ token, password }`

## Security Features

1. **Token-based**: Uses cryptographically secure random tokens
2. **Time-limited**: Reset tokens expire after 1 hour
3. **Single-use**: Tokens are cleared after successful password reset
4. **Email verification**: Only sends reset links to existing email addresses
5. **No user enumeration**: Doesn't reveal whether an email exists in the system

## Email Template

The password reset email includes:
- ChoreChart branding
- Clear call-to-action button
- Fallback link for accessibility
- Security information about token expiration
- Professional styling with gradients matching the app design

## Error Handling

The implementation includes comprehensive error handling for:
- Invalid email addresses
- Expired or invalid tokens
- Network errors
- Database connectivity issues
- Email sending failures

## Testing

### Manual Testing:
1. Navigate to `http://localhost:3000/auth/forgot-password`
2. Enter a valid email address
3. Check your email for the reset link
4. Follow the link and set a new password
5. Sign in with the new password

### API Testing:
```bash
# Request password reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Reset password (with valid token)
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token-here","password":"newpassword123"}'
```

## Troubleshooting

### Common Issues:

1. **Email not sending**: Check SMTP configuration and credentials
2. **Token invalid**: Ensure the token hasn't expired (1 hour limit)
3. **Database errors**: Run `npx prisma generate` and ensure database is running
4. **CORS issues**: Ensure NEXTAUTH_URL is set correctly

### Debug Steps:
1. Check server logs for detailed error messages
2. Verify environment variables are loaded correctly
3. Test email configuration with a simple test email
4. Ensure database connection is working

## Production Considerations

1. **Email Service**: Use a production email service (SendGrid, AWS SES, etc.)
2. **Rate Limiting**: Implement rate limiting on password reset requests
3. **Monitoring**: Set up monitoring for failed email deliveries
4. **Security Headers**: Ensure proper security headers are configured
5. **SSL/TLS**: Use HTTPS in production for secure token transmission

## Future Enhancements

1. **Account Lockout**: Implement account lockout after multiple failed attempts
2. **Email Templates**: Create more sophisticated email templates
3. **SMS Reset**: Add SMS-based password reset option
4. **Audit Logging**: Log all password reset attempts for security auditing
5. **Multi-factor Authentication**: Add MFA support for enhanced security