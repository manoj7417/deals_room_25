import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import RegistrationScreen from './RegistrationScreen';

type AuthFlowState = 'login' | 'register';

interface AuthFlowProps {
  onAuthSuccess?: () => void;
}

export default function AuthFlow({ onAuthSuccess }: AuthFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<AuthFlowState>('login');

  const handleRegistrationComplete = () => {
    // After successful registration, redirect to login
    setCurrentScreen('login');
  };

  const handleLoginSuccess = () => {
    // After successful login, call the parent callback
    onAuthSuccess?.();
  };

  const navigateToRegister = () => {
    setCurrentScreen('register');
  };

  const navigateToLogin = () => {
    setCurrentScreen('login');
  };

  if (currentScreen === 'register') {
    return (
      <RegistrationScreen 
        onComplete={handleRegistrationComplete}
        onNavigateToLogin={navigateToLogin}
      />
    );
  }

  return (
    <LoginScreen 
      onLoginSuccess={handleLoginSuccess}
      onNavigateToRegister={navigateToRegister}
    />
  );
} 