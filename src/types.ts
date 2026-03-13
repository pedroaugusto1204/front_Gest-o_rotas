export type UserRole = 'admin' | 'employee';
export type RouteStatus = 'pending' | 'in_progress' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  active: boolean;
  weekly_schedule?: {
    [key: number]: TemplateStop[]; // 0-6 for Sunday-Saturday
  };
}

export interface TemplateStop {
  location_name: string;
  address?: string;
  scheduled_time?: string;
  notes?: string;
}

export interface DailyRoute {
  id: string;
  employee_id: string;
  employee_name?: string;
  route_date: string;
  departure_time?: string;
  status: RouteStatus;
  stops?: RouteStop[];
}

export interface RouteStop {
  id: string;
  daily_route_id: string;
  stop_order: number;
  location_name: string;
  address?: string;
  scheduled_time?: string;
  notes?: string;
  completed: boolean;
  completed_at?: string;
}

export interface RouteLog {
  id: string;
  employee_id: string;
  employee_name: string;
  route_date: string;
  departure_time?: string;
  stops_data: RouteStop[];
  logged_at: string;
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  employeeId?: string;
  exp: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  employeeId?: string;
}
