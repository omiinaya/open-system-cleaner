import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and merges Tailwind classes intelligently.
 *
 * This utility function uses `clsx` for conditional class joining and
 * `tailwind-merge` to resolve conflicting Tailwind classes.
 *
 * @param inputs - Class values to be combined (strings, objects, arrays, etc.)
 * @returns Merged class string with conflicting Tailwind classes resolved
 *
 * @example
 * // Basic usage
 * cn('px-4 py-2', 'bg-blue-500')
 * // => 'px-4 py-2 bg-blue-500'
 *
 * @example
 * // Conditional classes
 * cn('px-4 py-2', {
 *   'bg-blue-500': isPrimary,
 *   'bg-gray-500': !isPrimary,
 * })
 *
 * @example
 * // Resolving conflicts (later classes win)
 * cn('px-4 py-2', 'px-6')
 * // => 'py-2 px-6' (px-6 overrides px-4)
 *
 * @example
 * // With arrays
 * cn(['px-4', 'py-2'], 'bg-blue-500')
 * // => 'px-4 py-2 bg-blue-500'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Creates a BEM-style class name generator for a component.
 *
 * @param block - The block name (component name)
 * @returns Object with methods for generating BEM class names
 *
 * @example
 * const btn = bem('button');
 * btn() // => 'button'
 * btn('primary') // => 'button--primary'
 * btn('icon') // => 'button__icon'
 * btn({ disabled: true }) // => 'button button--disabled'
 */
export function bem(block: string) {
  return (
    elementOrModifiers?: string | Record<string, boolean>,
    modifiers?: Record<string, boolean>,
  ): string => {
    const base = block;

    // If first argument is a string, it's an element
    if (typeof elementOrModifiers === "string") {
      const element = `${base}__${elementOrModifiers}`;

      // If modifiers provided, apply them
      if (modifiers) {
        const modifierClasses = Object.entries(modifiers)
          .filter(([, value]) => value)
          .map(([key]) => `${element}--${key}`);

        return cn(element, ...modifierClasses);
      }

      return element;
    }

    // If first argument is an object, it's modifiers for the block
    if (typeof elementOrModifiers === "object") {
      const modifierClasses = Object.entries(elementOrModifiers)
        .filter(([, value]) => value)
        .map(([key]) => `${base}--${key}`);

      return cn(base, ...modifierClasses);
    }

    return base;
  };
}

/**
 * Conditionally joins class names with a prefix.
 * Useful for scoped component styles.
 *
 * @param prefix - The prefix to add to all classes
 * @param classes - Class values to join
 * @returns Prefixed class string
 *
 * @example
 * scoped('my-component', 'active', 'large')
 * // => 'my-component my-component--active my-component--large'
 */
export function scoped(prefix: string, ...classes: ClassValue[]): string {
  const flattened = clsx(classes)
    .split(" ")
    .filter(Boolean)
    .map((cls) => `${prefix}__${cls}`);

  return cn(prefix, ...flattened);
}

/**
 * Variant-based class name generator.
 * Useful for components with multiple variants.
 *
 * @param base - Base class name
 * @param variants - Object mapping variant names to class strings
 * @returns Function that generates class names based on active variants
 *
 * @example
 * const button = variant('btn', {
 *   variant: {
 *     primary: 'btn--primary',
 *     secondary: 'btn--secondary',
 *   },
 *   size: {
 *     sm: 'btn--sm',
 *     md: 'btn--md',
 *     lg: 'btn--lg',
 *   },
 * });
 *
 * button({ variant: 'primary', size: 'lg' })
 * // => 'btn btn--primary btn--lg'
 */
export function variant<T extends Record<string, Record<string, string>>>(
  base: string,
  variants: T,
) {
  type VariantProps = {
    [K in keyof T]?: keyof T[K];
  };

  return (props: VariantProps = {}): string => {
    const variantClasses = Object.entries(props)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => variants[key]?.[value as string])
      .filter(Boolean);

    return cn(base, ...variantClasses);
  };
}

export default cn;
