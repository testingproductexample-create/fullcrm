'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertCircle, 
  Shield, 
  RefreshCw,
  Info,
  CheckCircle
} from 'lucide-react';
import { PasswordPolicy, PasswordValidationResult } from '@/types/auth';
import { 
  PasswordSecurityHelper, 
  getPasswordStrengthColor, 
  getPasswordStrengthText,
  DEFAULT_PASSWORD_POLICY 
} from '@/lib/auth-helpers';

interface PasswordPolicyComponentProps {
  policy?: PasswordPolicy;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (result: PasswordValidationResult) => void;
  showRequirements?: boolean;
  compact?: boolean;
  className?: string;
}

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
  description: string;
}

const DEFAULT_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'Minimum length',
    test: (password: string) => password.length >= (DEFAULT_PASSWORD_POLICY.min_length || 8),
    description: 'At least 8 characters long',
  },
  {
    id: 'uppercase',
    label: 'Uppercase letter',
    test: (password: string) => /[A-Z]/.test(password),
    description: 'At least one uppercase letter (A-Z)',
  },
  {
    id: 'lowercase',
    label: 'Lowercase letter',
    test: (password: string) => /[a-z]/.test(password),
    description: 'At least one lowercase letter (a-z)',
  },
  {
    id: 'number',
    label: 'Number',
    test: (password: string) => /\d/.test(password),
    description: 'At least one number (0-9)',
  },
  {
    id: 'symbol',
    label: 'Special character',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    description: 'At least one special character',
  },
];

