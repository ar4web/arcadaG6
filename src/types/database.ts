/**
 * Hand-maintained mirror of the Postgres schema in `supabase/migrations`.
 * Regenerate with `supabase gen types typescript --local` once the local stack
 * is running; until then this keeps the client strongly typed.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          name_ar: string | null;
          slug: string;
          legal_name: string | null;
          vat_number: string | null;
          cr_number: string | null;
          gosi_number: string | null;
          currency: string;
          timezone: string;
          locale: string;
          workweek: string;
          logo_url: string | null;
          brand_primary: string;
          modules: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['organizations']['Row']> & { name: string; slug: string };
        Update: Partial<Database['public']['Tables']['organizations']['Row']>;
      };
      workspace_settings: {
        Row: {
          org_id: string;
          annual_entitlement: number;
          carry_over_cap: number;
          probation_days: number;
          sick_entitlement: number;
          gosi_employee_rate: number;
          gosi_employer_rate: number;
          hazard_rate: number;
          email_digest: boolean;
          whatsapp_notifications: boolean;
          payroll_cutoff_day: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['workspace_settings']['Row']> & { org_id: string };
        Update: Partial<Database['public']['Tables']['workspace_settings']['Row']>;
      };
      departments: {
        Row: {
          id: string;
          org_id: string;
          parent_id: string | null;
          code: string;
          name: string;
          name_ar: string | null;
          head_id: string | null;
          color: string;
          cost_centre: string | null;
          monthly_budget: number | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['departments']['Row']> & { org_id: string; code: string; name: string };
        Update: Partial<Database['public']['Tables']['departments']['Row']>;
      };
      locations: {
        Row: {
          id: string;
          org_id: string;
          code: string;
          name: string;
          name_ar: string | null;
          city: string;
          country: string;
          timezone: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          is_hq: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['locations']['Row']> & { org_id: string; code: string; name: string; city: string };
        Update: Partial<Database['public']['Tables']['locations']['Row']>;
      };
      employees: {
        Row: {
          id: string;
          org_id: string;
          employee_no: string;
          first_name: string;
          last_name: string;
          name_ar: string | null;
          preferred_name: string | null;
          email: string;
          personal_email: string | null;
          phone: string | null;
          avatar_url: string | null;
          gender: 'male' | 'female' | null;
          birth_date: string | null;
          nationality: string | null;
          national_id: string | null;
          iqama_no: string | null;
          gosi_no: string | null;
          job_title: string;
          job_title_ar: string | null;
          job_grade: string | null;
          department_id: string | null;
          manager_id: string | null;
          location_id: string | null;
          employment_type: 'full_time' | 'part_time' | 'contract' | 'intern' | 'temporary';
          work_mode: 'onsite' | 'hybrid' | 'remote';
          status: 'active' | 'probation' | 'on_leave' | 'notice' | 'terminated' | 'alumni';
          hire_date: string;
          probation_end_date: string | null;
          contract_end_date: string | null;
          termination_date: string | null;
          termination_reason: string | null;
          annual_leave_days: number;
          base_salary: number;
          housing_allowance: number;
          transport_allowance: number;
          other_allowances: number;
          currency: string;
          iban: string | null;
          bank_name: string | null;
          engagement_score: number | null;
          flight_risk: 'low' | 'medium' | 'high' | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database['public']['Tables']['employees']['Row']> & {
          org_id: string;
          employee_no: string;
          first_name: string;
          last_name: string;
          email: string;
          job_title: string;
          hire_date: string;
        };
        Update: Partial<Database['public']['Tables']['employees']['Row']>;
      };
      leave_types: {
        Row: {
          id: string;
          org_id: string;
          code: string;
          name: string;
          name_ar: string | null;
          paid: boolean;
          accrues: boolean;
          default_days: number;
          max_carry_over: number;
          requires_document: boolean;
          color: string;
          sort_order: number;
        };
        Insert: Partial<Database['public']['Tables']['leave_types']['Row']> & { org_id: string; code: string; name: string };
        Update: Partial<Database['public']['Tables']['leave_types']['Row']>;
      };
      leave_balances: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          leave_type_id: string;
          year: number;
          entitlement: number;
          carried_over: number;
          taken: number;
          pending: number;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['leave_balances']['Row']> & {
          org_id: string;
          employee_id: string;
          leave_type_id: string;
          year: number;
        };
        Update: Partial<Database['public']['Tables']['leave_balances']['Row']>;
      };
      leave_requests: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          leave_type_id: string;
          start_date: string;
          end_date: string;
          working_days: number;
          half_day: boolean;
          reason: string | null;
          status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn';
          approver_id: string | null;
          decided_at: string | null;
          decision_note: string | null;
          attachment_url: string | null;
          submitted_at: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database['public']['Tables']['leave_requests']['Row']> & {
          org_id: string;
          employee_id: string;
          leave_type_id: string;
          start_date: string;
          end_date: string;
          working_days: number;
        };
        Update: Partial<Database['public']['Tables']['leave_requests']['Row']>;
      };
      attendance_records: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          work_date: string;
          check_in: string | null;
          check_out: string | null;
          status: 'present' | 'remote' | 'late' | 'absent' | 'leave' | 'holiday' | 'business_trip';
          minutes_late: number;
          hours_worked: number;
          overtime_hours: number;
          source: string;
          location_id: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['attendance_records']['Row']> & {
          org_id: string;
          employee_id: string;
          work_date: string;
        };
        Update: Partial<Database['public']['Tables']['attendance_records']['Row']>;
      };
      payroll_runs: {
        Row: {
          id: string;
          org_id: string;
          period: string;
          status: 'draft' | 'review' | 'approved' | 'paid' | 'cancelled';
          headcount: number;
          gross_total: number;
          deductions_total: number;
          net_total: number;
          gosi_employer_total: number;
          gosi_employee_total: number;
          currency: string;
          paid_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          wps_file_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['payroll_runs']['Row']> & { org_id: string; period: string };
        Update: Partial<Database['public']['Tables']['payroll_runs']['Row']>;
      };
      payslips: {
        Row: {
          id: string;
          org_id: string;
          run_id: string;
          employee_id: string;
          base_salary: number;
          housing_allowance: number;
          transport_allowance: number;
          other_allowances: number;
          overtime: number;
          bonuses: number;
          deductions: number;
          gosi_employee: number;
          gosi_employer: number;
          gross: number;
          net: number;
          currency: string;
          days_worked: number;
          pdf_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['payslips']['Row']> & { org_id: string; run_id: string; employee_id: string };
        Update: Partial<Database['public']['Tables']['payslips']['Row']>;
      };
      expense_claims: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          reference: string;
          category: 'travel' | 'meals' | 'lodging' | 'transport' | 'equipment' | 'training' | 'other';
          amount: number;
          currency: string;
          vat_amount: number;
          incurred_on: string;
          description: string;
          status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
          project_code: string | null;
          receipt_url: string | null;
          approver_id: string | null;
          decided_at: string | null;
          decision_note: string | null;
          reimbursed_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database['public']['Tables']['expense_claims']['Row']> & {
          org_id: string;
          employee_id: string;
          reference: string;
          amount: number;
          incurred_on: string;
          description: string;
        };
        Update: Partial<Database['public']['Tables']['expense_claims']['Row']>;
      };
      customers: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          name_ar: string | null;
          vat_number: string | null;
          cr_number: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          country: string;
          payment_terms: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['customers']['Row']> & { org_id: string; name: string };
        Update: Partial<Database['public']['Tables']['customers']['Row']>;
      };
      invoices: {
        Row: {
          id: string;
          org_id: string;
          customer_id: string;
          number: string;
          uuid_zatca: string;
          status: 'draft' | 'issued' | 'paid' | 'overdue' | 'void' | 'credit_note';
          issue_date: string;
          due_date: string;
          currency: string;
          subtotal: number;
          vat_rate: number;
          vat_amount: number;
          total: number;
          paid_amount: number;
          notes: string | null;
          qr_payload: string | null;
          zatca_status: 'pending' | 'reported' | 'cleared' | 'failed' | null;
          cleared_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['invoices']['Row']> & {
          org_id: string;
          customer_id: string;
          number: string;
          issue_date: string;
          due_date: string;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Row']>;
      };
      job_openings: {
        Row: {
          id: string;
          org_id: string;
          reference: string;
          title: string;
          title_ar: string | null;
          department_id: string | null;
          location_id: string | null;
          hiring_manager: string | null;
          employment_type: 'full_time' | 'part_time' | 'contract' | 'intern' | 'temporary';
          seniority: string | null;
          salary_min: number | null;
          salary_max: number | null;
          openings: number;
          status: 'draft' | 'open' | 'on_hold' | 'filled' | 'closed';
          posted_at: string | null;
          closes_on: string | null;
          description: string | null;
          requirements: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['job_openings']['Row']> & { org_id: string; reference: string; title: string };
        Update: Partial<Database['public']['Tables']['job_openings']['Row']>;
      };
      candidates: {
        Row: {
          id: string;
          org_id: string;
          opening_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          nationality: string | null;
          years_experience: number | null;
          current_company: string | null;
          current_title: string | null;
          expected_salary: number | null;
          notice_period_days: number | null;
          stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
          score: number | null;
          source: string | null;
          cv_url: string | null;
          notes: string | null;
          owner_id: string | null;
          applied_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['candidates']['Row']> & {
          org_id: string;
          first_name: string;
          last_name: string;
          email: string;
        };
        Update: Partial<Database['public']['Tables']['candidates']['Row']>;
      };
      documents: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string | null;
          kind: 'iqama' | 'passport' | 'contract' | 'offer_letter' | 'medical_insurance' | 'certificate' | 'policy' | 'payslip' | 'other';
          title: string;
          storage_bucket: string;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number | null;
          issued_on: string | null;
          expires_on: string | null;
          status: 'valid' | 'expiring' | 'expired' | 'missing' | 'archived';
          requires_action: boolean;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['documents']['Row']> & {
          org_id: string;
          kind: Database['public']['Tables']['documents']['Row']['kind'];
          title: string;
          storage_path: string;
        };
        Update: Partial<Database['public']['Tables']['documents']['Row']>;
      };
      notifications: {
        Row: {
          id: string;
          org_id: string;
          user_id: string | null;
          employee_id: string | null;
          kind: 'info' | 'success' | 'warning' | 'danger' | 'approval' | 'mention' | 'system';
          title: string;
          body: string | null;
          href: string | null;
          channel: 'in_app' | 'email' | 'whatsapp' | 'push';
          read_at: string | null;
          acted_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & { org_id: string; title: string };
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
      audit_events: {
        Row: {
          id: string;
          org_id: string | null;
          actor_id: string | null;
          actor_email: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          before: Json;
          after: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['audit_events']['Row']> & { action: string; entity: string };
        Update: never;
      };
      goals: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          cycle_id: string | null;
          title: string;
          description: string | null;
          category: 'business' | 'people' | 'craft' | 'compliance' | 'personal';
          weight: number;
          target_value: number | null;
          current_value: number;
          unit: string | null;
          progress: number;
          status: 'on_track' | 'at_risk' | 'off_track' | 'completed' | 'cancelled';
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['goals']['Row']> & { org_id: string; employee_id: string; title: string };
        Update: Partial<Database['public']['Tables']['goals']['Row']>;
      };
      profiles: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string | null;
          full_name: string | null;
          avatar_url: string | null;
          locale: string;
          theme: string;
          mfa_enabled: boolean;
          phone: string | null;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; org_id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      user_roles: {
        Row: { id: string; user_id: string; role: string; granted_by: string | null; granted_at: string };
        Insert: Partial<Database['public']['Tables']['user_roles']['Row']> & { user_id: string; role: string };
        Update: Partial<Database['public']['Tables']['user_roles']['Row']>;
      };
    };
    Views: {
      employee_directory: {
        Row: {
          id: string;
          org_id: string;
          employee_no: string;
          full_name: string;
          full_name_ar: string;
          email: string;
          job_title: string;
          status: string;
          hire_date: string;
          department_id: string | null;
          department_name: string | null;
          manager_id: string | null;
          manager_name: string | null;
          location_id: string | null;
          location_name: string | null;
          gross_salary: number | null;
        };
      };
      headcount_snapshot: {
        Row: {
          org_id: string;
          department_id: string | null;
          department_name: string | null;
          active_headcount: number;
          probation_count: number;
          saudi_count: number;
          avg_engagement: number | null;
          monthly_gross: number | null;
        };
      };
      expiring_documents: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          employee_name: string;
          kind: string;
          title: string;
          expires_on: string;
          days_remaining: number;
        };
      };
    };
    Functions: {
      my_context: { Args: Record<string, never>; Returns: Json };
      dashboard_snapshot: { Args: { p_org?: string }; Returns: Json };
      decide_leave_request: {
        Args: { p_request_id: string; p_status: string; p_note?: string };
        Returns: Database['public']['Tables']['leave_requests']['Row'];
      };
      set_preferences: { Args: { p_locale?: string; p_theme?: string }; Returns: Json };
    };
    Enums: {
      app_role: 'admin' | 'hr_manager' | 'recruiter' | 'manager' | 'finance' | 'employee';
      employee_status: 'active' | 'probation' | 'on_leave' | 'notice' | 'terminated' | 'alumni';
      leave_request_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn';
    };
  };
}
