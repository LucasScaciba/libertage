import twilio from 'twilio';

export interface OTPSendResult {
  success: boolean;
  sid?: string;
  error?: TwilioError;
}

export interface OTPVerifyResult {
  success: boolean;
  valid: boolean;
  error?: TwilioError;
}

export interface TwilioError {
  code: number;
  message: string;
  status: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_PHONE: 'Formato de telefone inválido. Use o formato internacional (+55...)',
  INVALID_OTP: 'Código inválido',
  EXPIRED_OTP: 'Código expirado',
  RATE_LIMIT: 'Limite de tentativas atingido. Tente novamente amanhã',
  COOLDOWN: 'Aguarde {seconds} segundos antes de solicitar novo código',
  SERVICE_ERROR: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos'
};

export class OTPService {
  private client: twilio.Twilio;
  private verifyServiceSid: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || '';

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    if (!this.verifyServiceSid) {
      console.warn('TWILIO_VERIFY_SERVICE_SID not configured. OTP service will not work.');
    }

    this.client = twilio(accountSid, authToken);
  }

  /**
   * Sends an OTP code to the specified phone number via SMS
   * @param phoneNumber - Phone number in E.164 format
   * @returns Result with success status and verification SID
   */
  async sendOTP(phoneNumber: string): Promise<OTPSendResult> {
    try {
      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications
        .create({
          to: phoneNumber,
          channel: 'sms',
          locale: 'pt-BR'
        });

      // Log the OTP send event
      console.log(`OTP sent to ${phoneNumber}, SID: ${verification.sid}`);

      return {
        success: true,
        sid: verification.sid
      };
    } catch (error: any) {
      // Log the error
      console.error('Twilio OTP send error:', {
        code: error.code,
        message: error.message,
        status: error.status,
        phoneNumber
      });

      return {
        success: false,
        error: this.mapTwilioError(error)
      };
    }
  }

  /**
   * Verifies an OTP code for the specified phone number
   * @param phoneNumber - Phone number in E.164 format
   * @param code - 6-digit OTP code
   * @returns Result with success status and validity
   */
  async verifyOTP(phoneNumber: string, code: string): Promise<OTPVerifyResult> {
    try {
      const verificationCheck = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks
        .create({
          to: phoneNumber,
          code: code
        });

      const isValid = verificationCheck.status === 'approved';

      // Log the verification attempt
      console.log(`OTP verification for ${phoneNumber}: ${isValid ? 'valid' : 'invalid'}`);

      return {
        success: true,
        valid: isValid
      };
    } catch (error: any) {
      // Log the error
      console.error('Twilio OTP verify error:', {
        code: error.code,
        message: error.message,
        status: error.status,
        phoneNumber
      });

      return {
        success: false,
        valid: false,
        error: this.mapTwilioError(error)
      };
    }
  }

  /**
   * Maps Twilio error codes to user-friendly error types
   * @param error - Twilio error object
   * @returns Mapped error with user-friendly message type
   */
  private mapTwilioError(error: any): TwilioError {
    const errorCode = error.code;
    let errorType: string;

    switch (errorCode) {
      case 20429: // Rate limit exceeded
        errorType = 'SERVICE_ERROR';
        break;
      case 21211: // Invalid phone number
        errorType = 'INVALID_PHONE';
        break;
      case 21608: // Unverified phone number (trial account)
        errorType = 'SERVICE_ERROR';
        break;
      case 60200: // Invalid verification code
        errorType = 'INVALID_OTP';
        break;
      case 60202: // Max check attempts reached
        errorType = 'EXPIRED_OTP';
        break;
      case 60203: // Verification expired
        errorType = 'EXPIRED_OTP';
        break;
      case 60205: // SMS not sent
        errorType = 'SERVICE_ERROR';
        break;
      default:
        errorType = 'SERVICE_ERROR';
    }

    return {
      code: errorCode,
      message: ERROR_MESSAGES[errorType],
      status: error.status || 500
    };
  }

  /**
   * Gets a user-friendly error message for an error type
   * @param errorType - Error type key
   * @param params - Optional parameters for message interpolation
   * @returns User-friendly error message in Portuguese
   */
  static getErrorMessage(errorType: string, params?: Record<string, any>): string {
    let message = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.SERVICE_ERROR;
    
    // Replace placeholders with actual values
    if (params) {
      Object.keys(params).forEach(key => {
        message = message.replace(`{${key}}`, params[key]);
      });
    }

    return message;
  }
}