export default function PasswordPolicyComponent({
  policy = DEFAULT_PASSWORD_POLICY,
  value,
  onChange,
  onValidationChange,
  showRequirements = true,
  compact = false,
  className = '',
}: PasswordPolicyComponentProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState<PasswordValidationResult>({
    isValid: false,
    score: 0,
    errors: [],
    suggestions: [],
  });

  // Custom requirements based on policy
  const requirements: PasswordRequirement[] = [
    ...DEFAULT_REQUIREMENTS.map(req => {
      if (req.id === 'length') {
        return {
          ...req,
          test: (password: string) => password.length >= policy.min_length,
          description: `At least ${policy.min_length} characters long`,
        };
      }
      return req;
    }),
    // Add policy-specific requirements
    ...(policy.require_uppercase ? [] : []), // Already covered in default
    ...(policy.require_lowercase ? [] : []), // Already covered in default
    ...(policy.require_numbers ? [] : []), // Already covered in default
    ...(policy.require_symbols ? [] : []), // Already covered in default
  ];

  useEffect(() => {
    const result = PasswordSecurityHelper.validatePassword(value, policy);
    setValidation(result);
    onValidationChange?.(result);
  }, [value, policy, onValidationChange]);

  const getRequirementStatus = (requirement: PasswordRequirement) => {
    return requirement.test(value);
  };

  const getPasswordStrengthWidth = () => {
    const percentage = (validation.score / 5) * 100;
    return `${percentage}%`;
  };

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pr-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Compact strength indicator */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Password strength</span>
            <span className={`font-medium ${getPasswordStrengthColor(validation.score)}`}>
              {getPasswordStrengthText(validation.score)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                validation.score <= 1 ? 'bg-red-500' :
                validation.score <= 2 ? 'bg-orange-500' :
                validation.score <= 3 ? 'bg-yellow-500' :
                validation.score <= 4 ? 'bg-green-500' : 'bg-emerald-500'
              }`}
              style={{ width: getPasswordStrengthWidth() }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Password Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 pr-12 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Password Strength Indicator */}
      {value && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Password strength</span>
            <span className={`font-medium ${getPasswordStrengthColor(validation.score)}`}>
              {getPasswordStrengthText(validation.score)} ({validation.score}/5)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                validation.score <= 1 ? 'bg-red-500' :
                validation.score <= 2 ? 'bg-orange-500' :
                validation.score <= 3 ? 'bg-yellow-500' :
                validation.score <= 4 ? 'bg-green-500' : 'bg-emerald-500'
              }`}
              style={{ width: getPasswordStrengthWidth() }}
            />
          </div>
        </div>
      )}

      {/* Requirements */}
      {showRequirements && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Password Requirements</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {requirements.map((requirement) => {
              const isMet = getRequirementStatus(requirement);
              return (
                <div
                  key={requirement.id}
                  className={`flex items-center space-x-3 p-2 rounded-lg ${
                    isMet ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    isMet ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {isMet ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <X className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${
                      isMet ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {requirement.label}
                    </span>
                    <p className={`text-xs ${
                      isMet ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {requirement.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Password Requirements Not Met</h4>
              <ul className="mt-1 text-sm text-red-700 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {validation.suggestions.length > 0 && !validation.isValid && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Suggestions to Improve</h4>
              <ul className="mt-1 text-sm text-blue-700 space-y-1">
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {validation.isValid && value && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Password meets all requirements
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Password Change Form Component
interface PasswordChangeFormProps {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export function PasswordChangeForm({
  onSubmit,
  onCancel,
  loading = false,
  className = '',
}: PasswordChangeFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validate form
    const newErrors: string[] = [];
    if (!formData.currentPassword) {
      newErrors.push('Current password is required');
    }
    if (!formData.newPassword) {
      newErrors.push('New password is required');
    }
    if (!formData.confirmPassword) {
      newErrors.push('Password confirmation is required');
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.push('New passwords do not match');
    }
    if (formData.newPassword === formData.currentPassword) {
      newErrors.push('New password must be different from current password');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData.currentPassword, formData.newPassword);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to change password']);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>

      {errors.length > 0 && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <PasswordPolicyComponent
        label="Current Password"
        value={formData.currentPassword}
        onChange={(value) => setFormData(prev => ({ ...prev, currentPassword: value }))}
        showPassword={showPasswords.current}
        onTogglePassword={() => togglePasswordVisibility('current')}
        compact
      />

      <PasswordPolicyComponent
        label="New Password"
        value={formData.newPassword}
        onChange={(value) => setFormData(prev => ({ ...prev, newPassword: value }))}
        showPassword={showPasswords.new}
        onTogglePassword={() => togglePasswordVisibility('new')}
        showRequirements={false}
        compact
      />

      <PasswordPolicyComponent
        label="Confirm New Password"
        value={formData.confirmPassword}
        onChange={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
        showPassword={showPasswords.confirm}
        onTogglePassword={() => togglePasswordVisibility('confirm')}
        showRequirements={false}
        compact
      />

      <div className="flex space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Changing...
            </>
          ) : (
            'Change Password'
          )}
        </button>
      </div>
    </form>
  );
}

// Password Generator Component
interface PasswordGeneratorProps {
  onPasswordGenerated: (password: string) => void;
  policy?: PasswordPolicy;
  className?: string;
}

export function PasswordGenerator({ onPasswordGenerated, policy = DEFAULT_PASSWORD_POLICY, className = '' }: PasswordGeneratorProps) {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [options, setOptions] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    avoidAmbiguous: true,
  });

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const ambiguous = 'il1Lo0O';

    let chars = '';
    if (options.includeUppercase) chars += uppercase;
    if (options.includeLowercase) chars += lowercase;
    if (options.includeNumbers) chars += numbers;
    if (options.includeSymbols) chars += symbols;

    if (options.avoidAmbiguous) {
      chars = chars.split('').filter(char => !ambiguous.includes(char)).join('');
    }

    let password = '';
    for (let i = 0; i < options.length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }

    // Ensure the password meets policy requirements
    const validation = PasswordSecurityHelper.validatePassword(password, policy);
    if (!validation.isValid) {
      // If it doesn't meet requirements, try again
      return generatePassword();
    }

    setGeneratedPassword(password);
  };

  useEffect(() => {
    generatePassword();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Generate Secure Password</h3>
        <button
          onClick={generatePassword}
          className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
        >
          Generate New
        </button>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-gray-700 mb-1">Length</label>
          <input
            type="number"
            min="8"
            max="128"
            value={options.length}
            onChange={(e) => setOptions(prev => ({ ...prev, length: parseInt(e.target.value) }))}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="space-y-2">
          {[
            { key: 'includeUppercase', label: 'Uppercase' },
            { key: 'includeLowercase', label: 'Lowercase' },
            { key: 'includeNumbers', label: 'Numbers' },
            { key: 'includeSymbols', label: 'Symbols' },
          ].map((option) => (
            <label key={option.key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options[option.key as keyof typeof options] as boolean}
                onChange={(e) => setOptions(prev => ({ ...prev, [option.key]: e.target.checked }))}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Generated Password */}
      {generatedPassword && (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono break-all">{generatedPassword}</code>
              <button
                onClick={copyToClipboard}
                className="ml-2 p-1 text-gray-500 hover:text-gray-700"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={() => onPasswordGenerated(generatedPassword)}
            className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Use This Password
          </button>
        </div>
      )}
    </div>
  );
}
