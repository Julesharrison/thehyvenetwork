import { useState } from 'react';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

type ValuePiece = Date | string | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function TimePickerDemo() {
  const [value, onChange] = useState<Value>('10:00');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md border border-border text-center">
        <h1 className="text-3xl font-light text-foreground mb-6">Select a Time</h1>
        <p className="text-muted-foreground mb-8">Use the analog clock or input fields to select a time</p>

        <div className="mb-8 flex justify-center">
          <TimePicker
            onChange={onChange}
            value={value}
            disableClock={false}
            format="h:mm a"
            clearIcon={null}
            hourPlaceholder="hh"
            minutePlaceholder="mm"
            maxDetail="minute"
            className="react-time-picker-custom"
          />
        </div>

        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-2">Currently Selected Time:</p>
          <p className="text-2xl font-semibold text-foreground">
            {value ? (
              typeof value === 'string' ? value : 
              value instanceof Date ? value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
              'No time selected'
            ) : 'No time selected'}
          </p>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          <p>• Click on the clock to select time</p>
          <p>• Use the input fields for precise entry</p>
          <p>• Drag the clock hands to adjust time</p>
        </div>
      </div>
    </div>
  );
}