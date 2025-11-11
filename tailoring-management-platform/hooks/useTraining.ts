// Training & Certification Management System Hooks
// Created: 2025-11-11 10:47:35
// Description: React Query hooks for training system data management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type {
  // Existing table types
  TrainingProgram, TrainingProgramInsert, TrainingProgramUpdate,
  EmployeeTraining, EmployeeTrainingInsert, EmployeeTrainingUpdate,
  EmployeeSkill, EmployeeSkillInsert, EmployeeSkillUpdate,
  EmployeeCertification, EmployeeCertificationInsert, EmployeeCertificationUpdate,
  // New table types
  TcCourseModule, TcCourseModuleInsert, TcCourseModuleUpdate,
  TcTrainingAssessment, TcTrainingAssessmentInsert, TcTrainingAssessmentUpdate,
  TcTrainingSession, TcTrainingSessionInsert, TcTrainingSessionUpdate,
  TcSkillAssessment, TcSkillAssessmentInsert, TcSkillAssessmentUpdate,
  TcCareerPath, TcCareerPathInsert, TcCareerPathUpdate,
  TcEmployeeCareerProgress, TcEmployeeCareerProgressInsert, TcEmployeeCareerProgressUpdate,
  TcTrainingAnalytics, TcTrainingAnalyticsInsert, TcTrainingAnalyticsUpdate,
  TcComplianceTracking, TcComplianceTrackingInsert, TcComplianceTrackingUpdate,
  TcLearningPreferences, TcLearningPreferencesInsert, TcLearningPreferencesUpdate,
  // Analytics types
  TrainingDashboardStats, EmployeeTrainingProfile, TrainingCompletionTrend,
  SkillGapAnalysis, CertificationRenewalAlert, TrainingROIAnalysis,
  TrainingFilters, TrainingPagination
} from '@/types/training';

// ==================== QUERY KEYS ====================
export const trainingKeys = {
  all: ['training'] as const,
  // Existing tables
  programs: () => [...trainingKeys.all, 'programs'] as const,
  program: (id: string) => [...trainingKeys.programs(), id] as const,
  employeeTrainings: () => [...trainingKeys.all, 'employee-trainings'] as const,
  employeeTraining: (id: string) => [...trainingKeys.employeeTrainings(), id] as const,
  employeeSkills: () => [...trainingKeys.all, 'employee-skills'] as const,
  employeeSkill: (id: string) => [...trainingKeys.employeeSkills(), id] as const,
  certifications: () => [...trainingKeys.all, 'certifications'] as const,
  certification: (id: string) => [...trainingKeys.certifications(), id] as const,
  // New tables
  modules: () => [...trainingKeys.all, 'modules'] as const,
  module: (id: string) => [...trainingKeys.modules(), id] as const,
  assessments: () => [...trainingKeys.all, 'assessments'] as const,
  assessment: (id: string) => [...trainingKeys.assessments(), id] as const,
  sessions: () => [...trainingKeys.all, 'sessions'] as const,
  session: (id: string) => [...trainingKeys.sessions(), id] as const,
  skillAssessments: () => [...trainingKeys.all, 'skill-assessments'] as const,
  skillAssessment: (id: string) => [...trainingKeys.skillAssessments(), id] as const,
  careerPaths: () => [...trainingKeys.all, 'career-paths'] as const,
  careerPath: (id: string) => [...trainingKeys.careerPaths(), id] as const,
  careerProgress: () => [...trainingKeys.all, 'career-progress'] as const,
  analytics: () => [...trainingKeys.all, 'analytics'] as const,
  compliance: () => [...trainingKeys.all, 'compliance'] as const,
  preferences: () => [...trainingKeys.all, 'preferences'] as const,
  // Dashboard and aggregated data
  dashboard: () => [...trainingKeys.all, 'dashboard'] as const,
  trends: () => [...trainingKeys.all, 'trends'] as const,
  skillGaps: () => [...trainingKeys.all, 'skill-gaps'] as const,
  renewalAlerts: () => [...trainingKeys.all, 'renewal-alerts'] as const,
  roi: () => [...trainingKeys.all, 'roi'] as const,
};

