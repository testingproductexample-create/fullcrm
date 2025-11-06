import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { MFAHelper, PasswordSecurityHelper, AccountLockoutHelper, SessionManager, SecurityLogger } from '@/lib/auth-helpers';

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Helper function to get user agent
function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

// POST /api/auth/mfa/verify
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);

    switch (action) {
      case 'verify_totp':
        return await handleTOTPVerification(data, clientIP, userAgent);
      
      case 'send_sms_code':
        return await handleSendSMSCode(data, clientIP, userAgent);
      
      case 'send_email_code':
        return await handleSendEmailCode(data, clientIP, userAgent);
      
      case 'verify_sms_code':
      case 'verify_email_code':
        return await handleCodeVerification(data, clientIP, userAgent);
      
      case 'verify_backup_code':
        return await handleBackupCodeVerification(data, clientIP, userAgent);
      
      default:
        return NextResponse.json(
          { error: { code: 'INVALID_ACTION', message: 'Invalid action specified' } },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('MFA API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

async function handleTOTPVerification(data: any, clientIP: string, userAgent: string) {
  const { userId, code } = data;

  if (!userId || !code) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'User ID and code are required' } },
      { status: 400 }
    );
  }

  try {
    // Get user's TOTP secret
    const { data: mfaSettings, error } = await supabase
      .from('user_mfa_settings')
      .select('totp_secret')
      .eq('user_id', userId)
      .single();

    if (error || !mfaSettings?.totp_secret) {
      return NextResponse.json(
        { error: { code: 'TOTP_NOT_SETUP', message: 'TOTP not configured for user' } },
        { status: 400 }
      );
    }

    // Verify TOTP code
    const isValid = MFAHelper.verifyTOTPCode(mfaSettings.totp_secret, code);

    // Log attempt
    await supabase.from('mfa_attempts').insert({
      user_id: userId,
      method_type: 'totp',
      code_attempted: code,
      success: isValid,
      ip_address: clientIP,
      user_agent: userAgent,
    });

    if (isValid) {
      // Log successful MFA
      await SecurityLogger.createLog(
        userId,
        'mfa_success',
        { method: 'totp' },
        { ip_address: clientIP, user_agent: userAgent }
      );

      return NextResponse.json({
        success: true,
        data: { valid: true },
      });
    } else {
      // Log failed MFA
      await SecurityLogger.createLog(
        userId,
        'mfa_failed',
        { method: 'totp', reason: 'invalid_code' },
        { ip_address: clientIP, user_agent: userAgent }
      );

      return NextResponse.json(
        { error: { code: 'INVALID_CODE', message: 'Invalid verification code' } },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('TOTP verification error:', error);
    return NextResponse.json(
      { error: { code: 'VERIFICATION_ERROR', message: 'Failed to verify code' } },
      { status: 500 }
    );
  }
}

async function handleSendSMSCode(data: any, clientIP: string, userAgent: string) {
  const { userId, phoneNumber } = data;

  if (!userId || !phoneNumber) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'User ID and phone number are required' } },
      { status: 400 }
    );
  }

  try {
    // In a real implementation, you would integrate with an SMS service like Twilio
    // For this example, we'll simulate sending an SMS
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code temporarily (in production, use a proper cache like Redis)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // Here you would actually send the SMS
    console.log(`SMS Code ${code} sent to ${phoneNumber}`);

    // Log the challenge
    await SecurityLogger.createLog(
      userId,
      'mfa_challenge',
      { method: 'sms', phone_number: phoneNumber },
      { ip_address: clientIP, user_agent: userAgent }
    );

    return NextResponse.json({
      success: true,
      data: { 
        sent: true,
        expiresIn: 300, // 5 minutes in seconds
      },
    });
  } catch (error) {
    console.error('SMS sending error:', error);
    return NextResponse.json(
      { error: { code: 'SMS_SEND_ERROR', message: 'Failed to send SMS code' } },
      { status: 500 }
    );
  }
}

