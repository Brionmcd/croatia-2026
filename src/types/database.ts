export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string
          name: string
          access_code: string
          start_date: string
          end_date: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          access_code: string
          start_date: string
          end_date: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          access_code?: string
          start_date?: string
          end_date?: string
          created_at?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          id: string
          trip_id: string
          name: string
          adults: number
          children: number
          children_ages: number[]
          arrival_flight: string | null
          arrival_airport: string | null
          arrival_datetime: string | null
          departure_flight: string | null
          departure_datetime: string | null
          timezone: string | null
          contact_email: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          name: string
          adults?: number
          children?: number
          children_ages?: number[]
          arrival_flight?: string | null
          arrival_airport?: string | null
          arrival_datetime?: string | null
          departure_flight?: string | null
          departure_datetime?: string | null
          timezone?: string | null
          contact_email?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          name?: string
          adults?: number
          children?: number
          children_ages?: number[]
          arrival_flight?: string | null
          arrival_airport?: string | null
          arrival_datetime?: string | null
          departure_flight?: string | null
          departure_datetime?: string | null
          timezone?: string | null
          contact_email?: string | null
        }
        Relationships: []
      }
      days: {
        Row: {
          id: string
          trip_id: string
          day_number: number
          date: string
          day_of_week: string
          location: string | null
          title: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          day_number: number
          date: string
          day_of_week: string
          location?: string | null
          title?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          day_number?: number
          date?: string
          day_of_week?: string
          location?: string | null
          title?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          day_id: string
          time: string | null
          title: string
          description: string | null
          details: string | null
          total_cost_eur: number | null
          per_adult_cost: number | null
          per_child_cost: number | null
          cost_type: 'flat_group' | 'per_person' | 'per_adult_child' | null
          status: 'confirmed' | 'pending_vote' | 'tentative' | 'cancelled'
          restrictions: string | null
          warning_flags: string[]
          sort_order: number
        }
        Insert: {
          id?: string
          day_id: string
          time?: string | null
          title: string
          description?: string | null
          details?: string | null
          total_cost_eur?: number | null
          per_adult_cost?: number | null
          per_child_cost?: number | null
          cost_type?: 'flat_group' | 'per_person' | 'per_adult_child' | null
          status?: 'confirmed' | 'pending_vote' | 'tentative' | 'cancelled'
          restrictions?: string | null
          warning_flags?: string[]
          sort_order?: number
        }
        Update: {
          id?: string
          day_id?: string
          time?: string | null
          title?: string
          description?: string | null
          details?: string | null
          total_cost_eur?: number | null
          per_adult_cost?: number | null
          per_child_cost?: number | null
          cost_type?: 'flat_group' | 'per_person' | 'per_adult_child' | null
          status?: 'confirmed' | 'pending_vote' | 'tentative' | 'cancelled'
          restrictions?: string | null
          warning_flags?: string[]
          sort_order?: number
        }
        Relationships: []
      }
      decisions: {
        Row: {
          id: string
          trip_id: string
          title: string
          description: string | null
          deadline: string | null
          status: 'open' | 'decided' | 'expired'
          decided_option_id: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          title: string
          description?: string | null
          deadline?: string | null
          status?: 'open' | 'decided' | 'expired'
          decided_option_id?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          title?: string
          description?: string | null
          deadline?: string | null
          status?: 'open' | 'decided' | 'expired'
          decided_option_id?: string | null
        }
        Relationships: []
      }
      decision_options: {
        Row: {
          id: string
          decision_id: string
          title: string
          description: string | null
          cost_eur: number | null
          pros: string | null
          cons: string | null
        }
        Insert: {
          id?: string
          decision_id: string
          title: string
          description?: string | null
          cost_eur?: number | null
          pros?: string | null
          cons?: string | null
        }
        Update: {
          id?: string
          decision_id?: string
          title?: string
          description?: string | null
          cost_eur?: number | null
          pros?: string | null
          cons?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          id: string
          decision_id: string
          option_id: string
          family_id: string
          voted_at: string
        }
        Insert: {
          id?: string
          decision_id: string
          option_id: string
          family_id: string
          voted_at?: string
        }
        Update: {
          id?: string
          decision_id?: string
          option_id?: string
          family_id?: string
          voted_at?: string
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          id: string
          trip_id: string
          category: 'activity' | 'transfer' | 'meal_estimate' | 'entrance_fee' | 'tip' | 'other'
          description: string
          amount_eur: number
          is_confirmed: boolean
          paid_to: 'villa_escape' | 'on_site' | 'self' | null
          day_id: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          category: 'activity' | 'transfer' | 'meal_estimate' | 'entrance_fee' | 'tip' | 'other'
          description: string
          amount_eur: number
          is_confirmed?: boolean
          paid_to?: 'villa_escape' | 'on_site' | 'self' | null
          day_id?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          category?: 'activity' | 'transfer' | 'meal_estimate' | 'entrance_fee' | 'tip' | 'other'
          description?: string
          amount_eur?: number
          is_confirmed?: boolean
          paid_to?: 'villa_escape' | 'on_site' | 'self' | null
          day_id?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          trip_id: string
          question: string
          asked_by_family_id: string | null
          status: 'pending' | 'asked' | 'answered' | 'resolved'
          answer: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          question: string
          asked_by_family_id?: string | null
          status?: 'pending' | 'asked' | 'answered' | 'resolved'
          answer?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          question?: string
          asked_by_family_id?: string | null
          status?: 'pending' | 'asked' | 'answered' | 'resolved'
          answer?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Relationships: []
      }
      packing_items: {
        Row: {
          id: string
          trip_id: string
          item: string
          category: 'essential' | 'activity_specific' | 'comfort' | 'documents'
          for_activity: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          item: string
          category: 'essential' | 'activity_specific' | 'comfort' | 'documents'
          for_activity?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          item?: string
          category?: 'essential' | 'activity_specific' | 'comfort' | 'documents'
          for_activity?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          entity_type: 'activity' | 'decision' | 'question'
          entity_id: string
          family_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: 'activity' | 'decision' | 'question'
          entity_id: string
          family_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: 'activity' | 'decision' | 'question'
          entity_id?: string
          family_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      restaurant_reservations: {
        Row: {
          id: string
          trip_id: string
          day_id: string | null
          restaurant_name: string
          time: string
          num_people: number
          booked_by_family_id: string | null
          confirmation_status: 'pending' | 'confirmed' | 'cancelled'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          day_id?: string | null
          restaurant_name: string
          time: string
          num_people: number
          booked_by_family_id?: string | null
          confirmation_status?: 'pending' | 'confirmed' | 'cancelled'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          day_id?: string | null
          restaurant_name?: string
          time?: string
          num_people?: number
          booked_by_family_id?: string | null
          confirmation_status?: 'pending' | 'confirmed' | 'cancelled'
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      emergency_info: {
        Row: {
          id: string
          trip_id: string
          family_id: string
          insurance_policy: string | null
          insurance_provider: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          family_id: string
          insurance_policy?: string | null
          insurance_provider?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          family_id?: string
          insurance_policy?: string | null
          insurance_provider?: string | null
          notes?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cost_type: 'flat_group' | 'per_person' | 'per_adult_child'
      activity_status: 'confirmed' | 'pending_vote' | 'tentative' | 'cancelled'
      decision_status: 'open' | 'decided' | 'expired'
      budget_category: 'activity' | 'transfer' | 'meal_estimate' | 'entrance_fee' | 'tip' | 'other'
      paid_to_type: 'villa_escape' | 'on_site' | 'self'
      question_status: 'pending' | 'asked' | 'answered' | 'resolved'
      packing_category: 'essential' | 'activity_specific' | 'comfort' | 'documents'
      entity_type: 'activity' | 'decision' | 'question'
      confirmation_status: 'pending' | 'confirmed' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Trip = Database['public']['Tables']['trips']['Row']
export type Family = Database['public']['Tables']['families']['Row']
export type Day = Database['public']['Tables']['days']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type Decision = Database['public']['Tables']['decisions']['Row']
export type DecisionOption = Database['public']['Tables']['decision_options']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type BudgetItem = Database['public']['Tables']['budget_items']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type PackingItem = Database['public']['Tables']['packing_items']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type RestaurantReservation = Database['public']['Tables']['restaurant_reservations']['Row']
export type EmergencyInfo = Database['public']['Tables']['emergency_info']['Row']