// ==================== TRAINING PROGRAMS (existing table) ====================

export function useTrainingPrograms(filters?: TrainingFilters, pagination?: TrainingPagination) {
  return useQuery({
    queryKey: [...trainingKeys.programs(), filters, pagination],
    queryFn: async () => {
      let query = supabase
        .from('training_programs')
        .select('*');

      // Apply filters
      if (filters?.program_type) query = query.eq('training_type', filters.program_type);
      if (filters?.status) query = query.eq('is_active', filters.status === 'active');
      if (filters?.mandatory !== undefined) query = query.eq('is_mandatory', filters.mandatory);
      if (filters?.search) {
        query = query.or(`program_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination
      if (pagination) {
        const { page, limit, sort_by = 'created_at', sort_order = 'desc' } = pagination;
        query = query
          .range((page - 1) * limit, page * limit - 1)
          .order(sort_by, { ascending: sort_order === 'asc' });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TrainingProgram[];
    },
  });
}

export function useTrainingProgram(id: string) {
  return useQuery({
    queryKey: trainingKeys.program(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_programs')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as TrainingProgram;
    },
    enabled: !!id,
  });
}

export function useTrainingProgramMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (program: TrainingProgramInsert) => {
      const { data, error } = await supabase
        .from('training_programs')
        .insert(program)
        .select()
        .single();
      if (error) throw error;
      return data as TrainingProgram;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.programs() });
      toast.success('Training program created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create training program: ' + error.message);
    },
  });
}

export function useUpdateTrainingProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TrainingProgramUpdate }) => {
      const { data, error } = await supabase
        .from('training_programs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as TrainingProgram;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.programs() });
      queryClient.invalidateQueries({ queryKey: trainingKeys.program(data.id) });
      toast.success('Training program updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update training program: ' + error.message);
    },
  });
}

// ==================== EMPLOYEE TRAINING (existing table) ====================

export function useEmployeeTrainings(employeeId?: string, filters?: TrainingFilters) {
  return useQuery({
    queryKey: [...trainingKeys.employeeTrainings(), employeeId, filters],
    queryFn: async () => {
      let query = supabase
        .from('employee_training')
        .select(`
          *,
          training_programs!inner(program_name, program_category, training_type),
          employees!inner(employee_code, first_name, last_name)
        `);

      if (employeeId) query = query.eq('employee_id', employeeId);
      if (filters?.status) query = query.eq('training_status', filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data as (EmployeeTraining & {
        training_programs: { program_name: string; program_category: string; training_type: string };
        employees: { employee_code: string; first_name: string; last_name: string };
      })[];
    },
  });
}

export function useEnrollEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollment: EmployeeTrainingInsert) => {
      const { data, error } = await supabase
        .from('employee_training')
        .insert(enrollment)
        .select()
        .single();
      if (error) throw error;
      return data as EmployeeTraining;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.employeeTrainings() });
      toast.success('Employee enrolled in training successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to enroll employee: ' + error.message);
    },
  });
}

export function useUpdateTrainingProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: EmployeeTrainingUpdate }) => {
      const { data, error } = await supabase
        .from('employee_training')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as EmployeeTraining;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.employeeTrainings() });
      toast.success('Training progress updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update training progress: ' + error.message);
    },
  });
}

// ==================== EMPLOYEE SKILLS (existing table) ====================

export function useEmployeeSkills(employeeId?: string) {
  return useQuery({
    queryKey: [...trainingKeys.employeeSkills(), employeeId],
    queryFn: async () => {
      let query = supabase
        .from('employee_skills')
        .select('*');

      if (employeeId) query = query.eq('employee_id', employeeId);

      const { data, error } = await query;
      if (error) throw error;
      return data as EmployeeSkill[];
    },
  });
}

export function useSkillMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skill: EmployeeSkillInsert) => {
      const { data, error } = await supabase
        .from('employee_skills')
        .insert(skill)
        .select()
        .single();
      if (error) throw error;
      return data as EmployeeSkill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.employeeSkills() });
      toast.success('Skill added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add skill: ' + error.message);
    },
  });
}

// ==================== EMPLOYEE CERTIFICATIONS (existing table) ====================

export function useEmployeeCertifications(employeeId?: string) {
  return useQuery({
    queryKey: [...trainingKeys.certifications(), employeeId],
    queryFn: async () => {
      let query = supabase
        .from('employee_certifications')
        .select('*');

      if (employeeId) query = query.eq('employee_id', employeeId);

      const { data, error } = await query;
      if (error) throw error;
      return data as EmployeeCertification[];
    },
  });
}

export function useCertificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (certification: EmployeeCertificationInsert) => {
      const { data, error } = await supabase
        .from('employee_certifications')
        .insert(certification)
        .select()
        .single();
      if (error) throw error;
      return data as EmployeeCertification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.certifications() });
      toast.success('Certification added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add certification: ' + error.message);
    },
  });
}

// ==================== COURSE MODULES (new table) ====================

export function useCourseModules(trainingProgramId?: string) {
  return useQuery({
    queryKey: [...trainingKeys.modules(), trainingProgramId],
    queryFn: async () => {
      let query = supabase
        .from('tc_course_modules')
        .select('*')
        .order('module_order');

      if (trainingProgramId) query = query.eq('training_program_id', trainingProgramId);

      const { data, error } = await query;
      if (error) throw error;
      return data as TcCourseModule[];
    },
    enabled: !!trainingProgramId,
  });
}

export function useModuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (module: TcCourseModuleInsert) => {
      const { data, error } = await supabase
        .from('tc_course_modules')
        .insert(module)
        .select()
        .single();
      if (error) throw error;
      return data as TcCourseModule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.modules() });
      toast.success('Course module created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create course module: ' + error.message);
    },
  });
}

// ==================== TRAINING ASSESSMENTS (new table) ====================

export function useTrainingAssessments(trainingProgramId?: string) {
  return useQuery({
    queryKey: [...trainingKeys.assessments(), trainingProgramId],
    queryFn: async () => {
      let query = supabase
        .from('tc_training_assessments')
        .select('*');

      if (trainingProgramId) query = query.eq('training_program_id', trainingProgramId);

      const { data, error } = await query;
      if (error) throw error;
      return data as TcTrainingAssessment[];
    },
  });
}

export function useAssessmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessment: TcTrainingAssessmentInsert) => {
      const { data, error } = await supabase
        .from('tc_training_assessments')
        .insert(assessment)
        .select()
        .single();
      if (error) throw error;
      return data as TcTrainingAssessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.assessments() });
      toast.success('Assessment created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create assessment: ' + error.message);
    },
  });
}

// ==================== TRAINING SESSIONS (new table) ====================

export function useTrainingSessions(trainingProgramId?: string) {
  return useQuery({
    queryKey: [...trainingKeys.sessions(), trainingProgramId],
    queryFn: async () => {
      let query = supabase
        .from('tc_training_sessions')
        .select(`
          *,
          training_programs!inner(program_name),
          employees(first_name, last_name)
        `)
        .order('session_date');

      if (trainingProgramId) query = query.eq('training_program_id', trainingProgramId);

      const { data, error } = await query;
      if (error) throw error;
      return data as (TcTrainingSession & {
        training_programs: { program_name: string };
        employees?: { first_name: string; last_name: string };
      })[];
    },
  });
}

export function useSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: TcTrainingSessionInsert) => {
      const { data, error } = await supabase
        .from('tc_training_sessions')
        .insert(session)
        .select()
        .single();
      if (error) throw error;
      return data as TcTrainingSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.sessions() });
      toast.success('Training session scheduled successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to schedule training session: ' + error.message);
    },
  });
}

// ==================== CAREER PATHS (new table) ====================

export function useCareerPaths() {
  return useQuery({
    queryKey: trainingKeys.careerPaths(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tc_career_paths')
        .select('*')
        .eq('is_active', true)
        .order('path_name');
      if (error) throw error;
      return data as TcCareerPath[];
    },
  });
}

export function useCareerPathMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (careerPath: TcCareerPathInsert) => {
      const { data, error } = await supabase
        .from('tc_career_paths')
        .insert(careerPath)
        .select()
        .single();
      if (error) throw error;
      return data as TcCareerPath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.careerPaths() });
      toast.success('Career path created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create career path: ' + error.message);
    },
  });
}

// ==================== COMPLIANCE TRACKING (new table) ====================

export function useComplianceTracking(employeeId?: string) {
  return useQuery({
    queryKey: [...trainingKeys.compliance(), employeeId],
    queryFn: async () => {
      let query = supabase
        .from('tc_compliance_tracking')
        .select(`
          *,
          employees!inner(employee_code, first_name, last_name, department)
        `)
        .order('deadline');

      if (employeeId) query = query.eq('employee_id', employeeId);

      const { data, error } = await query;
      if (error) throw error;
      return data as (TcComplianceTracking & {
        employees: { employee_code: string; first_name: string; last_name: string; department: string };
      })[];
    },
  });
}

export function useComplianceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (compliance: TcComplianceTrackingInsert) => {
      const { data, error } = await supabase
        .from('tc_compliance_tracking')
        .insert(compliance)
        .select()
        .single();
      if (error) throw error;
      return data as TcComplianceTracking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.compliance() });
      toast.success('Compliance tracking added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add compliance tracking: ' + error.message);
    },
  });
}

// ==================== SKILL ASSESSMENTS (new table) ====================

export function useSkillAssessments(employeeId?: string, skillId?: string) {
  return useQuery({
    queryKey: [...trainingKeys.skillAssessments(), employeeId, skillId],
    queryFn: async () => {
      let query = supabase
        .from('tc_skill_assessments')
        .select(`
          *,
          employees!inner(employee_code, first_name, last_name, department),
          employee_skills!inner(skill_name, skill_category)
        `)
        .order('assessment_date', { ascending: false });

      if (employeeId) query = query.eq('employee_id', employeeId);
      if (skillId) query = query.eq('skill_id', skillId);

      const { data, error } = await query;
      if (error) throw error;
      return data as (TcSkillAssessment & {
        employees: { employee_code: string; first_name: string; last_name: string; department: string };
        employee_skills: { skill_name: string; skill_category: string };
      })[];
    },
  });
}

export function useSkillAssessment(id: string) {
  return useQuery({
    queryKey: [...trainingKeys.skillAssessment(id)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tc_skill_assessments')
        .select(`
          *,
          employees!inner(employee_code, first_name, last_name, department),
          employee_skills!inner(skill_name, skill_category)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as TcSkillAssessment & {
        employees: { employee_code: string; first_name: string; last_name: string; department: string };
        employee_skills: { skill_name: string; skill_category: string };
      };
    },
    enabled: !!id,
  });
}

export function useSkillAssessmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessment: TcSkillAssessmentInsert) => {
      const { data, error } = await supabase
        .from('tc_skill_assessments')
        .insert(assessment)
        .select()
        .single();
      if (error) throw error;
      return data as TcSkillAssessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.skillAssessments() });
      toast.success('Skill assessment created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create skill assessment: ' + error.message);
    },
  });
}

