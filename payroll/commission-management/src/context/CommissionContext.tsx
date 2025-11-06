import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  baseSalary: number;
  hireDate: string;
}

export interface CommissionStructure {
  id: string;
  name: string;
  type: 'percentage' | 'tiered' | 'fixed';
  baseRate: number;
  tierRates?: { min: number; max: number; rate: number }[];
  bonusThreshold?: number;
  bonusRate?: number;
  isActive: boolean;
}

export interface SalesData {
  id: string;
  employeeId: string;
  orderId: string;
  saleAmount: number;
  date: string;
  status: 'pending' | 'approved' | 'paid';
  commissionAmount?: number;
  approvedDate?: string;
  paidDate?: string;
}

export interface CommissionPayment {
  id: string;
  employeeId: string;
  period: string;
  totalAmount: number;
  method: 'bank' | 'check' | 'cash';
  status: 'pending' | 'processing' | 'completed';
  processedDate?: string;
  employee: Employee;
}

export interface CommissionState {
  employees: Employee[];
  commissionStructures: CommissionStructure[];
  salesData: SalesData[];
  commissionPayments: CommissionPayment[];
  loading: boolean;
  error: string | null;
}

type CommissionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'SET_COMMISSION_STRUCTURES'; payload: CommissionStructure[] }
  | { type: 'ADD_COMMISSION_STRUCTURE'; payload: CommissionStructure }
  | { type: 'UPDATE_COMMISSION_STRUCTURE'; payload: CommissionStructure }
  | { type: 'SET_SALES_DATA'; payload: SalesData[] }
  | { type: 'ADD_SALE'; payload: SalesData }
  | { type: 'UPDATE_SALE'; payload: SalesData }
  | { type: 'SET_PAYMENTS'; payload: CommissionPayment[] }
  | { type: 'ADD_PAYMENT'; payload: CommissionPayment }
  | { type: 'UPDATE_PAYMENT'; payload: CommissionPayment };

const initialState: CommissionState = {
  employees: [
    {
      id: '1',
      name: 'Ahmed Al-Mansouri',
      email: 'ahmed.almansouri@company.com',
      department: 'Sales',
      position: 'Sales Manager',
      baseSalary: 15000,
      hireDate: '2023-01-15'
    },
    {
      id: '2',
      name: 'Fatima Al-Zahra',
      email: 'fatima.alzahra@company.com',
      department: 'Sales',
      position: 'Senior Sales Representative',
      baseSalary: 12000,
      hireDate: '2023-03-20'
    },
    {
      id: '3',
      name: 'Mohamed Al-Rashid',
      email: 'mohamed.alrashid@company.com',
      department: 'Sales',
      position: 'Sales Representative',
      baseSalary: 10000,
      hireDate: '2023-05-10'
    }
  ],
  commissionStructures: [
    {
      id: '1',
      name: 'Standard Sales Commission',
      type: 'percentage',
      baseRate: 5,
      bonusThreshold: 100000,
      bonusRate: 2,
      isActive: true
    },
    {
      id: '2',
      name: 'Tiered Performance Commission',
      type: 'tiered',
      baseRate: 3,
      tierRates: [
        { min: 0, max: 50000, rate: 3 },
        { min: 50000, max: 100000, rate: 5 },
        { min: 100000, max: 200000, rate: 7 },
        { min: 200000, max: Infinity, rate: 10 }
      ],
      isActive: true
    }
  ],
  salesData: [
    {
      id: '1',
      employeeId: '1',
      orderId: 'ORD-2024-001',
      saleAmount: 75000,
      date: '2024-11-01',
      status: 'approved',
      commissionAmount: 3750,
      approvedDate: '2024-11-02'
    },
    {
      id: '2',
      employeeId: '2',
      orderId: 'ORD-2024-002',
      saleAmount: 50000,
      date: '2024-11-03',
      status: 'pending',
      commissionAmount: 2500
    },
    {
      id: '3',
      employeeId: '3',
      orderId: 'ORD-2024-003',
      saleAmount: 120000,
      date: '2024-11-05',
      status: 'approved',
      commissionAmount: 8400,
      approvedDate: '2024-11-06'
    }
  ],
  commissionPayments: [
    {
      id: '1',
      employeeId: '1',
      period: '2024-10',
      totalAmount: 15250,
      method: 'bank',
      status: 'completed',
      processedDate: '2024-11-01',
      employee: {
        id: '1',
        name: 'Ahmed Al-Mansouri',
        email: 'ahmed.almansouri@company.com',
        department: 'Sales',
        position: 'Sales Manager',
        baseSalary: 15000,
        hireDate: '2023-01-15'
      }
    }
  ],
  loading: false,
  error: null
};

function commissionReducer(state: CommissionState, action: CommissionAction): CommissionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(emp =>
          emp.id === action.payload.id ? action.payload : emp
        )
      };
    case 'SET_COMMISSION_STRUCTURES':
      return { ...state, commissionStructures: action.payload };
    case 'ADD_COMMISSION_STRUCTURE':
      return {
        ...state,
        commissionStructures: [...state.commissionStructures, action.payload]
      };
    case 'UPDATE_COMMISSION_STRUCTURE':
      return {
        ...state,
        commissionStructures: state.commissionStructures.map(struct =>
          struct.id === action.payload.id ? action.payload : struct
        )
      };
    case 'SET_SALES_DATA':
      return { ...state, salesData: action.payload };
    case 'ADD_SALE':
      return { ...state, salesData: [...state.salesData, action.payload] };
    case 'UPDATE_SALE':
      return {
        ...state,
        salesData: state.salesData.map(sale =>
          sale.id === action.payload.id ? action.payload : sale
        )
      };
    case 'SET_PAYMENTS':
      return { ...state, commissionPayments: action.payload };
    case 'ADD_PAYMENT':
      return { ...state, commissionPayments: [...state.commissionPayments, action.payload] };
    case 'UPDATE_PAYMENT':
      return {
        ...state,
        commissionPayments: state.commissionPayments.map(payment =>
          payment.id === action.payload.id ? action.payload : payment
        )
      };
    default:
      return state;
  }
}

const CommissionContext = createContext<{
  state: CommissionState;
  dispatch: React.Dispatch<CommissionAction>;
} | undefined>(undefined);

export function CommissionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(commissionReducer, initialState);

  return (
    <CommissionContext.Provider value={{ state, dispatch }}>
      {children}
    </CommissionContext.Provider>
  );
}

export function useCommission() {
  const context = useContext(CommissionContext);
  if (context === undefined) {
    throw new Error('useCommission must be used within a CommissionProvider');
  }
  return context;
}