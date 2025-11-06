'use client';

import { useState, useRef, useEffect, TouchEvent, ReactNode } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

// Pull-to-refresh component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  refreshThreshold?: number;
  className?: string;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  refreshThreshold = 80,
  className = '' 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startY.current) * 0.5);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, refreshThreshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= refreshThreshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const refreshProgress = Math.min(pullDistance / refreshThreshold, 1);
  const shouldShowRefresh = pullDistance > 0 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ height: '100%' }}
    >
      {/* Pull indicator */}
      <div
        className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-purple-500 to-pink-500 text-white transition-transform duration-200 ${
          shouldShowRefresh ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          height: refreshThreshold,
          transform: `translateY(${shouldShowRefresh ? pullDistance - refreshThreshold : -refreshThreshold}px)`
        }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2">
            <RotateCcw 
              className={`w-5 h-5 transition-transform duration-200 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{ 
                transform: `rotate(${refreshProgress * 360}deg)` 
              }}
            />
            <span className="text-sm font-medium">
              {isRefreshing ? 'Refreshing...' : 
               pullDistance >= refreshThreshold ? 'Release to refresh' : 
               'Pull to refresh'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="h-full overflow-y-auto"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Swipeable card component
interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  swipeThreshold?: number;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  swipeThreshold = 100,
  className = ''
}: SwipeableCardProps) {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].clientX;
    const distance = currentX - startX.current;
    
    // Limit swipe distance
    const maxDistance = swipeThreshold * 1.5;
    const limitedDistance = Math.max(-maxDistance, Math.min(maxDistance, distance));
    
    setSwipeDistance(limitedDistance);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    setIsSwiping(false);

    if (Math.abs(swipeDistance) >= swipeThreshold) {
      if (swipeDistance > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (swipeDistance < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setSwipeDistance(0);
  };

  const showLeftAction = swipeDistance > 0 && rightAction;
  const showRightAction = swipeDistance < 0 && leftAction;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left action */}
      {showLeftAction && (
        <div
          className="absolute left-0 top-0 bottom-0 bg-green-500 flex items-center justify-start px-4"
          style={{ width: Math.abs(swipeDistance) }}
        >
          <div className="text-white">
            {rightAction}
          </div>
        </div>
      )}

      {/* Right action */}
      {showRightAction && (
        <div
          className="absolute right-0 top-0 bottom-0 bg-red-500 flex items-center justify-end px-4"
          style={{ width: Math.abs(swipeDistance) }}
        >
          <div className="text-white">
            {leftAction}
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        ref={cardRef}
        className="bg-white relative z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeDistance}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Mobile-friendly accordion
interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
}

interface MobileAccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export function MobileAccordion({ items, allowMultiple = false, className = '' }: MobileAccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }
      
      return newSet;
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        
        return (
          <div key={item.id} className="backdrop-blur-xl bg-white/70 rounded-xl shadow-sm border border-white/20 overflow-hidden">
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <div className="text-purple-600">
                    {item.icon}
                  </div>
                )}
                <span className="font-medium text-gray-900">{item.title}</span>
              </div>
              <div className="text-gray-400">
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>
            
            <div
              className={`overflow-hidden transition-all duration-200 ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-4 pt-0 border-t border-gray-100">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Touch-friendly button component
interface TouchButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TouchButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = ''
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
    secondary: 'bg-white/70 text-gray-700 border border-white/30',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    success: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        font-medium rounded-lg transition-all duration-150 
        ${variants[variant]} 
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:shadow-lg'}
        ${isPressed ? 'scale-95 shadow-lg' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// Mobile-optimized input component
interface MobileInputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function MobileInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  icon,
  className = ''
}: MobileInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-4 py-3 text-base rounded-lg border 
            backdrop-blur-xl bg-white/70 
            ${icon ? 'pl-10' : ''}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-200 focus:border-purple-500 focus:ring-purple-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isFocused ? 'ring-2 ring-opacity-50' : ''}
            transition-all duration-200
          `}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Floating action button
interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FloatingActionButton({
  icon,
  onClick,
  position = 'bottom-right',
  size = 'md',
  className = ''
}: FloatingActionButtonProps) {
  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed z-50 ${positions[position]} ${sizes[size]}
        bg-gradient-to-r from-purple-600 to-pink-600 text-white
        rounded-full shadow-lg hover:shadow-xl
        flex items-center justify-center
        transition-all duration-200
        active:scale-95 hover:scale-105
        ${className}
      `}
    >
      {icon}
    </button>
  );
}