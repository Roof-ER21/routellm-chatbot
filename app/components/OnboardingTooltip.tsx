/**
 * OnboardingTooltip Component
 * Shows helpful tips for first-time users
 *
 * Features:
 * - Automatic display on first visit
 * - Dismissible with localStorage persistence
 * - Highlights key features (modes, voice, upload)
 * - Mobile-optimized with responsive design
 */

'use client';

import React, { useState, useEffect } from 'react';

export interface OnboardingTooltipProps {
  onDismiss?: () => void;
}

export default function OnboardingTooltip({ onDismiss }: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: '👋 Welcome to Susan 21!',
      description: 'Your British roofing insurance expert, born in Egypt, educated in England, now serving The Roof Docs in the US.',
      icon: '🌍',
    },
    {
      title: '🎯 Special Modes',
      description: 'Toggle Deep Dive mode (🔍) for detailed analysis or Education mode (🎓) for teaching-style responses.',
      icon: '🔍',
    },
    {
      title: '🎤 Hands-Free Voice',
      description: 'Activate hands-free mode for continuous voice conversations while working in the field.',
      icon: '✋',
    },
    {
      title: '📸 Upload Documents',
      description: 'Upload photos, PDFs, or documents for damage assessment and insurance claim analysis.',
      icon: '📄',
    },
  ];

  useEffect(() => {
    // Check if user has seen the onboarding
    const hasSeenOnboarding = localStorage.getItem('susan21_onboarding_seen');
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('susan21_onboarding_seen', 'true');
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleSkip = () => {
    handleDismiss();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-red-600 overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-700 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 pt-10">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-4xl shadow-lg">
              {step.icon}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-white">
            {step.title}
          </h3>

          {/* Description */}
          <p className="text-center text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Step Indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${index === currentStep
                    ? 'w-8 bg-red-600'
                    : index < currentStep
                    ? 'w-2 bg-red-400'
                    : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }
                `}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            {/* Skip Button */}
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Skip
            </button>

            {/* Navigation */}
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
