
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
}

export interface Appointment {
  id: string;
  clientName: string;
  serviceIds: string[];
  date: string; // ISO string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  totalValue: number;
  totalDuration: number;
  status: 'scheduled' | 'completed';
}

export interface ClientHistory {
  lastVisit: string | null;
  frequentServices: string[];
  averageTicket: number;
  totalVisits: number;
}

export type ViewType = 'agenda' | 'services' | 'reports';
