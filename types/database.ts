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

export type UserRole = "super_admin" | "editor" | "support";
export type ContentStatus = "draft" | "published" | "archived";
export type ApplicationStatus =
  | "new"
  | "reviewed"
  | "interview"
  | "rejected"
  | "hired";
export type MessageStatus = "new" | "read" | "replied" | "archived";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
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
          requirements: string | null;
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
          requirements?: string | null;
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
          requirements?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
