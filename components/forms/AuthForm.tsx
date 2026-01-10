'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const verificationQuestions = [
  'What is your favorite color?',
  'What city were you born in?',
  'What is your mother\'s maiden name?',
  'What was the name of your first pet?',
  'What is your favorite food?',
  'What is the name of your best friend?',
];

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  dob?: string;
  verificationQuestion?: string;
  verificationAnswer?: string;
}

export default function AuthForm() {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [emailEntered, setEmailEntered] = useState(false);
  const [colorHue, setColorHue] = useState(0);
  const router = useRouter();

  // Form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    verificationQuestion: '',
    verificationAnswer: '',
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    verificationAnswer: '',
  });

  // Form errors
  const [registerErrors, setRegisterErrors] = useState<FormErrors>({});
  const [loginErrors, setLoginErrors] = useState<FormErrors>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setColorHue((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const hslToRgb = (h: number, s: number, l: number): string => {
    h = h % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`;
  };

  // Validation functions
  const validateRegisterForm = (): boolean => {
    const errors: FormErrors = {};

    // Name validation
    if (!registerForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (registerForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (registerForm.name.trim().length > 50) {
      errors.name = 'Name must be less than 50 characters';
    }

    // Email validation
    if (!registerForm.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerForm.email.trim())) {
        errors.email = 'Invalid email address';
      }
    }

    // Password validation
    if (!registerForm.password) {
      errors.password = 'Password is required';
    } else if (registerForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm Password validation
    if (!registerForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }

    // Date of Birth validation
    if (!registerForm.dob) {
      errors.dob = 'Date of birth is required';
    } else {
      const date = new Date(registerForm.dob);
      if (isNaN(date.getTime())) {
        errors.dob = 'Invalid date';
      } else {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (date > today) {
          errors.dob = 'Date cannot be in the future';
        } else {
          const age = today.getFullYear() - date.getFullYear();
          const monthDiff = today.getMonth() - date.getMonth();
          const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()) ? age - 1 : age;
          if (adjustedAge < 18) {
            errors.dob = 'You must be at least 18 years old';
          }
        }
      }
    }

    // Verification Question validation
    if (!registerForm.verificationQuestion) {
      errors.verificationQuestion = 'Please select a verification question';
    }

    // Verification Answer validation
    if (!registerForm.verificationAnswer.trim()) {
      errors.verificationAnswer = 'Verification answer is required';
    } else if (registerForm.verificationAnswer.trim().length < 2) {
      errors.verificationAnswer = 'Verification answer must be at least 2 characters';
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLoginForm = (): boolean => {
    const errors: FormErrors = {};

    if (!loginForm.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginForm.email.trim())) {
        errors.email = 'Invalid email address';
      }
    }

    if (!loginForm.password) {
      errors.password = 'Password is required';
    }

    if (!loginForm.verificationAnswer.trim()) {
      errors.verificationAnswer = 'Verification answer is required';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleRegisterChange = (field: keyof typeof registerForm, value: string) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (registerErrors[field]) {
      setRegisterErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLoginChange = (field: keyof typeof loginForm, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (loginErrors[field]) {
      setLoginErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Fetch verification question for login
  useEffect(() => {
    if (isLogin && loginForm.email && loginForm.email.includes('@')) {
      const fetchQuestion = async () => {
        try {
          const response = await fetch('/api/auth/get-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: loginForm.email }),
          });
          if (response.ok) {
            const data = await response.json();
            setUserQuestion(data.question || '');
            setEmailEntered(true);
          } else {
            setUserQuestion('');
            setEmailEntered(false);
          }
        } catch (err) {
          console.error('Error fetching question:', err);
          setUserQuestion('');
          setEmailEntered(false);
        }
      };

      const timeoutId = setTimeout(fetchQuestion, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUserQuestion('');
      setEmailEntered(false);
    }
  }, [loginForm.email, isLogin]);

  // Form submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateRegisterForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name.trim(),
          email: registerForm.email.trim().toLowerCase(),
          password: registerForm.password,
          dob: registerForm.dob,
          verificationQuestion: registerForm.verificationQuestion,
          verificationAnswer: registerForm.verificationAnswer.trim(),
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned invalid response. Please check your connection.');
      }

      if (!response.ok) {
        throw new Error(result.error || `Registration failed (${response.status})`);
      }

      if (result.token && result.user) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        router.push('/play');
      } else {
        throw new Error('Invalid response from server - missing token or user data');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateLoginForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email.trim().toLowerCase(),
          password: loginForm.password,
          verificationAnswer: loginForm.verificationAnswer.trim(),
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned invalid response. Please check your connection.');
      }

      if (!response.ok) {
        throw new Error(result.error || `Login failed (${response.status})`);
      }

      if (result.token && result.user) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        router.push('/play');
      } else {
        throw new Error('Invalid response from server - missing token or user data');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setRegisterForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      dob: '',
      verificationQuestion: '',
      verificationAnswer: '',
    });
    setLoginForm({
      email: '',
      password: '',
      verificationAnswer: '',
    });
    setRegisterErrors({});
    setLoginErrors({});
    setUserQuestion('');
    setEmailEntered(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="glow-border">
        <div className="text-center mb-8">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-2"
            style={{
              color: hslToRgb(colorHue, 1, 0.8),
              textShadow: `0 0 20px ${hslToRgb(colorHue, 1, 0.5)}, 0 0 40px ${hslToRgb((colorHue + 60) % 360, 1, 0.5)}`,
            }}
            animate={{
              textShadow: [
                `0 0 20px ${hslToRgb(colorHue, 1, 0.5)}, 0 0 40px ${hslToRgb((colorHue + 60) % 360, 1, 0.5)}`,
                `0 0 30px ${hslToRgb((colorHue + 30) % 360, 1, 0.6)}, 0 0 50px ${hslToRgb((colorHue + 90) % 360, 1, 0.6)}`,
                `0 0 20px ${hslToRgb(colorHue, 1, 0.5)}, 0 0 40px ${hslToRgb((colorHue + 60) % 360, 1, 0.5)}`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {isLogin ? 'Welcome Back' : 'Join the Race'}
          </motion.h2>
          <p className="text-gray-400">
            {isLogin ? 'Login to continue your racing journey' : 'Create your account to start racing'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Enter your full name"
                  value={registerForm.name}
                  onChange={(e) => handleRegisterChange('name', e.target.value)}
                  error={registerErrors.name}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            value={isLogin ? loginForm.email : registerForm.email}
            onChange={(e) => isLogin ? handleLoginChange('email', e.target.value) : handleRegisterChange('email', e.target.value)}
            error={isLogin ? loginErrors.email : registerErrors.email}
          />

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="dob"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Input
                  label="Date of Birth"
                  type="date"
                  value={registerForm.dob}
                  onChange={(e) => handleRegisterChange('dob', e.target.value)}
                  error={registerErrors.dob}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {isLogin ? (
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Verification Question
              </label>
              <div className={`
                w-full px-4 py-3 rounded-lg
                glass border border-cyan-500/30
                bg-black/30 text-white
                min-h-[48px] flex items-center
                ${!emailEntered ? 'text-gray-500' : ''}
              `}
              style={{
                borderColor: emailEntered ? hslToRgb((colorHue + 120) % 360, 1, 0.5) : undefined,
                color: emailEntered ? hslToRgb((colorHue + 120) % 360, 1, 0.8) : undefined,
              }}
              >
                {emailEntered ? (
                  userQuestion || 'Enter your email to see your question'
                ) : (
                  'Enter your email to see your verification question'
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Verification Question
              </label>
              <select
                value={registerForm.verificationQuestion}
                onChange={(e) => handleRegisterChange('verificationQuestion', e.target.value)}
                className={`
                  w-full px-4 py-3 rounded-lg
                  glass border border-cyan-500/30
                  bg-black/30 text-white
                  focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50
                  transition-all duration-300
                  ${registerErrors.verificationQuestion ? 'border-red-500' : ''}
                `}
              >
                <option value="">Select a question</option>
                {verificationQuestions.map((q, idx) => (
                  <option key={idx} value={q}>
                    {q}
                  </option>
                ))}
              </select>
              {registerErrors.verificationQuestion && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{registerErrors.verificationQuestion}</span>
                </p>
              )}
            </div>
          )}

          <Input
            label="Verification Answer"
            type="text"
            placeholder="Your answer"
            value={isLogin ? loginForm.verificationAnswer : registerForm.verificationAnswer}
            onChange={(e) => isLogin ? handleLoginChange('verificationAnswer', e.target.value) : handleRegisterChange('verificationAnswer', e.target.value)}
            error={isLogin ? loginErrors.verificationAnswer : registerErrors.verificationAnswer}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={isLogin ? loginForm.password : registerForm.password}
            onChange={(e) => isLogin ? handleLoginChange('password', e.target.value) : handleRegisterChange('password', e.target.value)}
            error={isLogin ? loginErrors.password : registerErrors.password}
          />

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="confirmPassword"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={registerForm.confirmPassword}
                  onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                  error={registerErrors.confirmPassword}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Button type="submit" isLoading={isLoading} className="w-full text-lg py-4">
            {isLogin ? '🚀 Login' : '🏁 Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-200"
          >
            {isLogin ? (
              <>
                Don&apos;t have an account? <span className="text-cyan-400 font-semibold underline">Register</span>
              </>
            ) : (
              <>
                Already have an account? <span className="text-cyan-400 font-semibold underline">Login</span>
              </>
            )}
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
