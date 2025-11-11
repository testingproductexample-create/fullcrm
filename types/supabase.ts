/**
 * Supabase Database Type Definitions
 * This file provides the Database type structure for TypeScript type checking
 * 
 * Generated types can be replaced with actual Supabase generated types
 */

export interface Database {
  public: {
    Tables: {
      // Placeholder table structure - replace with actual Supabase generated types
      [tableName: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: {
      [viewName: string]: {
        Row: Record<string, any>;
      };
    };
    Functions: {
      [functionName: string]: {
        Args: Record<string, any>;
        Returns: any;
      };
    };
    Enums: {
      [enumName: string]: string;
    };
  };
}
