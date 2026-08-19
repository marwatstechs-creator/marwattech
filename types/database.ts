// Hand-written Supabase database types matching supabase/schema.sql.
// Regenerate with `supabase gen types typescript --project-id <ref> > types/database.ts`
// once a real project exists.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "super_admin" | "editor" | "support" | "client" | "student";
export type ContentStatus = "draft" | "published" | "archived";
export type ApplicationStatus =
  | "new"
  | "reviewed"
  | "interview"
  | "rejected"
  | "hired";
export type MessageStatus =
  | "new"
  | "read"
  | "replied"
  | "archived"
  | "open"
  | "in_progress"
  | "waiting_on_customer"
  | "resolved"
  | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type MeetingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          company: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          address: string | null;
          notes: string | null;
          status: string;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address?: string | null;
          notes?: string | null;
          status?: string;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address?: string | null;
          notes?: string | null;
          status?: string;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      client_projects: {
        Row: {
          id: string;
          client_id: string | null;
          user_id: string | null;
          title: string;
          description: string | null;
          status: string;
          progress: number;
          start_date: string | null;
          end_date: string | null;
          budget: number | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          user_id?: string | null;
          title: string;
          description?: string | null;
          status?: string;
          progress?: number;
          start_date?: string | null;
          end_date?: string | null;
          budget?: number | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          user_id?: string | null;
          title?: string;
          description?: string | null;
          status?: string;
          progress?: number;
          start_date?: string | null;
          end_date?: string | null;
          budget?: number | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      estimates: {
        Row: {
          id: string;
          estimate_number: string;
          client_id: string | null;
          title: string;
          amount: number;
          currency: string;
          status: string;
          body: string | null;
          due_date: string | null;
          sent_at: string | null;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          estimate_number: string;
          client_id?: string | null;
          title: string;
          amount?: number;
          currency?: string;
          status?: string;
          body?: string | null;
          due_date?: string | null;
          sent_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          estimate_number?: string;
          client_id?: string | null;
          title?: string;
          amount?: number;
          currency?: string;
          status?: string;
          body?: string | null;
          due_date?: string | null;
          sent_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      proposals: {
        Row: {
          id: string;
          proposal_number: string;
          client_id: string | null;
          title: string;
          amount: number;
          currency: string;
          status: string;
          body: string | null;
          sent_at: string | null;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          proposal_number: string;
          client_id?: string | null;
          title: string;
          amount?: number;
          currency?: string;
          status?: string;
          body?: string | null;
          sent_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          proposal_number?: string;
          client_id?: string | null;
          title?: string;
          amount?: number;
          currency?: string;
          status?: string;
          body?: string | null;
          sent_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      github_settings: {
        Row: {
          id: boolean;
          app_name: string | null;
          client_id: string | null;
          client_secret: string | null;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          app_name?: string | null;
          client_id?: string | null;
          client_secret?: string | null;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          app_name?: string | null;
          client_id?: string | null;
          client_secret?: string | null;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_applications: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          email: string | null;
          message: string | null;
          status: "pending" | "approved" | "rejected";
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          email?: string | null;
          message?: string | null;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          email?: string | null;
          message?: string | null;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [];
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          title: string;
          slug: string;
          icon: string | null;
          summary: string | null;
          content: string | null;
          content_json?: Json | null;
          benefits: Json | null;
          process: Json | null;
          faqs: Json | null;
          category_id: string | null;
          status: ContentStatus;
          featured: boolean;
          meta_title: string | null;
          meta_description: string | null;
          canonical_url: string | null;
          og_title: string | null;
          og_description: string | null;
          og_image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          icon?: string | null;
          summary?: string | null;
          content?: string | null;
          content_json?: Json | null;
          benefits?: Json | null;
          process?: Json | null;
          faqs?: Json | null;
          category_id?: string | null;
          status?: ContentStatus;
          featured?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          icon?: string | null;
          summary?: string | null;
          content?: string | null;
          content_json?: Json | null;
          benefits?: Json | null;
          process?: Json | null;
          faqs?: Json | null;
          category_id?: string | null;
          status?: ContentStatus;
          featured?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pages: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          content_json?: Json | null;
          custom_html: string | null;
          status: ContentStatus;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content?: string;
          content_json?: Json | null;
          custom_html?: string | null;
          status?: ContentStatus;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: string;
          content_json?: Json | null;
          custom_html?: string | null;
          status?: ContentStatus;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      portfolio_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      portfolio_items: {
        Row: {
          id: string;
          title: string;
          slug: string;
          client_name: string | null;
          industry: string | null;
          summary: string | null;
          content: string | null;
          content_json?: Json | null;
          technologies: Json | null;
          images: Json | null;
          cover_image: string | null;
          project_url: string | null;
          category_id: string | null;
          status: ContentStatus;
          featured: boolean;
          meta_title: string | null;
          meta_description: string | null;
          canonical_url: string | null;
          og_title: string | null;
          og_description: string | null;
          og_image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          client_name?: string | null;
          industry?: string | null;
          summary?: string | null;
          content?: string | null;
          content_json?: Json | null;
          technologies?: Json | null;
          images?: Json | null;
          cover_image?: string | null;
          project_url?: string | null;
          category_id?: string | null;
          status?: ContentStatus;
          featured?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          client_name?: string | null;
          industry?: string | null;
          summary?: string | null;
          content?: string | null;
          content_json?: Json | null;
          technologies?: Json | null;
          images?: Json | null;
          cover_image?: string | null;
          project_url?: string | null;
          category_id?: string | null;
          status?: ContentStatus;
          featured?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      blog_tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          content_json?: Json | null;
          custom_html?: string | null;
          cover_image: string | null;
          author_id: string | null;
          category_id: string | null;
          reading_time: number | null;
          status: ContentStatus;
          published_at: string | null;
          meta_title: string | null;
          meta_description: string | null;
          canonical_url: string | null;
          og_title: string | null;
          og_description: string | null;
          og_image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content: string;
          content_json?: Json | null;
          custom_html?: string | null;
          cover_image?: string | null;
          author_id?: string | null;
          category_id?: string | null;
          reading_time?: number | null;
          status?: ContentStatus;
          published_at?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          content_json?: Json | null;
          custom_html?: string | null;
          cover_image?: string | null;
          author_id?: string | null;
          category_id?: string | null;
          reading_time?: number | null;
          status?: ContentStatus;
          published_at?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          client_name: string;
          company: string | null;
          role: string | null;
          quote: string;
          rating: number;
          avatar_url: string | null;
          featured: boolean;
          status: ContentStatus;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          company?: string | null;
          role?: string | null;
          quote: string;
          rating?: number;
          avatar_url?: string | null;
          featured?: boolean;
          status?: ContentStatus;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_name?: string;
          company?: string | null;
          role?: string | null;
          quote?: string;
          rating?: number;
          avatar_url?: string | null;
          featured?: boolean;
          status?: ContentStatus;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      careers: {
        Row: {
          id: string;
          title: string;
          slug: string;
          department: string | null;
          location: string | null;
          job_type: string | null;
          salary_range: string | null;
          description: string | null;
          description_json?: Json | null;
          requirements: string | null;
          requirements_json?: Json | null;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          department?: string | null;
          location?: string | null;
          job_type?: string | null;
          salary_range?: string | null;
          description?: string | null;
          description_json?: Json | null;
          requirements?: string | null;
          requirements_json?: Json | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          department?: string | null;
          location?: string | null;
          job_type?: string | null;
          salary_range?: string | null;
          description?: string | null;
          description_json?: Json | null;
          requirements?: string | null;
          requirements_json?: Json | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          career_id: string;
          applicant_name: string;
          email: string;
          phone: string | null;
          resume_url: string | null;
          cover_letter: string | null;
          status: ApplicationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          career_id: string;
          applicant_name: string;
          email: string;
          phone?: string | null;
          resume_url?: string | null;
          cover_letter?: string | null;
          status?: ApplicationStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          career_id?: string;
          applicant_name?: string;
          email?: string;
          phone?: string | null;
          resume_url?: string | null;
          cover_letter?: string | null;
          status?: ApplicationStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string | null;
          service: string | null;
          message: string;
          status: MessageStatus;
          internal_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          subject?: string | null;
          service?: string | null;
          message: string;
          status?: MessageStatus;
          internal_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          subject?: string | null;
          service?: string | null;
          message?: string;
          status?: MessageStatus;
          internal_notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          name: string;
          email: string;
          issue_type: string;
          priority: TicketPriority;
          subject: string | null;
          message: string;
          status: MessageStatus;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
          assigned_to: string | null;
          last_message_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          issue_type: string;
          priority?: TicketPriority;
          subject?: string | null;
          message: string;
          status?: MessageStatus;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
          assigned_to?: string | null;
          last_message_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          issue_type?: string;
          priority?: TicketPriority;
          subject?: string | null;
          message?: string;
          status?: MessageStatus;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
          assigned_to?: string | null;
          last_message_at?: string | null;
        };
        Relationships: [];
      };
      ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender_type: string;
          sender_id: string | null;
          sender_name: string | null;
          sender_email: string | null;
          body: string;
          attachments: Json;
          internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          sender_type: string;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_email?: string | null;
          body: string;
          attachments?: Json;
          internal?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          sender_type?: string;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_email?: string | null;
          body?: string;
          attachments?: Json;
          internal?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      mockup_requests: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          website_type: string;
          budget_range: string | null;
          description: string;
          status: MessageStatus;
          internal_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          website_type: string;
          budget_range?: string | null;
          description: string;
          status?: MessageStatus;
          internal_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          website_type?: string;
          budget_range?: string | null;
          description?: string;
          status?: MessageStatus;
          internal_notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      meeting_bookings: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          country: string | null;
          company: string | null;
          project_description: string;
          tech_stack: string | null;
          how_found: string | null;
          timezone: string;
          meeting_date: string;
          meeting_time: string;
          status: MeetingStatus;
          meeting_link: string | null;
          internal_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          country?: string | null;
          company?: string | null;
          project_description: string;
          tech_stack?: string | null;
          how_found?: string | null;
          timezone?: string;
          meeting_date: string;
          meeting_time: string;
          status?: MeetingStatus;
          meeting_link?: string | null;
          internal_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          country?: string | null;
          company?: string | null;
          project_description?: string;
          tech_stack?: string | null;
          how_found?: string | null;
          timezone?: string;
          meeting_date?: string;
          meeting_time?: string;
          status?: MeetingStatus;
          meeting_link?: string | null;
          internal_notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          name: string;
          path: string;
          url: string;
          mime_type: string | null;
          size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          path: string;
          url: string;
          mime_type?: string | null;
          size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          path?: string;
          url?: string;
          mime_type?: string | null;
          size?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      /* ── Google AdSense ad units ───────────────────────────── */
      ads: {
        Row: {
          id: string;
          name: string;
          ad_client: string;
          slot_id: string | null;
          mobile_slot_id: string | null;
          mobile_format: string;
          format: string;
          placement: string;
          area: string | null;
          enabled: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          ad_client: string;
          slot_id?: string | null;
          mobile_slot_id?: string | null;
          mobile_format?: string;
          format?: string;
          placement?: string;
          area?: string | null;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          ad_client?: string;
          slot_id?: string | null;
          mobile_slot_id?: string | null;
          mobile_format?: string;
          format?: string;
          placement?: string;
          area?: string | null;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      /* ── AI admin assistant conversation history ───────────── */
      ai_messages: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      /* ── Promo codes (manual + auto Udemy feed) ─────────────── */
      promo_codes: {
        Row: {
          id: string;
          title: string;
          store: string;
          code: string;
          discount_label: string | null;
          url: string;
          image_url: string | null;
          category: string | null;
          tag: string;
          source: string;
          expires_at: string | null;
          enabled: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          store?: string;
          code: string;
          discount_label?: string | null;
          url: string;
          image_url?: string | null;
          category?: string | null;
          tag?: string;
          source?: string;
          expires_at?: string | null;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          store?: string;
          code?: string;
          discount_label?: string | null;
          url?: string;
          image_url?: string | null;
          category?: string | null;
          tag?: string;
          source?: string;
          expires_at?: string | null;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      /* ── Payments (PayPal Orders API v2 + client portal) ───── */
      payments: {
        Row: {
          id: string;
          order_id: string;
          paypal_order_id: string | null;
          paypal_capture_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          item_type: string | null;
          item_name: string | null;
          description: string | null;
          customer_name: string | null;
          customer_email: string | null;
          payer_name: string | null;
          payer_email: string | null;
          metadata: Json;
          client_id: string | null;
          project_id: string | null;
          method: string | null;
          transaction_id: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          paypal_order_id?: string | null;
          paypal_capture_id?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          item_type?: string | null;
          item_name?: string | null;
          description?: string | null;
          customer_name?: string | null;
          customer_email?: string | null;
          payer_name?: string | null;
          payer_email?: string | null;
          metadata?: Json;
          client_id?: string | null;
          project_id?: string | null;
          method?: string | null;
          transaction_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          paypal_order_id?: string | null;
          paypal_capture_id?: string | null;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          item_type?: string | null;
          item_name?: string | null;
          description?: string | null;
          customer_name?: string | null;
          customer_email?: string | null;
          payer_name?: string | null;
          payer_email?: string | null;
          metadata?: Json;
          client_id?: string | null;
          project_id?: string | null;
          method?: string | null;
          transaction_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_gateways: {
        Row: {
          id: boolean;
          provider: string;
          env: string;
          client_id: string | null;
          secret: string | null;
          webhook_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          provider?: string;
          env?: string;
          client_id?: string | null;
          secret?: string | null;
          webhook_id?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          provider?: string;
          env?: string;
          client_id?: string | null;
          secret?: string | null;
          webhook_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      mail_settings: {
        Row: {
          id: boolean;
          host: string | null;
          port: number | null;
          secure: boolean;
          user: string | null;
          pass: string | null;
          from_email: string | null;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          host?: string | null;
          port?: number | null;
          secure?: boolean;
          user?: string | null;
          pass?: string | null;
          from_email?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          host?: string | null;
          port?: number | null;
          secure?: boolean;
          user?: string | null;
          pass?: string | null;
          from_email?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      google_settings: {
        Row: {
          id: boolean;
          client_id: string | null;
          client_secret: string | null;
          enabled: boolean;
          one_tap_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          client_id?: string | null;
          client_secret?: string | null;
          enabled?: boolean;
          one_tap_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          client_id?: string | null;
          client_secret?: string | null;
          enabled?: boolean;
          one_tap_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      /* ── Email marketing + PayPal features ────────────────── */
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          source: string;
          status: string;
          unsub_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          source?: string;
          status?: string;
          unsub_token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          source?: string;
          status?: string;
          unsub_token?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      course_subscribers: {
        Row: {
          id: string;
          email: string;
          status: string;
          unsub_token: string;
          subscribed_at: string;
          unsubscribed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          status?: string;
          unsub_token?: string;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          status?: string;
          unsub_token?: string;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      course_update_events: {
        Row: {
          id: string;
          course_id: string;
          lesson_id: string | null;
          event_type: string;
          summary: string | null;
          meaningful: boolean;
          included_in_digest: boolean;
          digest_send_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          lesson_id?: string | null;
          event_type?: string;
          summary?: string | null;
          meaningful?: boolean;
          included_in_digest?: boolean;
          digest_send_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          lesson_id?: string | null;
          event_type?: string;
          summary?: string | null;
          meaningful?: boolean;
          included_in_digest?: boolean;
          digest_send_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      course_digest_sends: {
        Row: {
          id: string;
          email: string;
          event_ids: string[];
          courses: string[];
          status: string;
          error: string | null;
          sent_at: string;
          batch_id: string | null;
          subject: string | null;
          body: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          event_ids?: string[];
          courses?: string[];
          status?: string;
          error?: string | null;
          sent_at?: string;
          batch_id?: string | null;
          subject?: string | null;
          body?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          event_ids?: string[];
          courses?: string[];
          status?: string;
          error?: string | null;
          sent_at?: string;
          batch_id?: string | null;
          subject?: string | null;
          body?: string | null;
        };
        Relationships: [];
      };
      code_scripts: {
        Row: {
          id: string;
          source_url: string;
          title: string;
          slug: string;
          category: string | null;
          version: string | null;
          content: string | null;
          excerpt: string | null;
          cover_image: string | null;
          source_image: string | null;
          download_url: string | null;
          source_download_url: string | null;
          download_links: Json | null;
          seo_title: string | null;
          seo_description: string | null;
          faqs: Json;
          json_ld: Json | null;
          status: string;
          created_at: string;
          updated_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          source_url: string;
          title: string;
          slug: string;
          category?: string | null;
          version?: string | null;
          content?: string | null;
          excerpt?: string | null;
          cover_image?: string | null;
          source_image?: string | null;
          download_url?: string | null;
          source_download_url?: string | null;
          download_links?: Json | null;
          seo_title?: string | null;
          seo_description?: string | null;
          faqs?: Json;
          json_ld?: Json | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          source_url?: string;
          title?: string;
          slug?: string;
          category?: string | null;
          version?: string | null;
          content?: string | null;
          excerpt?: string | null;
          cover_image?: string | null;
          source_image?: string | null;
          download_url?: string | null;
          source_download_url?: string | null;
          download_links?: Json | null;
          seo_title?: string | null;
          seo_description?: string | null;
          faqs?: Json;
          json_ld?: Json | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          last_synced_at?: string | null;
        };
        Relationships: [];
      };
      code_script_syncs: {
        Row: {
          id: string;
          ran_at: string;
          sitemap_urls: number;
          new_found: number;
          imported: number;
          failed: number;
          error: string | null;
        };
        Insert: {
          id?: string;
          ran_at?: string;
          sitemap_urls?: number;
          new_found?: number;
          imported?: number;
          failed?: number;
          error?: string | null;
        };
        Update: {
          id?: string;
          ran_at?: string;
          sitemap_urls?: number;
          new_found?: number;
          imported?: number;
          failed?: number;
          error?: string | null;
        };
        Relationships: [];
      };
      code_script_sync_requests: {
        Row: {
          id: string;
          status: string;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          status?: string;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          status?: string;
          created_at?: string;
          processed_at?: string | null;
        };
        Relationships: [];
      };
      email_campaigns: {
        Row: {
          id: string;
          subject: string;
          body_html: string;
          audience: string;
          custom_emails: Json;
          status: string;
          scheduled_for: string | null;
          sent_at: string | null;
          recipients_count: number;
          sent_count: number;
          failed_count: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject: string;
          body_html: string;
          audience?: string;
          custom_emails?: Json;
          status?: string;
          scheduled_for?: string | null;
          sent_at?: string | null;
          recipients_count?: number;
          sent_count?: number;
          failed_count?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject?: string;
          body_html?: string;
          audience?: string;
          custom_emails?: Json;
          status?: string;
          scheduled_for?: string | null;
          sent_at?: string | null;
          recipients_count?: number;
          sent_count?: number;
          failed_count?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      campaign_recipients: {
        Row: {
          id: string;
          campaign_id: string;
          email: string;
          status: string;
          error: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          email: string;
          status?: string;
          error?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          email?: string;
          status?: string;
          error?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payouts: {
        Row: {
          id: string;
          recipient_email: string;
          recipient_name: string | null;
          amount: number;
          currency: string;
          note: string | null;
          status: string;
          paypal_payout_batch_id: string | null;
          paypal_payout_item_id: string | null;
          error: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_email: string;
          recipient_name?: string | null;
          amount: number;
          currency?: string;
          note?: string | null;
          status?: string;
          paypal_payout_batch_id?: string | null;
          paypal_payout_item_id?: string | null;
          error?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_email?: string;
          recipient_name?: string | null;
          amount?: number;
          currency?: string;
          note?: string | null;
          status?: string;
          paypal_payout_batch_id?: string | null;
          paypal_payout_item_id?: string | null;
          error?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          amount: number;
          currency: string;
          interval: string;
          paypal_plan_id: string | null;
          features: Json;
          active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          amount: number;
          currency?: string;
          interval?: string;
          paypal_plan_id?: string | null;
          features?: Json;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          amount?: number;
          currency?: string;
          interval?: string;
          paypal_plan_id?: string | null;
          features?: Json;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      paypal_subscriptions: {
        Row: {
          id: string;
          plan_id: string | null;
          paypal_plan_id: string | null;
          paypal_subscription_id: string | null;
          customer_name: string | null;
          customer_email: string | null;
          amount: number;
          currency: string;
          interval: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id?: string | null;
          paypal_plan_id?: string | null;
          paypal_subscription_id?: string | null;
          customer_name?: string | null;
          customer_email?: string | null;
          amount: number;
          currency?: string;
          interval?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string | null;
          paypal_plan_id?: string | null;
          paypal_subscription_id?: string | null;
          customer_name?: string | null;
          customer_email?: string | null;
          amount?: number;
          currency?: string;
          interval?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          id: string;
          customer_email: string | null;
          paypal_payment_token_id: string | null;
          instrument_type: string | null;
          brand: string | null;
          last4: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_email?: string | null;
          paypal_payment_token_id?: string | null;
          instrument_type?: string | null;
          brand?: string | null;
          last4?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_email?: string | null;
          paypal_payment_token_id?: string | null;
          instrument_type?: string | null;
          brand?: string | null;
          last4?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      paypal_disputes: {
        Row: {
          id: string;
          dispute_id: string;
          state: string | null;
          reason: string | null;
          amount: number | null;
          currency: string | null;
          buyer_email: string | null;
          status: string;
          evidence: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dispute_id: string;
          state?: string | null;
          reason?: string | null;
          amount?: number | null;
          currency?: string | null;
          buyer_email?: string | null;
          status?: string;
          evidence?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dispute_id?: string;
          state?: string | null;
          reason?: string | null;
          amount?: number | null;
          currency?: string | null;
          buyer_email?: string | null;
          status?: string;
          evidence?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          event_id: string | null;
          event_type: string;
          provider: string;
          payload: Json;
          processed: boolean;
          processed_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          event_type: string;
          provider?: string;
          payload?: Json;
          processed?: boolean;
          processed_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string | null;
          event_type?: string;
          provider?: string;
          payload?: Json;
          processed?: boolean;
          processed_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          client_id: string | null;
          client_name: string | null;
          client_email: string | null;
          project_id: string | null;
          amount: number;
          currency: string;
          status: string;
          description: string | null;
          line_items: Json;
          due_date: string | null;
          sent_at: string | null;
          paid_at: string | null;
          paypal_invoice_id: string | null;
          pdf_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          client_id?: string | null;
          client_name?: string | null;
          client_email?: string | null;
          project_id?: string | null;
          amount: number;
          currency?: string;
          status?: string;
          description?: string | null;
          line_items?: Json;
          due_date?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          paypal_invoice_id?: string | null;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          client_id?: string | null;
          client_name?: string | null;
          client_email?: string | null;
          project_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          description?: string | null;
          line_items?: Json;
          due_date?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          paypal_invoice_id?: string | null;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          cover_image: string | null;
          category: string | null;
          difficulty: string;
          duration_hours: number | null;
          is_free: boolean;
          price: number | null;
          status: string;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          cover_image?: string | null;
          category?: string | null;
          difficulty?: string;
          duration_hours?: number | null;
          is_free?: boolean;
          price?: number | null;
          status?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          cover_image?: string | null;
          category?: string | null;
          difficulty?: string;
          duration_hours?: number | null;
          is_free?: boolean;
          price?: number | null;
          status?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          slug: string;
          content: string | null;
          video_url: string | null;
          sort_order: number;
          duration_minutes: number | null;
          duration_hours: number | null;
          duration_seconds: number | null;
          is_free_preview: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          slug: string;
          content?: string | null;
          video_url?: string | null;
          sort_order?: number;
          duration_minutes?: number | null;
          duration_hours?: number | null;
          duration_seconds?: number | null;
          is_free_preview?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          slug?: string;
          content?: string | null;
          video_url?: string | null;
          sort_order?: number;
          duration_minutes?: number | null;
          duration_hours?: number | null;
          duration_seconds?: number | null;
          is_free_preview?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          client_id: string;
          course_id: string;
          enrolled_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          course_id: string;
          enrolled_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          course_id?: string;
          enrolled_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: {
          id: string;
          client_id: string;
          lesson_id: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          lesson_id: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          lesson_id?: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      certificates: {
        Row: {
          id: string;
          certificate_no: string;
          verification_code: string;
          student_id: string;
          course_id: string;
          student_name: string;
          course_title: string;
          course_category: string | null;
          instructor_name: string | null;
          course_duration: string | null;
          status: string;
          issue_date: string | null;
          completion_date: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          certificate_no: string;
          verification_code: string;
          student_id: string;
          course_id: string;
          student_name: string;
          course_title: string;
          course_category?: string | null;
          instructor_name?: string | null;
          course_duration?: string | null;
          status?: string;
          issue_date?: string | null;
          completion_date?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          certificate_no?: string;
          verification_code?: string;
          student_id?: string;
          course_id?: string;
          student_name?: string;
          course_title?: string;
          course_category?: string | null;
          instructor_name?: string | null;
          course_duration?: string | null;
          status?: string;
          issue_date?: string | null;
          completion_date?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      study_materials: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          file_url: string;
          file_type: string | null;
          file_size: number | null;
          category: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          file_url: string;
          file_type?: string | null;
          file_size?: number | null;
          category?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          file_url?: string;
          file_type?: string | null;
          file_size?: number | null;
          category?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      /* ── University-style study platform: subjects ─────────── */
      study_subjects: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          instructor: string | null;
          category: string | null;
          color: string | null;
          published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          instructor?: string | null;
          category?: string | null;
          color?: string | null;
          published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          instructor?: string | null;
          category?: string | null;
          color?: string | null;
          published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      /* ── University-style study platform: weeks ────────────── */
      study_weeks: {
        Row: {
          id: string;
          subject_id: string;
          week_number: number;
          title: string;
          description: string | null;
          pdf_url: string | null;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          week_number: number;
          title: string;
          description?: string | null;
          pdf_url?: string | null;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          week_number?: number;
          title?: string;
          description?: string | null;
          pdf_url?: string | null;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      /* ── University-style study platform: slides ───────────── */
      study_slides: {
        Row: {
          id: string;
          week_id: string;
          slide_number: number;
          title: string;
          content: string;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          week_id: string;
          slide_number: number;
          title: string;
          content: string;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          week_id?: string;
          slide_number?: number;
          title?: string;
          content?: string;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
