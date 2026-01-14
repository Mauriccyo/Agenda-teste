import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar, 
  Scissors, 
  PieChart, 
  Plus, 
  Check, 
  Trash2, 
  Edit2, 
  X, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Clock,
  DollarSign,
  History,
  Phone
} from 'lucide-react';
import { Appointment, Service, ViewType } from './types';
import { getStoredServices, saveStoredServices, getStoredAppointments, saveStoredAppointments } from './utils/storage';
import { 
  format, 
  addMinutes, 
  parseISO, 
  isSameDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  parse, 
  isToday as isDateToday,
  addDays,
  subDays,
  startOfDay,
  eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export default function App() {
  const [view, setView] = useState<ViewType>('agenda');
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [confirmAction, setConfirmAction] = useState<{title: string, message: string, onConfirm: () => void} | null>(null);

  useEffect(() => {
    setServices(getStoredServices());
    setAppointments(getStoredAppointments());
  }, []);

  useEffect(() => {
    if (services.length > 0) saveStoredServices(services);
  }, [services]);

  useEffect(() => {
    saveStoredAppointments(appointments);
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(app => isSameDay(parseISO(app.date), selectedDate))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDate]);

  const dailyTotal = useMemo(() => {
    return filteredAppointments
      .filter(app => app.status === 'completed')
      .reduce((sum, app) => sum + app.totalValue, 0);
  }, [filteredAppointments]);

  const handleSaveAppointment = (app: Appointment) => {
    if (editingAppointment) {
      setAppointments(prev => prev.map(a => a.id === app.id ? app : a));
    } else {
      setAppointments(prev => [...prev, app]);
    }
    setIsAppointmentModalOpen(false);
    setEditingAppointment(null);
  };

  const handleCompleteAppointment = (id: string) => {
    setConfirmAction({
      title: 'Finalizar Atendimento',
      message: 'Confirmar conclusão do serviço? O valor será contabilizado no faturamento.',
      onConfirm: () => {
        setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: 'completed' } : app));
        setConfirmAction(null);
      }
    });
  };

  const handleDeleteAppointment = (id: string) => {
    setConfirmAction({
      title: 'Excluir Agendamento',
      message: 'Tem certeza que deseja remover este agendamento permanentemente?',
      onConfirm: () => {
        setAppointments(prev => prev.filter(app => app.id !== id));
        setConfirmAction(null);
      }
    });
  };

  const handleEditAppointment = (app: Appointment) => {
    setEditingAppointment(app);
    setIsAppointmentModalOpen(true);
  };

  const handleSaveService = (service: Service) => {
    if (editingService) {
      setServices(prev => prev.map(s => s.id === service.id ? service : s));
    } else {
      setServices(prev => [...prev, service]);
    }
    setIsServiceModalOpen(false);
    setEditingService(null);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-zinc-950 overflow-hidden shadow-2xl">
      <header className="px-6 py-6 bg-zinc-900 border-b border-zinc-800/50 flex justify-between items-center shrink-0 z-10">
        <div>
          <h1 className="text-2xl font-black text-orange-500 tracking-tight italic uppercase leading-none">Sousa Barber</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Painel de Controle</p>
        </div>
        <div className="text-right bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
          <span className="block text-[9px] text-zinc-400 font-black uppercase mb-0.5">Faturamento Dia</span>
          <span className="text-emerald-400 font-black text-base">R$ {dailyTotal.toFixed(2)}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {view === 'agenda' && (
          <AgendaView 
            selectedDate={selectedDate} 
            setSelectedDate={setSelectedDate}
            appointments={filteredAppointments}
            onComplete={handleCompleteAppointment}
            onDelete={handleDeleteAppointment}
            onEdit={handleEditAppointment}
            services={services}
          />
        )}
        {view === 'services' && (
          <ServicesView 
            services={services} 
            onEdit={(s) => { setEditingService(s); setIsServiceModalOpen(true); }} 
            onDelete={(id) => setServices(prev => prev.filter(s => s.id !== id))} 
            onAdd={() => { setEditingService(null); setIsServiceModalOpen(true); }}
          />
        )}
        {view === 'reports' && <ReportsView appointments={appointments} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-900/90 backdrop-blur-2xl border-t border-zinc-800 flex justify-around p-4 pb-10 z-40">
        <NavButton active={view === 'agenda'} onClick={() => setView('agenda')} icon={<Calendar size={24} />} label="Agenda" />
        <NavButton active={view === 'services'} onClick={() => setView('services')} icon={<Scissors size={24} />} label="Serviços" />
        <NavButton active={view === 'reports'} onClick={() => setView('reports')} icon={<PieChart size={24} />} label="Finanças" />
      </nav>

      {view === 'agenda' && (
        <button 
          onClick={() => { setEditingAppointment(null); setIsAppointmentModalOpen(true); }}
          className="fixed bottom-28 right-6 w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-950/50 active:scale-90 transition-all z-50 border-4 border-zinc-950"
        >
          <Plus size={32} strokeWidth={3} className="text-white" />
        </button>
      )}

      {isAppointmentModalOpen && (
        <AppointmentModal 
          onClose={() => { setIsAppointmentModalOpen(false); setEditingAppointment(null); }}
          onSave={handleSaveAppointment}
          services={services}
          editingAppointment={editingAppointment}
          initialDate={selectedDate}
          allAppointments={appointments}
        />
      )}

      {isServiceModalOpen && (
        <ServiceModal 
          onClose={() => { setIsServiceModalOpen(false); setEditingService(null); }}
          onSave={handleSaveService}
          editingService={editingService}
        />
      )}

      {confirmAction && (
        <ConfirmModal 
          title={confirmAction.title}
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 transition-all duration-300 ${active ? 'text-orange-500 scale-110' : 'text-zinc-500'}`}>
      <div className={`${active ? 'bg-orange-500/10 p-2 rounded-xl' : ''}`}>
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}

function AgendaView({ selectedDate, setSelectedDate, appointments, onComplete, onDelete, onEdit, services }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const daysRange = useMemo(() => {
    const start = subDays(new Date(), 7);
    const end = addDays(new Date(), 30);
    return eachDayOfInterval({ start, end });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedDate]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-zinc-900/50 border-b border-zinc-800 pb-4">
        <div className="px-6 pt-4 flex justify-between items-center mb-4">
           <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Selecione o Dia</h2>
           <div className="text-[11px] font-bold text-orange-500 flex items-center gap-1">
             {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
           </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar px-6 py-2"
        >
          {daysRange.map((day) => {
            const isSel = isSameDay(day, selectedDate);
            const isTd = isDateToday(day);
            return (
              <button
                key={day.toISOString()}
                data-selected={isSel}
                onClick={() => setSelectedDate(startOfDay(day))}
                className={`flex-shrink-0 w-16 h-20 rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 border-2 active:scale-95 ${
                  isSel 
                  ? 'bg-orange-600 border-orange-400 shadow-xl shadow-orange-950/40 text-white translate-y-[-4px]' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                <span className={`text-[9px] font-black uppercase mb-1.5 ${isSel ? 'text-orange-200' : 'text-zinc-500'}`}>
                  {format(day, 'eee', { locale: ptBR })}
                </span>
                <span className="text-xl font-black leading-none">{format(day, 'dd')}</span>
                {isTd && !isSel && <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {appointments.length === 0 ? (
          <div className="py-24 text-center opacity-40">
            <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-zinc-800">
               <Calendar size={40} className="text-zinc-700" />
            </div>
            <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest italic">Nada agendado</p>
          </div>
        ) : (
          appointments.map((app: Appointment) => (
            <AppointmentCard key={app.id} app={app} onComplete={onComplete} onDelete={onDelete} onEdit={onEdit} servicesList={services} />
          ))
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ app, onComplete, onDelete, onEdit, servicesList }: any) {
  const isCompleted = app.status === 'completed';
  const names = app.serviceIds.map((id: string) => servicesList.find((s: any) => s.id === id)?.name).filter(Boolean).join(' + ');

  const handleWA = () => {
    const text = `Olá ${app.clientName}! Passando para confirmar seu horário na Barbearia Sousa!\n\n⏰ Hora: ${app.startTime}\n💈 Serviços: ${names}\n💰 Valor: R$ ${app.totalValue.toFixed(2)}\n\nAté logo!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className={`p-6 rounded-[2.5rem] border transition-all duration-500 group ${isCompleted ? 'bg-zinc-900/40 border-zinc-900/50 grayscale opacity-60' : 'bg-zinc-900 border-zinc-800/80 shadow-xl hover:border-zinc-700'}`}>
      <div className="flex justify-between items-start mb-5">
        <div className="space-y-1.5">
          <h3 className="font-black text-zinc-100 text-xl tracking-tighter leading-tight uppercase italic">{app.clientName}</h3>
          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">{names}</p>
        </div>
        <div className="text-right">
          <p className="text-emerald-500 font-black text-2xl leading-none">R$ {app.totalValue.toFixed(2)}</p>
          <div className="inline-flex items-center gap-1.5 mt-3 text-zinc-400 font-black text-[10px] bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800/50">
             <Clock size={12} className="text-orange-500" /> {app.startTime} - {app.endTime}
          </div>
        </div>
      </div>

      {!isCompleted ? (
        <div className="flex gap-2 pt-5 border-t border-zinc-800/50 mt-4">
          <button onClick={() => onComplete(app.id)} className="flex-[3] bg-emerald-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all shadow-lg shadow-emerald-950/20">Finalizar</button>
          <button onClick={() => onEdit(app)} className="flex-1 bg-zinc-800 text-zinc-400 py-4 rounded-2xl active:scale-95 flex justify-center items-center hover:text-white transition-colors"><Edit2 size={18} /></button>
          <button onClick={handleWA} className="flex-1 bg-zinc-800 text-emerald-500 py-4 rounded-2xl active:scale-95 flex justify-center items-center hover:bg-emerald-500/10 transition-colors"><MessageCircle size={18} /></button>
          <button onClick={() => onDelete(app.id)} className="flex-1 bg-zinc-800 text-red-500 py-4 rounded-2xl active:scale-95 flex justify-center items-center hover:bg-red-500/10 transition-colors"><Trash2 size={18} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-2">
          <Check size={16} strokeWidth={4} /> Atendimento Concluído
        </div>
      )}
    </div>
  );
}

function ServicesView({ services, onEdit, onDelete, onAdd }: any) {
  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Serviços</h2>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-1">Catálogo de Valores</p>
        </div>
        <button onClick={onAdd} className="bg-orange-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black flex items-center gap-2 active:scale-90 transition-all uppercase tracking-widest shadow-xl shadow-orange-950/30">
          <Plus size={20} strokeWidth={4} /> NOVO
        </button>
      </div>

      <div className="space-y-4">
        {services.map((s: Service) => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800/80 p-6 rounded-[2.5rem] flex justify-between items-center shadow-lg group hover:border-zinc-700 transition-all">
            <div className="space-y-2">
              <h4 className="font-black text-zinc-100 text-lg uppercase italic tracking-tight">{s.name}</h4>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-1.5">
                  <Clock size={12} className="text-orange-500" /> {s.duration} min
                </span>
                <span className="text-emerald-500 font-black text-base">R$ {s.price.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(s)} className="p-4 bg-zinc-950 rounded-2xl text-zinc-500 hover:text-white transition-colors"><Edit2 size={18} /></button>
              <button onClick={() => onDelete(s.id)} className="p-4 bg-zinc-950 rounded-2xl text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsView({ appointments }: { appointments: Appointment[] }) {
  const getS = (start: Date, end: Date) => {
    const f = appointments.filter(a => {
      const d = parseISO(a.date);
      return a.status === 'completed' && d >= start && d <= end;
    });
    const total = f.reduce((sum, a) => sum + a.totalValue, 0);
    return { total, count: f.length, avg: f.length > 0 ? total / f.length : 0 };
  };

  const n = new Date();
  const d = getS(startOfDay(new Date()), addMinutes(startOfDay(new Date()), 1439));
  const w = getS(startOfWeek(new Date(), { weekStartsOn: 1 }), endOfWeek(new Date(), { weekStartsOn: 1 }));
  const m = getS(startOfMonth(new Date()), endOfMonth(new Date()));

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter px-1">Financeiro</h2>
      <ReportCard title="Ganhos Hoje" stats={d} color="border-orange-500/20" icon={<TrendingUp size={22} className="text-orange-500" />} />
      <ReportCard title="Resumo Semana" stats={w} color="border-emerald-500/20" icon={<TrendingUp size={22} className="text-emerald-500" />} />
      <ReportCard title="Total do Mês" stats={m} color="border-blue-500/20" icon={<TrendingUp size={22} className="text-blue-500" />} />
    </div>
  );
}

function ReportCard({ title, stats, color, icon }: any) {
  return (
    <div className={`bg-zinc-900 border ${color} rounded-[3rem] p-8 shadow-2xl relative overflow-hidden`}>
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-[2.5]"><DollarSign size={80} /></div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/50">{icon}</div>
        <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-10 relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500 font-black uppercase">Valor Total</p>
          <p className="text-3xl font-black text-emerald-500 leading-none tracking-tighter">R$ {stats.total.toFixed(2)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500 font-black uppercase">Serviços</p>
          <p className="text-3xl font-black text-white leading-none tracking-tighter">{stats.count}</p>
        </div>
        <div className="col-span-2 pt-6 border-t border-zinc-800/50 flex justify-between items-center">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Ticket Médio</p>
          <p className="text-xl font-black text-orange-500 tracking-tight italic">R$ {stats.avg.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function AppointmentModal({ onClose, onSave, services, editingAppointment, initialDate, allAppointments }: any) {
  const [name, setName] = useState(editingAppointment?.clientName || '');
  const [sel, setSel] = useState<string[]>(editingAppointment?.serviceIds || []);
  const [date, setDate] = useState(editingAppointment?.date || format(initialDate, 'yyyy-MM-dd'));
  const [time, setTime] = useState(editingAppointment?.startTime || '');
  const [history, setHistory] = useState<any>(null);

  useEffect(() => {
    if (!editingAppointment && !time) {
      const today = allAppointments.filter((a: any) => a.date === date).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
      setTime(today.length > 0 ? today[today.length - 1].endTime : '09:00');
    }
  }, [date]);

  useEffect(() => {
    if (name.length >= 3) {
      const f = allAppointments.filter((a: any) => a.clientName.toLowerCase().includes(name.toLowerCase()) && a.status === 'completed');
      if (f.length > 0) {
        const total = f.reduce((s: number, a: any) => s + a.totalValue, 0);
        setHistory({ last: f.sort((a: any, b: any) => b.date.localeCompare(a.date))[0].date, avg: total / f.length });
      } else setHistory(null);
    } else setHistory(null);
  }, [name]);

  const val = sel.reduce((s, id) => s + (services.find((sv: any) => sv.id === id)?.price || 0), 0);
  const dur = sel.reduce((s, id) => s + (services.find((sv: any) => sv.id === id)?.duration || 0), 0);
  const end = time && dur > 0 ? format(addMinutes(parse(time, 'HH:mm', new Date()), dur), 'HH:mm') : '';

  const toggle = (id: string) => setSel(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const save = () => {
    if (!name.trim() || sel.length === 0 || !time) return;
    onSave({ 
      id: editingAppointment?.id || Math.random().toString(36).substr(2, 9), 
      clientName: name.trim(), 
      serviceIds: sel, 
      date, 
      startTime: time, 
      endTime: end, 
      totalValue: val, 
      totalDuration: dur, 
      status: editingAppointment?.status || 'scheduled' 
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/95 animate-in fade-in duration-300">
      <div className="bg-zinc-950 w-full max-w-md rounded-t-[3.5rem] p-10 border-t border-zinc-800 shadow-2xl overflow-y-auto no-scrollbar max-h-[95vh] animate-slide-up">
        <div className="w-16 h-1.5 bg-zinc-800 rounded-full mx-auto mb-10" />
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">{editingAppointment ? 'Editar' : 'Novo'} Cliente</h2>
          <button onClick={onClose} className="p-3 bg-zinc-900 rounded-2xl text-zinc-500 active:scale-90"><X size={24} /></button>
        </div>

        <div className="space-y-10 pb-12">
          <div className="space-y-3">
            <label className="text-[11px] text-zinc-600 uppercase font-black tracking-widest ml-1">Nome do Cliente</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-900 border-2 border-zinc-800 p-6 rounded-[2rem] text-white font-black text-xl focus:border-orange-600 outline-none transition-all" placeholder="Quem vamos atender?" />
            {history && (
              <div className="bg-orange-600/5 p-5 rounded-[2rem] border border-orange-600/10 mt-4 flex justify-between items-center animate-in zoom-in-95">
                <div className="flex gap-3 items-center">
                   <div className="bg-orange-600/10 p-2 rounded-xl"><History size={16} className="text-orange-500" /></div>
                   <div><p className="text-[9px] text-zinc-500 uppercase font-black">Última Visita</p><p className="text-sm font-bold text-zinc-300">{format(parseISO(history.last), 'dd/MM/yy')}</p></div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] text-zinc-500 uppercase font-black">Ticket Médio</p>
                   <p className="text-sm font-black text-emerald-500">R$ {history.avg.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-[11px] text-zinc-600 uppercase font-black tracking-widest ml-1">Serviços Disponíveis</label>
            <div className="grid grid-cols-2 gap-3">
              {services.map((s: Service) => {
                const active = sel.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggle(s.id)} className={`p-5 rounded-[1.8rem] border-2 text-left transition-all active:scale-95 ${active ? 'bg-orange-600/10 border-orange-600 text-orange-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                    <p className="text-xs font-black tracking-tight leading-none mb-2 uppercase">{s.name}</p>
                    <p className="text-[11px] font-bold opacity-60">R$ {s.price.toFixed(2)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="text-[11px] text-zinc-600 uppercase font-black tracking-widest ml-1">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-900 border-2 border-zinc-800 p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-600" />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] text-zinc-600 uppercase font-black tracking-widest ml-1">Início</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-zinc-900 border-2 border-zinc-800 p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-600" />
            </div>
          </div>

          {val > 0 && (
            <div className="bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-zinc-800 flex justify-between items-center shadow-xl">
              <div><p className="text-[10px] text-zinc-500 font-black uppercase">Previsão Término</p><p className="text-lg font-black text-white italic">{end}</p></div>
              <div className="text-right"><p className="text-[10px] text-zinc-500 font-black uppercase">Valor Total</p><p className="text-3xl font-black text-emerald-500 tracking-tighter">R$ {val.toFixed(2)}</p></div>
            </div>
          )}

          <button onClick={save} disabled={!name.trim() || sel.length === 0 || !time} className="w-full bg-orange-600 text-white font-black py-6 rounded-[2.2rem] text-xl shadow-2xl shadow-orange-950/50 uppercase tracking-[0.2em] active:scale-95 disabled:opacity-30 transition-all">Confirmar Agenda</button>
        </div>
      </div>
    </div>
  );
}

function ServiceModal({ onClose, onSave, editingService }: any) {
  const [n, setN] = useState(editingService?.name || '');
  const [p, setP] = useState(editingService?.price?.toString() || '');
  const [d, setD] = useState(editingService?.duration?.toString() || '');

  const save = () => { if (n && p && d) onSave({ id: editingService?.id || Math.random().toString(36).substr(2, 9), name: n, price: parseFloat(p), duration: parseInt(d) }); };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/98 p-8 animate-in fade-in duration-300">
      <div className="bg-zinc-900 w-full max-w-sm rounded-[3rem] p-10 border border-zinc-800 shadow-2xl space-y-10 animate-slide-up">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{editingService ? 'Ajustar' : 'Novo'} Serviço</h2>
        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-[11px] text-zinc-500 uppercase font-black ml-1 tracking-widest">Nome do Serviço</label>
             <input autoFocus value={n} onChange={e => setN(e.target.value)} className="w-full bg-zinc-950 border-2 border-zinc-800 p-6 rounded-[1.8rem] text-white font-black text-lg outline-none focus:border-orange-600" placeholder="Ex: Degradê" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[11px] text-zinc-500 uppercase font-black ml-1 tracking-widest">Preço (R$)</label>
               <input type="number" value={p} onChange={e => setP(e.target.value)} className="w-full bg-zinc-950 border-2 border-zinc-800 p-6 rounded-[1.8rem] text-white font-black outline-none focus:border-orange-600" placeholder="0.00" />
             </div>
             <div className="space-y-2">
               <label className="text-[11px] text-zinc-500 uppercase font-black ml-1 tracking-widest">Minutos</label>
               <input type="number" value={d} onChange={e => setD(e.target.value)} className="w-full bg-zinc-950 border-2 border-zinc-800 p-6 rounded-[1.8rem] text-white font-black outline-none focus:border-orange-600" placeholder="30" />
             </div>
          </div>
          <div className="flex gap-4 pt-6">
            <button onClick={onClose} className="flex-1 bg-zinc-800 text-zinc-500 font-black py-5 rounded-2xl active:scale-95 transition-all text-[11px] uppercase tracking-widest">Cancelar</button>
            <button onClick={save} className="flex-1 bg-orange-600 text-white font-black py-5 rounded-2xl active:scale-95 shadow-xl shadow-orange-950/20 transition-all text-[11px] uppercase tracking-widest">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 p-10 animate-in fade-in">
      <div className="bg-zinc-900 w-full max-w-xs rounded-[3rem] p-10 border border-zinc-800 shadow-2xl text-center space-y-8 animate-slide-up">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20">
           <Check size={40} strokeWidth={4} />
        </div>
        <div>
           <h3 className="text-2xl font-black mb-3 text-white italic uppercase tracking-tighter">{title}</h3>
           <p className="text-zinc-500 text-sm font-bold leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 bg-zinc-800 text-zinc-500 font-black py-5 rounded-2xl active:scale-95 text-[10px] uppercase tracking-widest">Não</button>
          <button onClick={onConfirm} className="flex-1 bg-orange-600 text-white font-black py-5 rounded-2xl active:scale-95 shadow-xl shadow-orange-950/30 text-[10px] uppercase tracking-widest">Sim, confirmar</button>
        </div>
      </div>
    </div>
  );
}
