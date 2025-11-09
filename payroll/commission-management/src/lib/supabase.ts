import { createClient } from '@supabase/supabase-js';

// Types for Supabase database
export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          name: string;
          email: string;
          department: string;
          position: string;
          base_salary: number;
          hire_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          department: string;
          position: string;
          base_salary: number;
          hire_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          department?: string;
          position?: string;
          base_salary?: number;
          hire_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      commission_structures: {
        Row: {
          id: string;
          name: string;
          type: 'percentage' | 'tiered' | 'fixed';
          base_rate: number;
          bonus_threshold?: number;
          bonus_rate?: number;
          tier_rates?: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'percentage' | 'tiered' | 'fixed';
          base_rate: number;
          bonus_threshold?: number;
          bonus_rate?: number;
          tier_rates?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'percentage' | 'tiered' | 'fixed';
          base_rate?: number;
          bonus_threshold?: number;
          bonus_rate?: number;
          tier_rates?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales_data: {
        Row: {
          id: string;
          employee_id: string;
          order_id: string;
          sale_amount: number;
          commission_amount?: number;
          date: string;
          status: 'pending' | 'approved' | 'paid';
          approved_date?: string;
          paid_date?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          order_id: string;
          sale_amount: number;
          commission_amount?: number;
          date: string;
          status?: 'pending' | 'approved' | 'paid';
          approved_date?: string;
          paid_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          order_id?: string;
          sale_amount?: number;
          commission_amount?: number;
          date?: string;
          status?: 'pending' | 'approved' | 'paid';
          approved_date?: string;
          paid_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      commission_payments: {
        Row: {
          id: string;
          employee_id: string;
          period: string;
          total_amount: number;
          method: 'bank' | 'check' | 'cash';
          status: 'pending' | 'processing' | 'completed';
          processed_date?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          period: string;
          total_amount: number;
          method: 'bank' | 'check' | 'cash';
          status?: 'pending' | 'processing' | 'completed';
          processed_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          period?: string;
          total_amount?: number;
          method?: 'bank' | 'check' | 'cash';
          status?: 'pending' | 'processing' | 'completed';
          processed_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      commission_settings: {
        Row: {
          id: string;
          employee_id: string;
          commission_rate: number;
          target_amount: number;
          bonus_threshold: number;
          bonus_rate: number;
          min_qualifying_amount: number;
          payment_frequency: 'monthly' | 'quarterly' | 'yearly';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          commission_rate: number;
          target_amount: number;
          bonus_threshold: number;
          bonus_rate: number;
          min_qualifying_amount: number;
          payment_frequency: 'monthly' | 'quarterly' | 'yearly';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          commission_rate?: number;
          target_amount?: number;
          bonus_threshold?: number;
          bonus_rate?: number;
          min_qualifying_amount?: number;
          payment_frequency?: 'monthly' | 'quarterly' | 'yearly';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Initialize Supabase client
// Note: In production, these would come from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Employee service
export const employeeService = {
  async getAll() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(employee: Database['public']['Tables']['employees']['Insert']) {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Database['public']['Tables']['employees']['Update']) {
    const { data, error } = await supabase
      .from('employees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Commission structures service
export const commissionStructureService = {
  async getAll() {
    const { data, error } = await supabase
      .from('commission_structures')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async getActive() {
    const { data, error } = await supabase
      .from('commission_structures')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('commission_structures')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(structure: Database['public']['Tables']['commission_structures']['Insert']) {
    const { data, error } = await supabase
      .from('commission_structures')
      .insert(structure)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Database['public']['Tables']['commission_structures']['Update']) {
    const { data, error } = await supabase
      .from('commission_structures')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('commission_structures')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Sales data service
export const salesDataService = {
  async getAll(filters?: {
    employeeId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    let query = supabase
      .from('sales_data')
      .select(`
        *,
        employees (
          id,
          name,
          email,
          department,
          position
        )
      `)
      .order('date', { ascending: false });

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    
    if (filters?.dateTo) {
      query = query.lte('date', filters.dateTo);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('sales_data')
      .select(`
        *,
        employees (
          id,
          name,
          email,
          department,
          position
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(sale: Database['public']['Tables']['sales_data']['Insert']) {
    const { data, error } = await supabase
      .from('sales_data')
      .insert(sale)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Database['public']['Tables']['sales_data']['Update']) {
    const { data, error } = await supabase
      .from('sales_data')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('sales_data')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async bulkUpdate(ids: string[], updates: Partial<Database['public']['Tables']['sales_data']['Update']>) {
    const { data, error } = await supabase
      .from('sales_data')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();
    
    if (error) throw error;
    return data;
  }
};

// Commission payments service
export const commissionPaymentService = {
  async getAll(filters?: {
    employeeId?: string;
    status?: string;
    period?: string;
  }) {
    let query = supabase
      .from('commission_payments')
      .select(`
        *,
        employees (
          id,
          name,
          email,
          department,
          position
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.period) {
      query = query.eq('period', filters.period);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('commission_payments')
      .select(`
        *,
        employees (
          id,
          name,
          email,
          department,
          position
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(payment: Database['public']['Tables']['commission_payments']['Insert']) {
    const { data, error } = await supabase
      .from('commission_payments')
      .insert(payment)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Database['public']['Tables']['commission_payments']['Update']) {
    const { data, error } = await supabase
      .from('commission_payments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async bulkUpdate(ids: string[], updates: Partial<Database['public']['Tables']['commission_payments']['Update']>) {
    const { data, error } = await supabase
      .from('commission_payments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();
    
    if (error) throw error;
    return data;
  }
};

// Commission settings service
export const commissionSettingsService = {
  async getByEmployeeId(employeeId: string) {
    const { data, error } = await supabase
      .from('commission_settings')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('commission_settings')
      .select(`
        *,
        employees (
          id,
          name,
          email,
          department,
          position
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(settings: Database['public']['Tables']['commission_settings']['Insert']) {
    // First deactivate existing settings for this employee
    await supabase
      .from('commission_settings')
      .update({ is_active: false })
      .eq('employee_id', settings.employee_id);

    const { data, error } = await supabase
      .from('commission_settings')
      .insert(settings)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Database['public']['Tables']['commission_settings']['Update']) {
    const { data, error } = await supabase
      .from('commission_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Analytics service
export const analyticsService = {
  async getDashboardMetrics(dateFrom?: string, dateTo?: string) {
    let salesQuery = supabase
      .from('sales_data')
      .select('*');
    
    if (dateFrom) {
      salesQuery = salesQuery.gte('date', dateFrom);
    }
    
    if (dateTo) {
      salesQuery = salesQuery.lte('date', dateTo);
    }

    const { data: salesData, error: salesError } = await salesQuery;
    if (salesError) throw salesError;

    // Calculate metrics
    const totalCommissions = salesData?.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0) || 0;
    const totalSales = salesData?.reduce((sum, sale) => sum + sale.sale_amount, 0) || 0;
    const pendingPayments = salesData?.filter(sale => sale.status === 'pending').length || 0;
    const approvedSales = salesData?.filter(sale => sale.status === 'approved').length || 0;
    const paidSales = salesData?.filter(sale => sale.status === 'paid').length || 0;

    return {
      totalCommissions,
      totalSales,
      pendingPayments,
      approvedSales,
      paidSales,
      transactionCount: salesData?.length || 0,
      avgCommissionRate: totalSales > 0 ? (totalCommissions / totalSales) * 100 : 0
    };
  },

  async getEmployeePerformance(employeeId: string, period?: string) {
    let query = supabase
      .from('sales_data')
      .select('*')
      .eq('employee_id', employeeId);
    
    if (period) {
      query = query.like('date', `${period}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalSales = data?.reduce((sum, sale) => sum + sale.sale_amount, 0) || 0;
    const totalCommissions = data?.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0) || 0;
    const transactionCount = data?.length || 0;

    return {
      totalSales,
      totalCommissions,
      transactionCount,
      avgCommission: transactionCount > 0 ? totalCommissions / transactionCount : 0,
      sales: data || []
    };
  },

  async getDepartmentBreakdown(dateFrom?: string, dateTo?: string) {
    const { data: salesData, error } = await supabase
      .from('sales_data')
      .select(`
        *,
        employees!inner (
          department
        )
      `);
    
    if (error) throw error;

    const breakdown = salesData?.reduce((acc, sale) => {
      const dept = sale.employees.department;
      if (!acc[dept]) {
        acc[dept] = {
          department: dept,
          totalCommissions: 0,
          totalSales: 0,
          transactionCount: 0,
          employees: new Set()
        };
      }
      acc[dept].totalCommissions += sale.commission_amount || 0;
      acc[dept].totalSales += sale.sale_amount;
      acc[dept].transactionCount += 1;
      acc[dept].employees.add(sale.employee_id);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(breakdown).map((dept: any) => ({
      ...dept,
      employees: dept.employees.size
    }));
  }
};

// File upload service
export const fileService = {
  async uploadFile(file: File, bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data;
  },

  async getFileUrl(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600);

    if (error) throw error;
    return data.signedUrl;
  },

  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }
};

// Real-time subscriptions
export const subscribeToSalesData = (callback: (payload: any) => void) => {
  return supabase
    .channel('sales_data_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sales_data'
      },
      callback
    )
    .subscribe();
};

export const subscribeToCommissionPayments = (callback: (payload: any) => void) => {
  return supabase
    .channel('commission_payments_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'commission_payments'
      },
      callback
    )
    .subscribe();
};

// Utility functions for data transformation
export const transformEmployeeFromDB = (dbEmployee: Database['public']['Tables']['employees']['Row']) => {
  return {
    id: dbEmployee.id,
    name: dbEmployee.name,
    email: dbEmployee.email,
    department: dbEmployee.department,
    position: dbEmployee.position,
    baseSalary: dbEmployee.base_salary,
    hireDate: dbEmployee.hire_date
  };
};

export const transformSalesDataFromDB = (dbSale: Database['public']['Tables']['sales_data']['Row'] & { employees?: any }) => {
  return {
    id: dbSale.id,
    employeeId: dbSale.employee_id,
    orderId: dbSale.order_id,
    saleAmount: dbSale.sale_amount,
    commissionAmount: dbSale.commission_amount,
    date: dbSale.date,
    status: dbSale.status,
    approvedDate: dbSale.approved_date,
    paidDate: dbSale.paid_date,
    employee: dbSale.employees ? {
      id: dbSale.employees.id,
      name: dbSale.employees.name,
      email: dbSale.employees.email,
      department: dbSale.employees.department,
      position: dbSale.employees.position
    } : undefined
  };
};

export const transformCommissionPaymentFromDB = (dbPayment: Database['public']['Tables']['commission_payments']['Row'] & { employees?: any }) => {
  return {
    id: dbPayment.id,
    employeeId: dbPayment.employee_id,
    period: dbPayment.period,
    totalAmount: dbPayment.total_amount,
    method: dbPayment.method,
    status: dbPayment.status,
    processedDate: dbPayment.processed_date,
    employee: dbPayment.employees ? {
      id: dbPayment.employees.id,
      name: dbPayment.employees.name,
      email: dbPayment.employees.email,
      department: dbPayment.employees.department,
      position: dbPayment.employees.position
    } : undefined
  };
};