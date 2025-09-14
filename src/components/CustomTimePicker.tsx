import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface CustomTimePickerProps {
  value?: string; // Format: "HH:MM AM/PM" e.g., "08:00 PM"
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function CustomTimePicker({
  value = '',
  onChange,
  placeholder = 'Select time',
  disabled = false,
  className = '',
  label,
  required = false
}: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse existing value on mount/change
  useEffect(() => {
    if (value) {
      const timeMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (timeMatch) {
        setSelectedHour(parseInt(timeMatch[1], 10));
        setSelectedMinute(parseInt(timeMatch[2], 10));
        setSelectedPeriod(timeMatch[3].toUpperCase() as 'AM' | 'PM');
      }
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate time options
  const hours = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
  const minutes = [0, 15, 30, 45]; // Common performance time intervals

  const formatTime = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
    const displayHour = hour === 0 ? 12 : hour;
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimeSelect = (hour: number, minute: number, period: 'AM' | 'PM') => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    
    const timeString = formatTime(hour, minute, period);
    onChange(timeString);
    setIsOpen(false);
  };

  const displayValue = value || (selectedHour && selectedMinute !== undefined && selectedPeriod 
    ? formatTime(selectedHour, selectedMinute, selectedPeriod) 
    : '');

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground 
            hover:bg-accent transition-colors flex items-center justify-between
            focus:ring-2 focus:ring-primary focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isOpen ? 'ring-2 ring-primary border-primary' : ''}
          `}
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={displayValue ? 'text-foreground' : 'text-muted-foreground'}>
              {displayValue || placeholder}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-hidden">
            <div className="p-4">
              <p className="text-sm font-medium text-foreground mb-3">
                Select Time
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {/* Hour Selection */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Hour</label>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                    className="w-full px-2 py-2 text-sm bg-input border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {hours.map(hour => (
                      <option key={hour} value={hour}>
                        {hour.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minute Selection */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Minute</label>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                    className="w-full px-2 py-2 text-sm bg-input border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {minutes.map(minute => (
                      <option key={minute} value={minute}>
                        {minute.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AM/PM Selection */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as 'AM' | 'PM')}
                    className="w-full px-2 py-2 text-sm bg-input border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={() => handleTimeSelect(selectedHour, selectedMinute, selectedPeriod)}
                className="w-full mt-4 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                Set Time: {formatTime(selectedHour, selectedMinute, selectedPeriod)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}