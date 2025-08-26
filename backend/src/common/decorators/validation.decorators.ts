import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validation decorator for image URLs
 */
export function IsImageUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isImageUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'Please provide a valid image URL (jpg, jpeg, png, webp)',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (!value) return true; // Optional field
          const imageUrlPattern = /\.(jpg|jpeg|png|webp)(\?.*)?$/i;
          return typeof value === 'string' && imageUrlPattern.test(value);
        },
      },
    });
  };
}

/**
 * Custom validation decorator for recipe names/titles
 */
export function IsRecipeTitle(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isRecipeTitle',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message:
          'Recipe title must be 3-200 characters and contain only letters, numbers, spaces, and common punctuation',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (!value) return false;
          // Allow letters, numbers, spaces, apostrophes, hyphens, parentheses, and basic punctuation
          const titlePattern = /^[a-zA-Z0-9\s\-'().,&!]+$/;
          return (
            typeof value === 'string' &&
            value.length >= 3 &&
            value.length <= 200 &&
            titlePattern.test(value)
          );
        },
      },
    });
  };
}

/**
 * Custom validation decorator for ingredient names
 */
export function IsIngredientName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIngredientName',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message:
          'Ingredient name must be 1-100 characters and contain only letters, numbers, spaces, and basic punctuation',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (!value) return false;
          const namePattern = /^[a-zA-Z0-9\s\-'().,&]+$/;
          return (
            typeof value === 'string' &&
            value.length >= 1 &&
            value.length <= 100 &&
            namePattern.test(value)
          );
        },
      },
    });
  };
}

/**
 * Custom validation decorator for cooking time ranges
 */
export function IsCookingTime(
  min: number = 1,
  max: number = 960,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCookingTime',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [min, max],
      options: {
        message: `Cooking time must be between ${min} and ${max} minutes (${Math.floor(max / 60)} hours max)`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [minTime, maxTime] = args.constraints as [number, number];
          return (
            typeof value === 'number' &&
            value >= minTime &&
            value <= maxTime &&
            Number.isInteger(value)
          );
        },
      },
    });
  };
}

/**
 * Custom validation decorator for serving sizes
 */
export function IsValidServings(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidServings',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'Servings must be a whole number between 1 and 50',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          return (
            typeof value === 'number' &&
            value >= 1 &&
            value <= 50 &&
            Number.isInteger(value)
          );
        },
      },
    });
  };
}

/**
 * Custom validation decorator for ingredient quantities
 */
export function IsIngredientQuantity(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIngredientQuantity',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message:
          'Ingredient quantity must be a positive number (max 10,000 units)',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          return (
            typeof value === 'number' &&
            value > 0 &&
            value <= 10000 &&
            !isNaN(value)
          );
        },
      },
    });
  };
}

/**
 * Custom validation decorator for nutritional values
 */
export function IsNutritionalValue(
  maxValue: number,
  fieldName: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNutritionalValue',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxValue, fieldName],
      options: {
        message: `${fieldName} must be a non-negative number (max ${maxValue}g)`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [max] = args.constraints as [number, string];
          if (value === undefined || value === null) return true; // Optional field
          return (
            typeof value === 'number' &&
            value >= 0 &&
            value <= max &&
            !isNaN(value)
          );
        },
      },
    });
  };
}

/**
 * Custom validation decorator for tags array
 */
export function IsValidTags(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidTags',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message:
          'Tags must be an array of 1-50 character strings (max 20 tags)',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (!value) return true; // Optional field
          if (!Array.isArray(value) || value.length > 20) return false;

          return value.every(
            (tag: any) =>
              typeof tag === 'string' &&
              tag.length >= 1 &&
              tag.length <= 50 &&
              /^[a-zA-Z0-9\s-]+$/.test(tag.trim()),
          );
        },
      },
    });
  };
}
