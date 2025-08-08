export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'hr' | 'team' | 'client';
          department: string | null;
          position: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
          last_sign_in: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'hr' | 'team' | 'client';
          department?: string | null;
          position?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          last_sign_in?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'hr' | 'team' | 'client';
          department?: string | null;
          position?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          last_sign_in?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          client_id: string | null;
          start_date: string | null;
          end_date: string | null;
          status: string | null;
          budget: number | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          client_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string | null;
          budget?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          client_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string | null;
          budget?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          assignee_id: string | null;
          status: string | null;
          priority: string | null;
          due_date: string | null;
          estimated_hours: number | null;
          actual_hours: number | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          assignee_id?: string | null;
          status?: string | null;
          priority?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          assignee_id?: string | null;
          status?: string | null;
          priority?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          task_id: string;
          user_id: string | null;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id?: string | null;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string | null;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      time_entries: {
        Row: {
          id: string;
          task_id: string;
          user_id: string | null;
          description: string | null;
          start_time: string;
          end_time: string | null;
          duration: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id?: string | null;
          description?: string | null;
          start_time: string;
          end_time?: string | null;
          duration?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string | null;
          description?: string | null;
          start_time?: string;
          end_time?: string | null;
          duration?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          file_path: string;
          file_type: string | null;
          file_size: number | null;
          uploaded_by: string | null;
          uploaded_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          file_path: string;
          file_type?: string | null;
          file_size?: number | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          file_path?: string;
          file_type?: string | null;
          file_size?: number | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          is_read: boolean | null;
          type: string | null;
          reference_id: string | null;
          reference_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          is_read?: boolean | null;
          type?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          is_read?: boolean | null;
          type?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          created_at?: string;
        };
      };
      client_companies: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          industry: string | null;
          primary_contact_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          industry?: string | null;
          primary_contact_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          industry?: string | null;
          primary_contact_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          project_id: string;
          client_id: string | null;
          amount: number;
          status: string | null;
          issue_date: string;
          due_date: string;
          paid_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          client_id?: string | null;
          amount: number;
          status?: string | null;
          issue_date: string;
          due_date: string;
          paid_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          client_id?: string | null;
          amount?: number;
          status?: string | null;
          issue_date?: string;
          due_date?: string;
          paid_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          created_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          manager_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      employee_records: {
        Row: {
          id: string;
          user_id: string;
          employment_start_date: string | null;
          employment_end_date: string | null;
          salary: number | null;
          contract_type: string | null;
          emergency_contact: string | null;
          emergency_phone: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          employment_start_date?: string | null;
          employment_end_date?: string | null;
          salary?: number | null;
          contract_type?: string | null;
          emergency_contact?: string | null;
          emergency_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          employment_start_date?: string | null;
          employment_end_date?: string | null;
          salary?: number | null;
          contract_type?: string | null;
          emergency_contact?: string | null;
          emergency_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      leave_requests: {
        Row: {
          id: string;
          user_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          status: string | null;
          reason: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          status?: string | null;
          reason?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          leave_type?: string;
          start_date?: string;
          end_date?: string;
          status?: string | null;
          reason?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_current_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      update_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      user_role: 'admin' | 'hr' | 'team' | 'client';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};