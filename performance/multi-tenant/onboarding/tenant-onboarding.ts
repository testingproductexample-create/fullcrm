/**
 * Tenant Onboarding System
 * UAE Tailoring Business Platform
 */

import { 
  OnboardingFlow, 
  OnboardingStep, 
  OnboardingProgress, 
  OnboardingCondition,
  MultiTenantResponse,
  Tenant
} from '../types';
import { databaseService } from '../core/database/tenant-database';
import { cacheService } from '../core/cache/tenant-cache';
import { tenantValidationService } from '../core/validation/tenant-validation';

export class TenantOnboardingService {
  private defaultFlow: OnboardingFlow;

  constructor() {
    this.defaultFlow = this.createDefaultFlow();
  }

  /**
   * Start onboarding for new tenant
   */
  async startOnboarding(tenantId: string, flowId?: string): Promise<MultiTenantResponse<OnboardingProgress>> {
    try {
      const tenant = await databaseService.findOne('tenants', { id: tenantId });
      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found',
            timestamp: new Date()
          }
        };
      }

      const flow = flowId ? await this.getOnboardingFlow(flowId) : this.defaultFlow;
      if (!flow) {
        return {
          success: false,
          error: {
            code: 'FLOW_NOT_FOUND',
            message: 'Onboarding flow not found',
            timestamp: new Date()
          }
        };
      }

      // Create initial progress record
      const progress: OnboardingProgress = {
        tenantId,
        flowId: flow.id,
        currentStep: 1,
        completedSteps: [],
        startedAt: new Date(),
        data: {}
      };

      await databaseService.create('onboarding_progress', {
        id: this.generateId(),
        tenant_id: tenantId,
        flow_id: flow.id,
        current_step: 1,
        completed_steps: JSON.stringify([]),
        started_at: progress.startedAt,
        data: JSON.stringify({})
      });

      return {
        success: true,
        data: progress
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ONBOARDING_START_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Get current onboarding step
   */
  async getCurrentStep(tenantId: string): Promise<MultiTenantResponse<{
    step: OnboardingStep;
    progress: OnboardingProgress;
  }>> {
    try {
      const progress = await this.getProgress(tenantId);
      if (!progress.success || !progress.data) {
        return {
          success: false,
          error: {
            code: 'PROGRESS_NOT_FOUND',
            message: 'Onboarding progress not found',
            timestamp: new Date()
          }
        };
      }

      const flow = await this.getOnboardingFlow(progress.data.flowId);
      if (!flow) {
        return {
          success: false,
          error: {
            code: 'FLOW_NOT_FOUND',
            message: 'Onboarding flow not found',
            timestamp: new Date()
          }
        };
      }

      const currentStep = flow.steps.find(step => step.order === progress.data!.currentStep);
      if (!currentStep) {
        return {
          success: false,
          error: {
            code: 'STEP_NOT_FOUND',
            message: 'Current onboarding step not found',
            timestamp: new Date()
          }
        };
      }

      return {
        success: true,
        data: {
          step: currentStep,
          progress: progress.data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_STEP_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Complete onboarding step
   */
  async completeStep(
    tenantId: string, 
    stepId: string, 
    data: Record<string, any> = {}
  ): Promise<MultiTenantResponse<OnboardingProgress>> {
    try {
      const progress = await this.getProgress(tenantId);
      if (!progress.success || !progress.data) {
        return {
          success: false,
          error: {
            code: 'PROGRESS_NOT_FOUND',
            message: 'Onboarding progress not found',
            timestamp: new Date()
          }
        };
      }

      const flow = await this.getOnboardingFlow(progress.data.flowId);
      if (!flow) {
        return {
          success: false,
          error: {
            code: 'FLOW_NOT_FOUND',
            message: 'Onboarding flow not found',
            timestamp: new Date()
          }
        };
      }

      const step = flow.steps.find(s => s.id === stepId);
      if (!step) {
        return {
          success: false,
          error: {
            code: 'STEP_NOT_FOUND',
            message: 'Onboarding step not found',
            timestamp: new Date()
          }
        };
      }

      // Validate step completion
      const validation = await this.validateStepCompletion(step, data);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'STEP_VALIDATION_FAILED',
            message: 'Step completion validation failed',
            details: validation.errors,
            timestamp: new Date()
          }
        };
      }

      // Update progress
      const completedSteps = [...progress.data.completedSteps, step.order];
      const nextStep = this.getNextStep(flow, step.order);
      
      await databaseService.update('onboarding_progress', { tenant_id: tenantId }, {
        current_step: nextStep?.order || progress.data.currentStep,
        completed_steps: JSON.stringify(completedSteps),
        data: JSON.stringify({ ...progress.data.data, [stepId]: data }),
        updated_at: new Date()
      });

      // Check if onboarding is complete
      if (!nextStep) {
        await this.completeOnboarding(tenantId);
      }

      const updatedProgress = {
        ...progress.data,
        currentStep: nextStep?.order || progress.data.currentStep,
        completedSteps,
        data: { ...progress.data.data, [stepId]: data }
      };

      return {
        success: true,
        data: updatedProgress
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPLETE_STEP_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Skip onboarding step
   */
  async skipStep(tenantId: string, stepId: string, reason?: string): Promise<MultiTenantResponse<OnboardingProgress>> {
    try {
      const progress = await this.getProgress(tenantId);
      if (!progress.success || !progress.data) {
        return {
          success: false,
          error: {
            code: 'PROGRESS_NOT_FOUND',
            message: 'Onboarding progress not found',
            timestamp: new Date()
          }
        };
      }

      const flow = await this.getOnboardingFlow(progress.data.flowId);
      if (!flow) {
        return {
          success: false,
          error: {
            code: 'FLOW_NOT_FOUND',
            message: 'Onboarding flow not found',
            timestamp: new Date()
          }
        };
      }

      const step = flow.steps.find(s => s.id === stepId);
      if (!step) {
        return {
          success: false,
          error: {
            code: 'STEP_NOT_FOUND',
            message: 'Onboarding step not found',
            timestamp: new Date()
          }
        };
      }

      if (!step.canSkip) {
        return {
          success: false,
          error: {
            code: 'STEP_CANNOT_BE_SKIPPED',
            message: 'This step cannot be skipped',
            timestamp: new Date()
          }
        };
      }

      // Log skip reason
      await this.logStepSkip(tenantId, stepId, reason || 'User skipped step');

      // Move to next step
      return await this.completeStep(tenantId, stepId, { skipped: true, reason });
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SKIP_STEP_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Get onboarding progress
   */
  async getProgress(tenantId: string): Promise<MultiTenantResponse<OnboardingProgress | null>> {
    try {
      const record = await databaseService.findOne('onboarding_progress', { tenant_id: tenantId });
      if (!record) {
        return {
          success: true,
          data: null
        };
      }

      const progress: OnboardingProgress = {
        tenantId: record.tenant_id,
        flowId: record.flow_id,
        currentStep: record.current_step,
        completedSteps: JSON.parse(record.completed_steps || '[]'),
        startedAt: new Date(record.started_at),
        completedAt: record.completed_at ? new Date(record.completed_at) : undefined,
        data: JSON.parse(record.data || '{}')
      };

      return {
        success: true,
        data: progress
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_PROGRESS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Create custom onboarding flow
   */
  async createOnboardingFlow(flow: OnboardingFlow): Promise<MultiTenantResponse<OnboardingFlow>> {
    try {
      // Validate flow
      const validation = this.validateFlow(flow);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_FLOW',
            message: 'Invalid onboarding flow',
            details: validation.errors,
            timestamp: new Date()
          }
        };
      }

      // Check for conflicts
      const existing = await databaseService.findOne('onboarding_flows', { name: flow.name });
      if (existing) {
        return {
          success: false,
          error: {
            code: 'FLOW_NAME_EXISTS',
            message: 'Flow with this name already exists',
            timestamp: new Date()
          }
        };
      }

      // Save flow
      await databaseService.create('onboarding_flows', {
        id: flow.id,
        name: flow.name,
        steps: JSON.stringify(flow.steps),
        is_active: flow.isActive,
        target_audience: flow.targetAudience,
        estimated_duration: flow.estimatedDuration,
        required: flow.required,
        created_at: flow.createdAt || new Date()
      });

      return {
        success: true,
        data: flow
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_FLOW_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Get all onboarding flows
   */
  async getOnboardingFlows(): Promise<MultiTenantResponse<OnboardingFlow[]>> {
    try {
      const records = await databaseService.findMany('onboarding_flows', { is_active: true });
      
      const flows: OnboardingFlow[] = records.map(record => ({
        id: record.id,
        name: record.name,
        steps: JSON.parse(record.steps),
        isActive: record.is_active,
        targetAudience: record.target_audience,
        estimatedDuration: record.estimated_duration,
        required: record.required
      }));

      return {
        success: true,
        data: flows
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_FLOWS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Get onboarding analytics
   */
  async getOnboardingAnalytics(): Promise<MultiTenantResponse<{
    totalOnboarded: number;
    completionRate: number;
    averageTimeToComplete: number;
    stepAnalytics: Array<{
      stepId: string;
      stepName: string;
      completionRate: number;
      averageTime: number;
      skipRate: number;
    }>;
  }>> {
    try {
      // This would involve complex analytics queries in a real implementation
      const analytics = {
        totalOnboarded: 150,
        completionRate: 0.85,
        averageTimeToComplete: 25, // minutes
        stepAnalytics: [
          {
            stepId: 'company-setup',
            stepName: 'Company Setup',
            completionRate: 0.95,
            averageTime: 5,
            skipRate: 0.05
          },
          {
            stepId: 'configuration',
            stepName: 'Configuration',
            completionRate: 0.90,
            averageTime: 8,
            skipRate: 0.10
          }
        ]
      };

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Create default onboarding flow
   */
  private createDefaultFlow(): OnboardingFlow {
    return {
      id: 'default-onboarding',
      name: 'Default Tenant Onboarding',
      isActive: true,
      targetAudience: 'new_tenants',
      estimatedDuration: 30, // minutes
      required: true,
      steps: [
        {
          id: 'company-setup',
          order: 1,
          type: 'setup',
          title: 'Company Setup',
          description: 'Set up your company information and basic details',
          component: 'CompanySetup',
          isRequired: true,
          canSkip: false,
          data: {}
        },
        {
          id: 'branding',
          order: 2,
          type: 'configuration',
          title: 'Branding',
          description: 'Upload your logo and customize your brand colors',
          component: 'BrandingSetup',
          isRequired: true,
          canSkip: true,
          data: {}
        },
        {
          id: 'team-setup',
          order: 3,
          type: 'setup',
          title: 'Team Setup',
          description: 'Add team members and set up user roles',
          component: 'TeamSetup',
          isRequired: true,
          canSkip: false,
          data: {}
        },
        {
          id: 'integration',
          order: 4,
          type: 'integration',
          title: 'Integrations',
          description: 'Connect with third-party services and tools',
          component: 'IntegrationSetup',
          isRequired: false,
          canSkip: true,
          data: {}
        },
        {
          id: 'verification',
          order: 5,
          type: 'verification',
          title: 'Verification',
          description: 'Verify your account and complete setup',
          component: 'AccountVerification',
          isRequired: true,
          canSkip: false,
          data: {}
        }
      ]
    };
  }

  /**
   * Get onboarding flow by ID
   */
  private async getOnboardingFlow(flowId: string): Promise<OnboardingFlow | null> {
    const record = await databaseService.findOne('onboarding_flows', { id: flowId });
    if (!record) return null;

    return {
      id: record.id,
      name: record.name,
      steps: JSON.parse(record.steps),
      isActive: record.is_active,
      targetAudience: record.target_audience,
      estimatedDuration: record.estimated_duration,
      required: record.required
    };
  }

  /**
   * Validate step completion
   */
  private async validateStepCompletion(step: OnboardingStep, data: Record<string, any>): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check required data
    if (step.isRequired && Object.keys(data).length === 0) {
      errors.push('Required step must have completion data');
    }

    // Check step-specific validation
    if (step.type === 'setup' && step.id === 'company-setup') {
      if (!data.companyName) errors.push('Company name is required');
      if (!data.industry) errors.push('Industry selection is required');
    }

    if (step.type === 'configuration' && step.id === 'branding') {
      if (data.uploadLogo && !data.logoUrl) errors.push('Logo must be uploaded');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get next step in flow
   */
  private getNextStep(flow: OnboardingFlow, currentOrder: number): OnboardingStep | null {
    return flow.steps.find(step => step.order === currentOrder + 1) || null;
  }

  /**
   * Complete onboarding
   */
  private async completeOnboarding(tenantId: string): Promise<void> {
    await databaseService.update('onboarding_progress', { tenant_id: tenantId }, {
      completed_at: new Date(),
      updated_at: new Date()
    });

    // Update tenant status if needed
    await databaseService.update('tenants', { id: tenantId }, {
      onboarding_completed: true,
      updated_at: new Date()
    });
  }

  /**
   * Log step skip
   */
  private async logStepSkip(tenantId: string, stepId: string, reason: string): Promise<void> {
    // In a real implementation, would log to analytics
    console.log(`Tenant ${tenantId} skipped step ${stepId}: ${reason}`);
  }

  /**
   * Validate flow
   */
  private validateFlow(flow: OnboardingFlow): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!flow.name || flow.name.trim().length === 0) {
      errors.push('Flow name is required');
    }

    if (!flow.steps || flow.steps.length === 0) {
      errors.push('Flow must have at least one step');
    }

    // Validate step order continuity
    const orders = flow.steps.map(step => step.order).sort((a, b) => a - b);
    for (let i = 1; i < orders.length; i++) {
      if (orders[i] !== orders[i - 1] + 1) {
        errors.push('Step orders must be continuous');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate ID
   */
  private generateId(): string {
    return `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const tenantOnboardingService = new TenantOnboardingService();
