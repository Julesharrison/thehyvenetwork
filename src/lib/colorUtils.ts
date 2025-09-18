/**
 * Converts HSL color values to Hex format
 * @param hslString - HSL string in format "h s% l%" (e.g., "54 100% 66%")
 * @returns Hex color string (e.g., "#FFEB56")
 */
export function hslToHex(hslString: string): string {
  // Parse HSL string - handle both "h s% l%" and "h s l" formats
  const hslMatch = hslString.match(/(\d+)\s+(\d+)%?\s+(\d+)%?/);

  if (!hslMatch) {
    console.warn(`Invalid HSL format: ${hslString}`);
    return '#000000';
  }

  const h = parseInt(hslMatch[1]);
  const s = parseInt(hslMatch[2]) / 100;
  const l = parseInt(hslMatch[3]) / 100;

  // Convert HSL to RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  // Convert to 0-255 range and format as hex
  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

/**
 * Gets the computed CSS variable value
 * @param variableName - CSS variable name (e.g., "--primary-500")
 * @returns HSL color string
 */
export function getCSSVariableValue(variableName: string): string {
  if (typeof window === 'undefined') return '0 0% 0%';

  const rootStyles = getComputedStyle(document.documentElement);
  const hslValue = rootStyles.getPropertyValue(variableName).trim();

  if (!hslValue) {
    console.warn(`CSS variable ${variableName} not found`);
    return '0 0% 0%';
  }

  return hslValue;
}

/**
 * Gets the computed CSS variable value and converts it to hex
 * @param variableName - CSS variable name (e.g., "--primary-500")
 * @returns Hex color string
 */
export function cssVariableToHex(variableName: string): string {
  const hslValue = getCSSVariableValue(variableName);
  return hslToHex(hslValue);
}

/**
 * Resolves CSS variable references to HSL values
 * @param value - Either direct HSL string or CSS variable reference
 * @returns HSL color string
 */
export function resolveColorToHSL(value: string): string {
  // If it's a CSS variable reference (starts with "var(")
  if (value.startsWith('var(')) {
    const variableMatch = value.match(/var\((--[^)]+)\)/);
    if (variableMatch) {
      return getCSSVariableValue(variableMatch[1]);
    }
  }

  // If it's a direct HSL value
  return value;
}

/**
 * Resolves CSS variable references and converts to hex
 * @param value - Either direct HSL string or CSS variable reference
 * @returns Hex color string
 */
export function resolveColorToHex(value: string): string {
  const hslValue = resolveColorToHSL(value);
  return hslToHex(hslValue);
}