export function useUpdateSkillAssessmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TcSkillAssessmentUpdate) => {
      const { data, error } = await supabase
        .from('tc_skill_assessments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as TcSkillAssessment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.skillAssessments() });
      queryClient.invalidateQueries({ queryKey: trainingKeys.skillAssessment(data.id) });
      toast.success('Skill assessment updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update skill assessment: ' + error.message);
    },
  });
}

// ==================== DASHBOARD & ANALYTICS ====================

export function useTrainingDashboardStats() {
  return useQuery({
    queryKey: trainingKeys.dashboard(),
    queryFn: async () => {
      try {
        // Get dashboard stats from multiple tables
        const [programsResult, trainingsResult, certificationsResult] = await Promise.all([
          supabase.from('training_programs').select('id', { count: 'exact', head: true }),
          supabase.from('employee_training').select('training_status', { count: 'exact' }),
          supabase.from('employee_certifications').select('expiry_date'),
        ]);

        const totalPrograms = programsResult.count || 0;
        
        const trainings = trainingsResult.data || [];
        const activeEnrollments = trainings.filter(t => t.training_status === 'in_progress').length;
        const completedTrainings = trainings.filter(t => t.training_status === 'completed').length;
        
        const certifications = certificationsResult.data || [];
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        const pendingCertifications = certifications.filter(cert => {
          if (!cert.expiry_date) return false;
          const expiryDate = new Date(cert.expiry_date);
          return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
        }).length;

        const complianceRate = trainings.length > 0 ? (completedTrainings / trainings.length) * 100 : 0;
        const avgCompletionTime = 45; // This would need a more complex calculation

        return {
          total_programs: totalPrograms,
          active_enrollments: activeEnrollments,
          completed_trainings: completedTrainings,
          pending_certifications: pendingCertifications,
          compliance_rate: Math.round(complianceRate),
          average_completion_time: avgCompletionTime,
        } as TrainingDashboardStats;
      } catch (error) {
        throw error;
      }
    },
  });
}

