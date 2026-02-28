/**
 * Config Parser for Plans and Features
 * Validates: Requirements 26.1, 26.2, 26.4, 26.5, 26.6
 */

export interface PlanConfig {
  code: string;
  name: string;
  price: number;
  currency: string;
  max_photos: number;
  max_videos: number;
  stripe_price_id?: string;
}

export interface FeatureConfig {
  group_name: string;
  feature_name: string;
  display_order: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class ConfigParser {
  /**
   * Parse plans configuration from JSON
   */
  static parsePlans(json: string): PlanConfig[] {
    try {
      const data = JSON.parse(json);
      if (!Array.isArray(data)) {
        throw new Error("Plans config must be an array");
      }
      return data;
    } catch (error: any) {
      throw new Error(`Failed to parse plans config: ${error.message}`);
    }
  }

  /**
   * Parse features configuration from JSON
   */
  static parseFeatures(json: string): FeatureConfig[] {
    try {
      const data = JSON.parse(json);
      if (!Array.isArray(data)) {
        throw new Error("Features config must be an array");
      }
      return data;
    } catch (error: any) {
      throw new Error(`Failed to parse features config: ${error.message}`);
    }
  }

  /**
   * Validate plan configuration
   */
  static validatePlanConfig(plan: PlanConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!plan.code || typeof plan.code !== "string") {
      errors.push({ field: "code", message: "Code is required and must be a string" });
    }

    if (!plan.name || typeof plan.name !== "string") {
      errors.push({ field: "name", message: "Name is required and must be a string" });
    }

    if (typeof plan.price !== "number" || plan.price < 0) {
      errors.push({ field: "price", message: "Price must be a non-negative number" });
    }

    if (!plan.currency || typeof plan.currency !== "string") {
      errors.push({ field: "currency", message: "Currency is required and must be a string" });
    }

    if (typeof plan.max_photos !== "number" || plan.max_photos < 0) {
      errors.push({ field: "max_photos", message: "max_photos must be a non-negative number" });
    }

    if (typeof plan.max_videos !== "number" || plan.max_videos < 0) {
      errors.push({ field: "max_videos", message: "max_videos must be a non-negative number" });
    }

    return errors;
  }

  /**
   * Validate feature configuration
   */
  static validateFeatureConfig(feature: FeatureConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!feature.group_name || typeof feature.group_name !== "string") {
      errors.push({ field: "group_name", message: "group_name is required and must be a string" });
    }

    if (!feature.feature_name || typeof feature.feature_name !== "string") {
      errors.push({ field: "feature_name", message: "feature_name is required and must be a string" });
    }

    if (typeof feature.display_order !== "number" || feature.display_order < 0) {
      errors.push({ field: "display_order", message: "display_order must be a non-negative number" });
    }

    return errors;
  }

  /**
   * Pretty print plans configuration
   */
  static prettyPrintPlans(plans: PlanConfig[]): string {
    return JSON.stringify(plans, null, 2);
  }

  /**
   * Pretty print features configuration
   */
  static prettyPrintFeatures(features: FeatureConfig[]): string {
    return JSON.stringify(features, null, 2);
  }
}
