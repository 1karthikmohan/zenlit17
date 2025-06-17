import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { checkUsernameAvailability, validateUsernameFormat, UsernameCheckResult } from '../../lib/username';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, username: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export const UsernameInput: React.FC<Props> = ({
  value,
  onChange,
  onValidationChange,
  className = '',
  placeholder = 'username123',
  required = false
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<UsernameCheckResult | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);

  // Debounced username checking
  const checkUsername = useCallback(
    async (username: string) => {
      if (!username) {
        setCheckResult(null);
        setFormatError(null);
        onValidationChange?.(false, username);
        return;
      }

      // First check format
      const formatValidation = validateUsernameFormat(username);
      if (!formatValidation.valid) {
        setFormatError(formatValidation.error || 'Invalid format');
        setCheckResult(null);
        onValidationChange?.(false, username);
        return;
      }

      setFormatError(null);
      setIsChecking(true);

      try {
        const result = await checkUsernameAvailability(username);
        setCheckResult(result);
        onValidationChange?.(result.available, username);
      } catch (error) {
        console.error('Username check error:', error);
        setCheckResult({ available: false, error: 'Unable to check availability' });
        onValidationChange?.(false, username);
      } finally {
        setIsChecking(false);
      }
    },
    [onValidationChange]
  );

  // Debounce username checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.trim()) {
        checkUsername(value.trim());
      } else {
        setCheckResult(null);
        setFormatError(null);
        onValidationChange?.(false, value);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, checkUsername, onValidationChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toLowerCase();
    
    // Remove any characters that aren't allowed
    newValue = newValue.replace(/[^a-z0-9._]/g, '');
    
    // Limit length
    if (newValue.length > 30) {
      newValue = newValue.slice(0, 30);
    }

    onChange(newValue);
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return (
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      );
    }

    if (formatError) {
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    }

    if (checkResult) {
      if (checkResult.available) {
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      } else {
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      }
    }

    return null;
  };

  const getStatusMessage = () => {
    if (isChecking) {
      return <span className="text-blue-400 text-xs">Checking availability...</span>;
    }

    if (formatError) {
      return <span className="text-red-400 text-xs">{formatError}</span>;
    }

    if (checkResult) {
      if (checkResult.available) {
        return <span className="text-green-400 text-xs">✓ Username is available</span>;
      } else {
        return (
          <div className="space-y-2">
            <span className="text-red-400 text-xs">{checkResult.error}</span>
            {checkResult.suggestions && checkResult.suggestions.length > 0 && (
              <div className="space-y-1">
                <span className="text-gray-400 text-xs">Suggestions:</span>
                <div className="flex flex-wrap gap-1">
                  {checkResult.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => onChange(suggestion)}
                      className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded hover:bg-blue-600/30 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    return null;
  };

  const getBorderColor = () => {
    if (isChecking) return 'border-blue-500';
    if (formatError) return 'border-red-500';
    if (checkResult?.available) return 'border-green-500';
    if (checkResult && !checkResult.available) return 'border-red-500';
    return 'border-gray-600';
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 ${getBorderColor()} ${className}`}
          placeholder={placeholder}
          required={required}
          maxLength={30}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getStatusIcon()}
        </div>
      </div>
      
      {/* Status message */}
      <div className="min-h-[20px]">
        {getStatusMessage()}
      </div>

      {/* Character count */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Letters, numbers, dots and underscores only</span>
        <span className={value.length > 25 ? 'text-yellow-400' : 'text-gray-500'}>
          {value.length}/30
        </span>
      </div>
    </div>
  );
};