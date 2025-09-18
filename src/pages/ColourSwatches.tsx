import React from 'react';
import { resolveColorToHex, resolveColorToHSL } from '../lib/colorUtils';

interface ColorSwatchProps {
  colorName: string;
  colorValue: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ colorName, colorValue }) => {
  const actualHSLValue = resolveColorToHSL(colorValue);
  const hexValue = resolveColorToHex(colorValue);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-[100px] h-[100px] border border-gray-300 rounded-lg shadow-sm"
        style={{ backgroundColor: `hsl(${actualHSLValue})` }}
      />
      <span className="text-sm font-medium text-center">{colorName}</span>
      <span className="text-xs text-gray-600 text-center">hsl({actualHSLValue})</span>
      <span className="text-xs text-gray-500 text-center">{hexValue}</span>
    </div>
  );
};

const ColourSwatches: React.FC = () => {
  const blackScale = [
    { name: 'black-100', value: 'var(--black-100)' },
    { name: 'black-200', value: 'var(--black-200)' },
    { name: 'black-300', value: 'var(--black-300)' },
    { name: 'black-400', value: 'var(--black-400)' },
    { name: 'black-500', value: 'var(--black-500)' },
    { name: 'black-600', value: 'var(--black-600)' },
    { name: 'black-700 (base)', value: 'var(--black-700)' },
    { name: 'black-800', value: 'var(--black-800)' },
    { name: 'black-900', value: 'var(--black-900)' },
  ];

  const primaryScale = [
    { name: 'primary-50', value: 'var(--primary-50)' },
    { name: 'primary-100', value: 'var(--primary-100)' },
    { name: 'primary-200', value: 'var(--primary-200)' },
    { name: 'primary-300', value: 'var(--primary-300)' },
    { name: 'primary-400', value: 'var(--primary-400)' },
    { name: 'primary-500 (base)', value: 'var(--primary-500)' },
    { name: 'primary-600', value: 'var(--primary-600)' },
    { name: 'primary-700', value: 'var(--primary-700)' },
    { name: 'primary-800', value: 'var(--primary-800)' },
    { name: 'primary-900', value: 'var(--primary-900)' },
  ];

  const semanticColors = [
    { name: 'white', value: 'var(--white)' },
    { name: 'background', value: 'var(--background)' },
    { name: 'foreground', value: 'var(--foreground)' },
    { name: 'card', value: 'var(--card)' },
    { name: 'card-foreground', value: 'var(--card-foreground)' },
    { name: 'popover', value: 'var(--popover)' },
    { name: 'popover-foreground', value: 'var(--popover-foreground)' },
    { name: 'primary', value: 'var(--primary)' },
    { name: 'primary-foreground', value: 'var(--primary-foreground)' },
    { name: 'secondary', value: 'var(--secondary)' },
    { name: 'secondary-foreground', value: 'var(--secondary-foreground)' },
    { name: 'muted', value: 'var(--muted)' },
    { name: 'muted-foreground', value: 'var(--muted-foreground)' },
    { name: 'accent', value: 'var(--accent)' },
    { name: 'accent-foreground', value: 'var(--accent-foreground)' },
    { name: 'destructive', value: 'var(--destructive)' },
    { name: 'destructive-foreground', value: 'var(--destructive-foreground)' },
    { name: 'border', value: 'var(--border)' },
    { name: 'input', value: 'var(--input)' },
    { name: 'ring', value: 'var(--ring)' },
    { name: 'success', value: 'var(--success)' },
    { name: 'success-foreground', value: 'var(--success-foreground)' },
  ];

  return (
    <div className="min-h-screen background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-black-900 mb-8">Colour Swatches</h1>

        {/* Black Scale */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-black-800 mb-6">Black Scale</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-6">
            {blackScale.map((color) => (
              <ColorSwatch
                key={color.name}
                colorName={color.name}
                colorValue={color.value}
              />
            ))}
          </div>
        </section>

        {/* Primary Scale */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-black-800 mb-6">Primary Scale</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-6">
            {primaryScale.map((color) => (
              <ColorSwatch
                key={color.name}
                colorName={color.name}
                colorValue={color.value}
              />
            ))}
          </div>
        </section>

        {/* Semantic Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-black-800 mb-6">Semantic Color Roles</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {semanticColors.map((color) => (
              <ColorSwatch
                key={color.name}
                colorName={color.name}
                colorValue={color.value}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ColourSwatches;