export function useTrainingCompletionTrends(period: 'week' | 'month' | 'quarter' = 'month') {
  return useQuery({
    queryKey: [...trainingKeys.trends(), period],
    queryFn: async () => {
      // This would need a more sophisticated implementation with date grouping
      // For now, returning mock data structure
      const mockTrends: TrainingCompletionTrend[] = [
        { period: '2024-01', completed: 25, enrolled: 35, completion_rate: 71 },
        { period: '2024-02', completed: 32, enrolled: 40, completion_rate: 80 },
        { period: '2024-03', completed: 28, enrolled: 33, completion_rate: 85 },
      ];
      return mockTrends;
    },
  });
}

export function useCertificationRenewalAlerts() {
  return useQuery({
    queryKey: trainingKeys.renewalAlerts(),
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from('employee_certifications')
        .select(`
          *,
          employees!inner(employee_code, first_name, last_name)
        `)
        .lte('expiry_date', thirtyDaysFromNow.toISOString())
        .order('expiry_date');

      if (error) throw error;

      const alerts: CertificationRenewalAlert[] = data.map(cert => {
        const now = new Date();
        const expiryDate = new Date(cert.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let priority: 'high' | 'medium' | 'low' = 'low';
        if (daysUntilExpiry <= 7) priority = 'high';
        else if (daysUntilExpiry <= 14) priority = 'medium';

        return {
          employee_id: cert.employee_id,
          employee_name: `${cert.employees.first_name} ${cert.employees.last_name}`,
          certification_name: cert.certification_name,
          expiry_date: cert.expiry_date,
          days_until_expiry: daysUntilExpiry,
          priority,
        };
      });

      return alerts;
    },
  });
}

