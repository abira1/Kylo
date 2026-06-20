type ClassValue =
string |
number |
null |
false |
undefined |
Record<string, boolean | null | undefined> |
ClassValue[];

/**
 * Lightweight className combiner (clsx-style) used across UI components.
 * Supports strings, numbers, arrays, and conditional objects.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  const process = (value: ClassValue) => {
    if (!value) return;
    if (typeof value === 'string' || typeof value === 'number') {
      classes.push(String(value));
    } else if (Array.isArray(value)) {
      value.forEach(process);
    } else if (typeof value === 'object') {
      for (const key in value) {
        if (value[key]) classes.push(key);
      }
    }
  };

  inputs.forEach(process);
  return classes.join(' ');
}