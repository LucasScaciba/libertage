/**
 * Age Calculator Utility
 * 
 * Provides functions to calculate age from birthdate and validate age ranges.
 * Used for profile page restructure to replace age dropdown with birthdate picker.
 */

export interface AgeValidationResult {
  valid: boolean;
  age: number;
  error?: string;
}

/**
 * Calculate age from birthdate
 * 
 * @param birthdate - Date string or Date object
 * @returns Age in years
 */
export function calculateAge(birthdate: string | Date): number {
  const birth = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // Adjust if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validate age range (18-60 years)
 * 
 * @param birthdate - Date string or Date object
 * @returns Validation result with age and error message if invalid
 */
export function validateAgeRange(birthdate: string | Date): AgeValidationResult {
  const age = calculateAge(birthdate);
  
  if (age < 18) {
    return {
      valid: false,
      age,
      error: "Você deve ter pelo menos 18 anos"
    };
  }
  
  if (age > 60) {
    return {
      valid: false,
      age,
      error: "A idade máxima permitida é 60 anos"
    };
  }
  
  return {
    valid: true,
    age
  };
}

/**
 * Validate birthdate format and age range
 * 
 * @param birthdate - Date string in ISO format
 * @returns Validation result
 */
export function validateBirthdate(birthdate: string): AgeValidationResult {
  // Check if date is valid
  const date = new Date(birthdate);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      age: 0,
      error: "Data de nascimento inválida"
    };
  }
  
  // Check if date is in the future
  if (date > new Date()) {
    return {
      valid: false,
      age: 0,
      error: "Data de nascimento não pode ser no futuro"
    };
  }
  
  // Validate age range
  return validateAgeRange(date);
}