// ==================== SKILL GAP ANALYSIS ====================

export function useSkillGapAnalysis() {
  return useQuery({
    queryKey: trainingKeys.skillGaps(),
    queryFn: async () => {
      // This would require a complex query joining skills, requirements, and current levels
      // For now, returning mock data structure
      const mockGaps: SkillGapAnalysis[] = [
        {
          skill_category: 'Tailoring Techniques',
          required_level: 'advanced',
          current_avg_level: 'intermediate',
          gap_percentage: 35,
          affected_employees: 12,
          recommended_training: ['Advanced Tailoring Workshop', 'Master Craftsman Program'],
        },
        {
          skill_category: 'Customer Service',
          required_level: 'intermediate',
          current_avg_level: 'beginner',
          gap_percentage: 45,
          affected_employees: 8,
          recommended_training: ['Customer Excellence Training', 'Communication Skills'],
        },
      ];
      return mockGaps;
    },
  });
}

// ==================== LEARNING PREFERENCES ====================

export function useLearningPreferences(employeeId: string) {
  return useQuery({
    queryKey: [...trainingKeys.preferences(), employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tc_learning_preferences')
        .select('*')
        .eq('employee_id', employeeId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
      return data as TcLearningPreferences | null;
    },
    enabled: !!employeeId,
  });
}

export function useLearningPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: TcLearningPreferencesInsert) => {
      const { data, error } = await supabase
        .from('tc_learning_preferences')
        .upsert(preferences)
        .select()
        .single();
      if (error) throw error;
      return data as TcLearningPreferences;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.preferences() });
      toast.success('Learning preferences updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update learning preferences: ' + error.message);
    },
  });
}