import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LoaderIcon, Mail, Shield, Clock, RefreshCw } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

/**
 * =====================================================================================
 * ACE CSS LEAVE PORTAL - OTP VERIFICATION COMPONENT
 * =====================================================================================
 * Version: 2.2.0
 * Purpose: React component for OTP verification with professional UI
 * Features: Auto-focus, timer, resend functionality, error handling
 * =====================================================================================
 */

interface OTPVerificationProps {
  isOpen: boolean;
  onVerified: () => void;
  onCancel: () => void;
  userEmail?: string;
  userName?: string;
  purpose?: 'login' | 'password_reset' | 'email_change' | 'account_verification';
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  isOpen,
  onVerified,
  onCancel,
  userEmail = '',
  userName = 'User',
  purpose = 'login'
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isVerified, setIsVerified] = useState(false);
  
  const otpInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus on mount
  useEffect(() => {
    if (isOpen && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // Timer for OTP expiry
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);
  
  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resendCooldown]);
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Generate OTP (initial or resend)
  const generateOTP = async (isResend = false) => {
    try {
      if (isResend) {
        setIsResendLoading(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      
      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ purpose })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.waitTime) {
          setResendCooldown(data.waitTime * 60); // Convert minutes to seconds
          setError(`Please wait ${data.waitTime} minute(s) before requesting a new OTP.`);
        } else {
          setError(data.error || 'Failed to generate OTP');
        }
        return;
      }
      
      if (isResend) {
        setSuccess('New OTP sent successfully!');
        setResendCooldown(300); // 5 minutes cooldown after resend
        setTimeout(() => setSuccess(null), 3000);
      }
      
      // Reset timer
      setTimeLeft(data.expiresIn * 60); // Convert minutes to seconds
      setCanResend(false);
      setRemainingAttempts(3);
      
    } catch (error) {
      console.error('Error generating OTP:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsResendLoading(false);
    }
  };
  
  // Verify OTP
  const verifyOTP = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!otpCode || otpCode.length !== 6) {
        setError('Please enter a valid 6-digit OTP code.');
        return;
      }
      
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          otpCode: otpCode.replace(/\s/g, ''), // Remove any spaces
          purpose 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.code === 'INVALID_OTP' && data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
          setError(`${data.error}`);
        } else if (data.code === 'OTP_EXPIRED') {
          setError(data.error);
          setCanResend(true);
        } else if (data.code === 'MAX_ATTEMPTS_EXCEEDED') {
          setError(data.error);
          setCanResend(true);
          setRemainingAttempts(0);
        } else {
          setError(data.error || 'OTP verification failed');
        }
        return;
      }
      
      // Success
      setIsVerified(true);
      setSuccess('OTP verified successfully! Redirecting...');
      
      // Call success callback after short delay
      setTimeout(() => {
        onVerified();
      }, 1500);
      
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle OTP input change
  const handleOTPChange = (value: string) => {
    setOtpCode(value);
    setError(null);
    
    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
      setTimeout(() => {
        verifyOTP();
      }, 500);
    }
  };
  
  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    await generateOTP(true);
    setOtpCode(''); // Clear current input
  };
  
  // Generate initial OTP when component opens
  useEffect(() => {
    if (isOpen && !isVerified) {
      generateOTP(false);
    }
  }, [isOpen]);
  
  // Purpose display configuration
  const purposeConfig = {
    login: { title: 'Login Verification', icon: Shield, description: 'Enter the verification code sent to your email to complete login' },
    password_reset: { title: 'Password Reset Verification', icon: Shield, description: 'Enter the verification code to reset your password' },
    email_change: { title: 'Email Change Verification', icon: Mail, description: 'Enter the verification code to confirm email change' },
    account_verification: { title: 'Account Verification', icon: Shield, description: 'Enter the verification code to verify your account' }
  };
  
  const config = purposeConfig[purpose] || purposeConfig.login;
  const IconComponent = config.icon;
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">{config.title}</CardTitle>
            <CardDescription className="mt-2">
              {config.description}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Email Display */}
          <div className="text-center">
            <Label className="text-sm text-gray-600">Verification code sent to:</Label>
            <div className="flex items-center justify-center mt-1 space-x-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-sm">{userEmail}</span>
            </div>
          </div>
          
          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {/* OTP Input */}
          <div className="space-y-4">
            <Label htmlFor="otp-input">Enter 6-digit verification code:</Label>
            <div className="flex justify-center">
              <InputOTP
                value={otpCode}
                onChange={handleOTPChange}
                maxLength={6}
                disabled={isLoading || isVerified}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          
          {/* Timer and Status */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'Code expired'}
              </span>
            </div>
            <Badge variant={remainingAttempts > 0 ? 'secondary' : 'destructive'}>
              {remainingAttempts} attempts left
            </Badge>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={verifyOTP}
              disabled={isLoading || otpCode.length !== 6 || isVerified}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : isVerified ? (
                'Verified ✓'
              ) : (
                'Verify Code'
              )}
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={isResendLoading || resendCooldown > 0 || !canResend}
                className="flex-1"
              >
                {isResendLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Wait ${Math.ceil(resendCooldown / 60)}m`
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Code
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
          
          {/* Help Text */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>• Code expires in 10 minutes</p>
            <p>• Check your spam/junk folder if not received</p>
            <p>• You can resend after the current code expires</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPVerification;
