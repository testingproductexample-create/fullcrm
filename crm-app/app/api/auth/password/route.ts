import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PasswordSecurityHelper, AccountLockoutHelper, SecurityLogger } from '@/lib/auth-helpers';
import bcrypt from 'bcryptjs';

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

// GET /api/auth/password/validate
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'check_strength':
        return await handlePasswordStrengthCheck(searchParams);
      
      case 'check_lockout':
        return await handleLockoutCheck(searchParams, request);
      
      case 'validate_reset_token':
        return await handleResetTokenValidation(searchParams);
      
      default:
        return NextResponse.json(
          { error: { code: 'INVALID_ACTION', message: 'Invalid action specified' } },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Password API GET error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// POST /api/auth/password
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);

    switch (action) {
      case 'change_password':
        return await handlePasswordChange(data, clientIP, userAgent);
      
      case 'reset_password':
        return await handlePasswordReset(data, clientIP, userAgent);
      
      case 'forgot_password':
        return await handleForgotPassword(data, clientIP, userAgent);
      
      case 'validate_current':
        return await handleCurrentPasswordValidation(data, clientIP, userAgent);
      
      default:
        return NextResponse.json(
          { error: { code: 'INVALID_ACTION', message: 'Invalid action specified' } },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Password API POST error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

async function handlePasswordStrengthCheck(searchParams: URLSearchParams) {
  const password = searchParams.get('password');
  const minLength = parseInt(searchParams.get('min_length') || '8');
  const requireUppercase = searchParams.get('require_uppercase') === 'true';
  const requireLowercase = searchParams.get('require_lowercase') === 'true';
  const requireNumbers = searchParams.get('require_numbers') === 'true';
  const requireSymbols = searchParams.get('require_symbols') === 'true';

  if (!password) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'Password is required' } },
      { status: 400 }
    );
  }

  const validation = PasswordSecurityHelper.validatePassword(password, {
    min_length: minLength,
    require_uppercase: requireUppercase,
    require_lowercase: requireLowercase,
    require_numbers: requireNumbers,
    require_symbols: requireSymbols,
    max_age_days: 90,
    prevent_reuse: 5,
    complexity_score: 3,
  });

  return NextResponse.json({
    success: true,
    data: validation,
  });
}

async function handleLockoutCheck(searchParams: URLSearchParams, request: NextRequest) {
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'User ID is required' } },
      { status: 400 }
    );
  }

  try {
    const lockoutStatus = await AccountLockoutHelper.checkLockoutStatus(userId);
    
    return NextResponse.json({
      success: true,
      data: lockoutStatus,
    });
  } catch (error) {
    console.error('Lockout check error:', error);
    return NextResponse.json(
      { error: { code: 'LOCKOUT_CHECK_ERROR', message: 'Failed to check lockout status' } },
      { status: 500 }
    );
  }
}

async function handleResetTokenValidation(searchParams: URLSearchParams) {
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'Reset token is required' } },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('auth_challenges')
      .select('*')
      .eq('challenge_type', 'password_reset')
      .eq('challenge_code', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        user_id: data.user_id,
        expires_at: data.expires_at,
      },
    });
  } catch (error) {
    console.error('Reset token validation error:', error);
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Failed to validate reset token' } },
      { status: 500 }
    );
  }
}

async function handlePasswordChange(data: any, clientIP: string, userAgent: string) {
  const { userId, currentPassword, newPassword } = data;

  if (!userId || !currentPassword || !newPassword) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'User ID, current password, and new password are required' } },
      { status: 400 }
    );
  }

  try {
    // Get current user
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user.user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect' } },
        { status: 400 }
      );
    }

    // Validate new password
    const validation = PasswordSecurityHelper.validatePassword(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: { 
            code: 'WEAK_PASSWORD', 
            message: 'Password does not meet requirements',
            details: validation 
          } 
        },
        { status: 400 }
      );
    }

    // Check password history (prevent reuse)
    const { data: passwordHistory } = await supabase
      .from('password_history')
      .select('password_hash')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (passwordHistory) {
      for (const history of passwordHistory) {
        const isReused = await bcrypt.compare(newPassword, history.password_hash);
        if (isReused) {
          return NextResponse.json(
            { 
              error: { 
                code: 'PASSWORD_REUSED', 
                message: 'Cannot reuse recent passwords' 
              } 
            },
            { status: 400 }
          );
        }
      }
    }

    // Hash new password
    const hashedPassword = await PasswordSecurityHelper.hashPassword(newPassword);

    // Update password in auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: 'Failed to update password' } },
        { status: 500 }
      );
    }

    // Save to password history
    await supabase.from('password_history').insert({
      user_id: userId,
      password_hash: hashedPassword,
    });

    // Update security settings
    await supabase
      .from('user_security_settings')
      .upsert({
        user_id: userId,
        password_changed_at: new Date().toISOString(),
        password_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      });

    // Log the password change
    await SecurityLogger.createLog(
      userId,
      'password_changed',
      { method: 'user_initiated' },
      { ip_address: clientIP, user_agent: userAgent }
    );

    return NextResponse.json({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: { code: 'CHANGE_ERROR', message: 'Failed to change password' } },
      { status: 500 }
    );
  }
}

