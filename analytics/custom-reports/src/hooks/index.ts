import { useState, useEffect, useCallback, useMemo } from 'react';
import { useReportStore } from '../store/reportStore';
import { 
  getRandomSalesData,
  getRandomCustomersData,
  getRandomProductsData,
  getRandomVatData,
  getRandomFinancialData,
  getRandomEmployeeData,
  getRandomTradeData,
  getRandomGeographicData,
} from '../data/sampleData';
import toast from 'react-hot-toast';

// Data source types
export type DataSourceType = 
  | 'sales' 
  | 'customers' 
  | 'products' 
  | 'vat' 
  | 'financial' 
  | 'employees' 
  | 'trade' 
  | 'geographic';

// API Response interface
export interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Custom hook for fetching data from various sources
export function useDataSource<T>(source: DataSourceType, options?: {
  page?: number;
  pageSize?: number;
  filters?: Record<string, any>;
  autoFetch?: boolean;
}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(options?.page || 1);
  const [pageSize, setPageSize] = useState(options?.pageSize || 100);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      let result: T[] = [];
      
      switch (source) {
        case 'sales':
          result = getRandomSalesData(pageSize) as T[];
          break;
        case 'customers':
          result = getRandomCustomersData(pageSize) as T[];
          break;
        case 'products':
          result = getRandomProductsData(pageSize) as T[];
          break;
        case 'vat':
          result = getRandomVatData(pageSize) as T[];
          break;
        case 'financial':
          result = getRandomFinancialData(pageSize) as T[];
          break;
        case 'employees':
          result = getRandomEmployeeData(pageSize) as T[];
          break;
        case 'trade':
          result = getRandomTradeData(pageSize) as T[];
          break;
        case 'geographic':
          result = getRandomGeographicData() as T[];
          setTotal(result.length);
          setData(result);
          setLoading(false);
          return;
        default:
          throw new Error(`Unknown data source: ${source}`);
      }

      setData(result);
      setTotal(result.length * 10); // Simulate total count
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error(`Failed to fetch ${source} data`);
    } finally {
      setLoading(false);
    }
  }, [source, page, pageSize]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchData();
    }
  }, [fetchData, options?.autoFetch]);

  const response: ApiResponse<T> = useMemo(() => ({
    data,
    total,
    page,
    pageSize,
    loading,
    error,
    refetch,
  }), [data, total, page, pageSize, loading, error, refetch]);

  return response;
}

// Hook for real-time data updates
export function useRealtimeData<T>(source: DataSourceType, interval = 5000) {
  const [data, setData] = useState<T[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const intervalId = setInterval(() => {
      // Simulate real-time data updates
      fetchData();
    }, interval);

    return () => clearInterval(intervalId);
  }, [isConnected, interval]);

  const fetchData = useCallback(async () => {
    try {
      let result: T[] = [];
      
      switch (source) {
        case 'sales':
          result = getRandomSalesData(1) as T[];
          break;
        case 'customers':
          result = getRandomCustomersData(1) as T[];
          break;
        default:
          result = [] as T[];
      }

      // Update only the latest data point
      if (result.length > 0) {
        setData(prevData => {
          const newData = [...prevData];
          if (newData.length >= 20) {
            newData.shift(); // Keep only last 20 data points
          }
          newData.push(result[0]);
          return newData;
        });
      }
    } catch (err) {
      console.error('Real-time data update failed:', err);
    }
  }, [source]);

  useEffect(() => {
    if (isConnected) {
      fetchData();
    }
  }, [isConnected, fetchData]);

  return {
    data,
    isConnected,
    connect,
    disconnect,
  };
}

// Hook for data filtering and sorting
export function useDataFilter<T>(
  data: T[],
  options?: {
    searchFields?: (keyof T)[];
    defaultSort?: { field: keyof T; direction: 'asc' | 'desc' };
  }
) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState(
    options?.defaultSort || null
  );

  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search query
    if (searchQuery && options?.searchFields) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        options.searchFields.some(field => {
          const value = item[field];
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter((item: any) => {
          const itemValue = item[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
            return itemValue >= value.min && itemValue <= value.max;
          } else {
            return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
          }
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a: any, b: any) => {
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortConfig, options?.searchFields]);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  const sort = useCallback((field: keyof T, direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
  }, []);

  return {
    data: filteredData,
    filters,
    sortConfig,
    searchQuery,
    setSearchQuery,
    updateFilter,
    clearFilter,
    clearAllFilters,
    sort,
  };
}

// Hook for pagination
export function usePagination<T>(data: T[], pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = data.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(totalPages);
  }, [totalPages, goToPage]);

  const setPageSize = useCallback((size: number) => {
    setCurrentPage(1);
  }, []);

  return {
    data: currentData,
    currentPage,
    totalPages,
    totalItems: data.length,
    pageSize,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    setPageSize,
  };
}

// Hook for local storage persistence
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Hook for debounced value
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for media queries
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
}

// Hook for async operations with loading and error states
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as E);
      setStatus('error');
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    status,
    data,
    error,
    isLoading: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}

export { useReportStore };