export interface Property {
  id: number;
  title: string;
  property_type: string;
  city: string;
  area: string;
  size: number;
  size_unit: string;
  price: number;
  price_type: "total" | "per_marla" | "per_sqft";
  listing_type: "sale" | "rent";
  status: string;
  description: string | null;
  features: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface PropertyInput {
  title: string;
  property_type: string;
  city: string;
  area: string;
  size: number;
  size_unit: string;
  price: number;
  price_type: string;
  listing_type: string;
  status: string;
  description?: string | null;
  features?: string | null;
  image_url?: string | null;
}

export interface Lead {
  id: number;
  conversation_id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  property_type: string | null;
  budget: number | null;
  status: string;
  score: number;
  source: string;
  notes: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface LeadInput {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  property_type?: string | null;
  budget?: number | null;
  status?: string;
  source?: string;
  notes?: string | null;
}

export interface ChatResponse {
  reply: string;
  conversation_id: string;
  properties: Property[];
  lead_id: number | null;
}

export interface Booking {
  id: number;
  property_id: number;
  lead_id: number | null;
  conversation_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  scheduled_at: string;
  status: string;
  notes: string | null;
  property_title?: string | null;
  property_city?: string | null;
  property_area?: string | null;
}

export interface BookingInput {
  property_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  scheduled_at: string;
  notes?: string | null;
  lead_id?: number | null;
  conversation_id?: string | null;
}

export interface DashboardStats {
  totalProperties: number;
  availableProperties: number;
  totalLeads: number;
  hotLeads: number;
  avgScore: number;
  conversations: number;
  bookings: number;
  pendingBookings: number;
  inventoryValuePkr: number;
  leadsByStatus: Record<string, number>;
  propertiesByCity: Record<string, number>;
  recentLeads: Array<{
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    property_type: string | null;
    budget: number | null;
    score: number;
    status: string;
    created_at: string | null;
  }>;
  upcomingBookings: Array<{
    id: number;
    name: string;
    scheduled_at: string | null;
    status: string;
    property_title: string | null;
    property_location: string | null;
  }>;
}
