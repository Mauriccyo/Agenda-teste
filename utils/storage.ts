
import { Appointment, Service } from '../types';

const STORAGE_KEYS = {
  SERVICES: 'barbearia_sousa_services',
  APPOINTMENTS: 'barbearia_sousa_appointments',
};

export const getStoredServices = (): Service[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
  return data ? JSON.parse(data) : [
    { id: '1', name: 'Corte Social', price: 30, duration: 30 },
    { id: '2', name: 'Barba', price: 20, duration: 20 },
    { id: '3', name: 'Corte + Barba', price: 45, duration: 50 },
  ];
};

export const saveStoredServices = (services: Service[]) => {
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
};

export const getStoredAppointments = (): Appointment[] => {
  const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
  return data ? JSON.parse(data) : [];
};

export const saveStoredAppointments = (appointments: Appointment[]) => {
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
};