async function handleSendEmailCode(data: any, clientIP: string, userAgent: string) {
  const { userId, email } = data;

  if (!userId || !email) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'User ID and email are required' } },
      { status: 400 }
    );
  }

  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code temporarily
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // Here you would actually send the email
    console.log(`Email Code ${code} sent to ${email}`);

    // Log the challenge
    await SecurityLogger.createLog(
      userId,
      'mfa_challenge',
      { method: 'email', email },
      { ip_address: clientIP, user_agent: userAgent }
    );

    return NextResponse.json({
      success: true,
      data: { 
        sent: true,
        expiresIn: 300, // 5 minutes in seconds
      },
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: { code: 'EMAIL_SEND_ERROR', message: 'Failed to send email code' } },
      { status: 500 }
    );
  }
}

async function handleCodeVerification(data: any, clientIP: string, userAgent: string) {
  const { userId, code, method } = data;

  if (!userId || !code || !method) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'User ID, code, and method are required' } },
      { status: 400 }
    );
  }

  try {
    // In a real implementation, you would verify the code against stored temporary codes
    // For this example, we'll use a mock verification
    const isValid = code === '123456'; // Mock verification

    // Log attempt
    await supabase.from('mfa_attempts').insert({
      user_id: userId,
      method_type: method,
      code_attempted: code,
      success: isValid,
      ip_address: clientIP,
      user_agent: userAgent,
    });

    if (isValid) {
      await SecurityLogger.createLog(
        userId,
        'mfa_success',
        { method },
        { ip_address: clientIP, user_agent: userAgent }
      );

      return NextResponse.json({
        success: true,
        data: { valid: true },
      });
    } else {
      await SecurityLogger.createLog(
        userId,
        'mfa_failed',
        { method, reason: 'invalid_code' },
        { ip_address: clientIP, user_agent: userAgent }
      );

      return NextResponse.json(
        { error: { code: 'INVALID_CODE', message: 'Invalid verification code' } },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Code verification error:', error);
    return NextResponse.json(
      { error: { code: 'VERIFICATION_ERROR', message: 'Failed to verify code' } },
      { status: 500 }
    );
  }
}

async function handleBackupCodeVerification(data: any, clientIP: string, userAgent: string) {
  const { userId, code } = data;

  if (!userId || !code) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'User ID and code are required' } },
      { status: 400 }
    );
  }

  try {
    // Get user's backup codes
    const { data: mfaSettings, error } = await supabase
      .from('user_mfa_settings')
      .select('backup_codes, backup_codes_used')
      .eq('user_id', userId)
      .single();

    if (error || !mfaSettings?.backup_codes) {
      return NextResponse.json(
        { error: { code: 'BACKUP_CODES_NOT_SETUP', message: 'Backup codes not configured' } },
        { status: 400 }
      );
    }

    // Verify backup code
    const result = await MFAHelper.verifyBackupCode(code, mfaSettings.backup_codes);

    // Log attempt
    await supabase.from('mfa_attempts').insert({
      user_id: userId,
      method_type: 'backup_codes',
      code_attempted: code,
      success: result.valid,
      ip_address: clientIP,
      user_agent: userAgent,
    });

    if (result.valid) {
      // Update used codes
      await supabase
        .from('user_mfa_settings')
        .update({
          backup_codes: result.remaining_codes,
          backup_codes_used: [...(mfaSettings.backup_codes_used || []), code],
        })
        .eq('user_id', userId);

      await SecurityLogger.createLog(
        userId,
        'mfa_success',
        { method: 'backup_codes' },
        { ip_address: clientIP, user_agent: userAgent }
      );

      return NextResponse.json({
        success: true,
        data: { valid: true, remaining_codes: result.remaining_codes.length },
      });
    } else {
      await SecurityLogger.createLog(
        userId,
        'mfa_failed',
        { method: 'backup_codes', reason: 'invalid_code' },
        { ip_address: clientIP, user_agent: userAgent }
      );

      return NextResponse.json(
        { error: { code: 'INVALID_CODE', message: 'Invalid backup code' } },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Backup code verification error:', error);
    return NextResponse.json(
      { error: { code: 'VERIFICATION_ERROR', message: 'Failed to verify backup code' } },
      { status: 500 }
    );
  }
}
