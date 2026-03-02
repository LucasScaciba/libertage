import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Make Twilio client optional - will be null if credentials not configured
export const twilioClient = accountSid && authToken 
  ? twilio(accountSid, authToken)
  : null;
