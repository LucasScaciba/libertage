# Twilio Verify Service Setup

This document explains how to create and configure a Twilio Verify service for phone validation.

## Prerequisites

- Twilio account (sign up at https://www.twilio.com/try-twilio)
- TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN already configured

## Steps to Create Verify Service

### 1. Access Twilio Console

1. Log in to your Twilio Console: https://console.twilio.com/
2. Navigate to **Verify** > **Services** in the left sidebar
3. Click **Create new service**

### 2. Configure Service Settings

**Service Name**: Enter a friendly name (e.g., "Premium Service Marketplace - Phone Validation")

**Channel Configuration**:
- Enable **SMS** channel (required)
- Optionally enable **Voice** as fallback
- Disable other channels unless needed

**Code Length**: 6 digits (default, recommended)

**Code Expiration**: 10 minutes (default, recommended)

**Locale**: Select **Portuguese (Brazil) - pt-BR** for SMS messages in Portuguese

### 3. Get Service SID

After creating the service:
1. Copy the **Service SID** (format: `VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
2. Add it to your `.env.local` file:

```bash
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Test the Service

You can test the service using Twilio's test credentials:

**Test Phone Numbers** (for development):
- `+15005550006` - Valid phone number (will receive OTP)
- `+15005550001` - Invalid phone number
- `+15005550007` - Phone number that cannot receive SMS

**Test OTP Code**: Any 6-digit code will work with test credentials

### 5. Production Configuration

For production:
1. Upgrade your Twilio account (remove trial restrictions)
2. Verify your Twilio phone number
3. Configure rate limiting in Twilio Console:
   - Navigate to **Verify** > **Services** > Your Service > **Rate Limits**
   - Set appropriate limits (e.g., 5 verifications per phone per hour)
4. Enable fraud detection:
   - Navigate to **Verify** > **Services** > Your Service > **Fraud Guard**
   - Enable fraud detection features

### 6. Monitoring

Monitor your Verify service usage:
1. Go to **Verify** > **Services** > Your Service > **Logs**
2. View verification attempts, success rates, and errors
3. Set up alerts for high error rates or unusual activity

## Environment Variables Summary

After setup, your `.env.local` should have:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Troubleshooting

**Error: "Service not found"**
- Verify the TWILIO_VERIFY_SERVICE_SID is correct
- Ensure the service is active in Twilio Console

**Error: "Unverified phone number"**
- This occurs with trial accounts
- Add phone numbers to verified list in Twilio Console
- Or upgrade to paid account

**SMS not delivered**
- Check phone number format (must be E.164: +5511999999999)
- Verify SMS channel is enabled in service settings
- Check Twilio logs for delivery status

## Cost Estimation

Twilio Verify pricing (as of 2024):
- SMS verification: ~$0.05 per verification attempt
- Voice verification: ~$0.10 per verification attempt

For 1000 users validating phones:
- Cost: ~$50 USD (SMS only)
- With 20% retry rate: ~$60 USD

## Security Best Practices

1. **Never commit** Twilio credentials to version control
2. **Rotate** auth tokens regularly
3. **Enable** fraud detection in production
4. **Monitor** for unusual verification patterns
5. **Set** rate limits to prevent abuse
6. **Use** HTTPS for all API calls
7. **Log** all verification attempts for audit trail

## Additional Resources

- Twilio Verify API Documentation: https://www.twilio.com/docs/verify/api
- Twilio Verify Quickstart: https://www.twilio.com/docs/verify/quickstarts
- Twilio Console: https://console.twilio.com/