async function handlePasswordReset(data: any, clientIP: string, userAgent: string) {
  const { token, newPassword } = data;

  if (!token || !newPassword) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'Reset token and new password are required' } },
      { status: 400 }
    );
  }

  try {
    // Get the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('auth_challenges')
      .select('user_id')
      .eq('challenge_type', 'password_reset')
      .eq('challenge_code', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' } },
        { status: 400 }
      );
    }

    // Validate new password
    const validation = PasswordSecurityHelper.validatePassword(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: { 
            code: 'WEAK_PASSWORD', 
            message: 'Password does not meet requirements',
            details: validation 
          } 
        },
        { status: 400 }
      );
    }

    // Update password in auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      challenge.user_id,
      { password: newPassword }
    );

    if (updateError) {
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: 'Failed to update password' } },
        { status: 500 }
      );
    }

    // Mark challenge as used
    await supabase
      .from('auth_challenges')
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('id', challenge.id);

    // Save to password history
    const hashedPassword = await PasswordSecurityHelper.hashPassword(newPassword);
    await supabase.from('password_history').insert({
      user_id: challenge.user_id,
      password_hash: hashedPassword,
    });

    // Update security settings
    await supabase
      .from('user_security_settings')
      .upsert({
        user_id: challenge.user_id,
        password_changed_at: new Date().toISOString(),
        password_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        failed_attempts: 0,
        last_failed_attempt: null,
        locked_until: null,
      });

    // Log the password reset
    await SecurityLogger.createLog(
      challenge.user_id,
      'password_reset_completed',
      { method: 'token_based' },
      { ip_address: clientIP, user_agent: userAgent }
    );

    return NextResponse.json({
      success: true,
      data: { message: 'Password reset successfully' },
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: { code: 'RESET_ERROR', message: 'Failed to reset password' } },
      { status: 500 }
    );
  }
}

async function handleForgotPassword(data: any, clientIP: string, userAgent: string) {
  const { email } = data;

  if (!email) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'Email is required' } },
      { status: 400 }
    );
  }

  try {
    // Get user by email
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      return NextResponse.json(
        { error: { code: 'USER_LOOKUP_ERROR', message: 'Failed to find user' } },
        { status: 500 }
      );
    }

    const foundUser = user.users.find(u => u.email === email);
    if (!foundUser) {
      // Don't reveal that the user doesn't exist
      return NextResponse.json({
        success: true,
        data: { message: 'If the email exists, a reset link has been sent' },
      });
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create challenge
    await supabase.from('auth_challenges').insert({
      user_id: foundUser.id,
      challenge_type: 'password_reset',
      challenge_code: resetToken,
      expires_at: expiresAt.toISOString(),
    });

    // In a real implementation, you would send an email with the reset link
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${resetToken}`;
    console.log(`Password reset link sent to ${email}: ${resetLink}`);

    // Log the reset request
    await SecurityLogger.createLog(
      foundUser.id,
      'password_reset_requested',
      { email },
      { ip_address: clientIP, user_agent: userAgent }
    );

    return NextResponse.json({
      success: true,
      data: { message: 'If the email exists, a reset link has been sent' },
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: { code: 'FORGOT_PASSWORD_ERROR', message: 'Failed to process request' } },
      { status: 500 }
    );
  }
}

async function handleCurrentPasswordValidation(data: any, clientIP: string, userAgent: string) {
  const { userId, currentPassword } = data;

  if (!userId || !currentPassword) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMETERS', message: 'User ID and current password are required' } },
      { status: 400 }
    );
  }

  try {
    // Get current user
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user.user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.user.email!,
      password: currentPassword,
    });

    const isValid = !signInError;

    return NextResponse.json({
      success: true,
      data: { valid: isValid },
    });
  } catch (error) {
    console.error('Current password validation error:', error);
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Failed to validate password' } },
      { status: 500 }
    );
  }
}
