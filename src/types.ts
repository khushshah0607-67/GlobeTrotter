export interface User {
  id: string
  full_name: string
  email: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  trip_city_id: string
  name: string
  description?: string | null
  category?: string | null
  date: string
  start_time?: string | null
  end_time?: string | null
  duration_minutes?: number | null
  estimated_cost?: number | null
  currency?: string | null
  location_name?: string | null
  latitude?: number | null
  longitude?: number | null
  notes?: string | null
  order_index: number
  created_at?: string
}

export interface TripCity {
  id: string
  trip_id: string
  city_name: string
  country: string
  latitude?: number | null
  longitude?: number | null
  arrival_date: string
  departure_date: string
  order_index: number
  notes?: string | null
  activities?: Activity[]
}

export interface Trip {
  id: string
  owner_id?: string
  title: string
  description?: string | null
  start_date: string
  end_date: string
  cover_image?: string | null
  status: string
  created_at: string
  updated_at: string
  cities?: TripCity[]
}

export interface Budget {
  id: string
  trip_id: string
  total_budget: number
  currency: string
  accommodation_budget?: number | null
  transportation_budget?: number | null
  food_budget?: number | null
  activities_budget?: number | null
  miscellaneous_budget?: number | null
}

export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  joined_at: string
  full_name?: string
  email?: string
}

export interface TripSpendingSummary {
  trip: Trip
  cities_count: number
  activities_count: number
  total_activity_cost: number
  budget: Budget | null
  remaining_budget: number | null
}
