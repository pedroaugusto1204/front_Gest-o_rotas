import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DailyRoute, RouteStop } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  CheckCircle2, 
  Circle, 
  Navigation, 
  Clock, 
  LogOut,
  ChevronRight,
  AlertCircle,
  Loader2,
  Calendar,
  X,
  MessageSquare
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { getSocket } from '../services/socket';

export const EmployeeDashboard: React.FC = () => {
  const { logout, employeeId } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
  const [route, setRoute] = useState<DailyRoute | null>(null);
  const [futureRoutes, setFutureRoutes] = useState<DailyRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stop Completion Modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [completionData, setCompletionData] = useState({
    completed_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [todayRes, futureRes] = await Promise.all([
        api.get(`/routes/today/${employeeId}`),
        api.get(`/routes/future/${employeeId}`)
      ]);
      setRoute(todayRes.data);
      setFutureRoutes(futureRes.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Only today's route might be 404
      } else {
        setError('Error loading routes.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = getSocket();
    if (socket) {
      socket.on(`route:${employeeId}`, (updatedRoute: DailyRoute) => {
        setRoute(updatedRoute);
      });
    }

    return () => {
      if (socket) socket.off(`route:${employeeId}`);
    };
  }, [employeeId]);

  const handleOpenCompleteModal = (stop: RouteStop) => {
    setSelectedStop(stop);
    setCompletionData({
      completed_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      notes: ''
    });
    setShowCompleteModal(true);
  };

  const handleCompleteStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStop || !route) return;

    try {
      await api.patch(`/routes/${route.id}/stops/${selectedStop.id}`, completionData);
      setShowCompleteModal(false);
      fetchData();
    } catch (err) {
      alert('Error completing stop.');
    }
  };

  const handleRegisterDeparture = async () => {
    try {
      await api.patch(`/routes/${route?.id}/departure`);
      // Socket will update the UI
    } catch (err) {
      alert('Error registering departure.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <header className="glass sticky top-0 z-20 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1">
             <div className="relative w-full h-full flex items-center justify-center scale-50">
              <div className="absolute w-6 h-6 bg-red-600 rounded-full opacity-80 mix-blend-multiply transform -translate-x-1"></div>
              <div className="absolute w-6 h-6 bg-zinc-900 rounded-full opacity-80 mix-blend-multiply transform translate-x-1"></div>
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">My Route</h1>
            <p className="text-[9px] text-zinc-400">Vast Maintenance Ltd.</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Tabs */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === 'today' 
              ? 'bg-red-600 text-white' 
              : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Clock className="w-3 h-3" />
            Today
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === 'upcoming' 
              ? 'bg-red-600 text-white' 
              : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Upcoming
          </button>
        </div>

        {activeTab === 'today' ? (
          !route ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-zinc-700" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-medium text-white">No route today</h2>
                <p className="text-sm text-zinc-500">You don't have a route assigned for today yet.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Status Card */}
              <div className="glass p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      route.status === 'completed' ? 'bg-emerald-500' : 
                      route.status === 'in_progress' ? 'bg-amber-500' : 'bg-zinc-500'
                    }`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {route.status === 'completed' ? 'Completed' : 
                       route.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                  {route.departure_time && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock className="w-3 h-3" />
                      Departure: {route.departure_time}
                    </div>
                  )}
                </div>

                {!route.departure_time && (
                  <button
                    onClick={handleRegisterDeparture}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Navigation className="w-4 h-4" />
                    Register Departure
                  </button>
                )}
              </div>

              {/* Stops List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-1">Stops</h3>
                <div className="space-y-3">
                  {route.stops?.sort((a, b) => a.stop_order - b.stop_order).map((stop, index) => (
                    <motion.div
                      key={stop.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`glass p-4 rounded-2xl flex items-start gap-4 transition-all ${
                        stop.completed ? 'opacity-60 grayscale-[0.5]' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          stop.completed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                        }`}>
                          {stop.completed ? <CheckCircle2 className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                        </div>
                        {index < (route.stops?.length || 0) - 1 && (
                          <div className="w-0.5 h-12 bg-zinc-800" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white truncate">{stop.location_name}</h4>
                          <div className="flex flex-col items-end">
                            {stop.scheduled_time && (
                              <span className="text-[10px] text-red-400 font-bold">
                                Entry: {stop.scheduled_time}
                              </span>
                            )}
                            {stop.completed_at && (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                Done: {format(new Date(stop.completed_at), 'HH:mm')}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-1">{stop.address || 'No address'}</p>
                        {stop.notes && (
                          <p className="text-[11px] text-zinc-500 italic mt-1">"{stop.notes}"</p>
                        )}
                        
                        {!stop.completed && route.departure_time && (
                          <button
                            onClick={() => handleOpenCompleteModal(stop)}
                            className="mt-3 w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg border border-white/10 transition-all active:scale-95"
                          >
                            Mark as Completed
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-1">Upcoming Routes</h3>
            {futureRoutes.length === 0 ? (
              <div className="glass p-8 rounded-2xl text-center space-y-2">
                <Calendar className="w-8 h-8 text-zinc-700 mx-auto" />
                <p className="text-sm text-zinc-500">No upcoming routes scheduled.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {futureRoutes.sort((a, b) => a.route_date.localeCompare(b.route_date)).map((r) => (
                  <div key={r.id} className="glass p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{format(new Date(r.route_date + 'T12:00:00'), 'EEEE, MMM do')}</h4>
                        <p className="text-[10px] text-zinc-500">{r.stops.length} locations scheduled</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompleteModal && selectedStop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-sm p-6 rounded-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Complete Stop</h3>
                <button onClick={() => setShowCompleteModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCompleteStop} className="space-y-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Location</p>
                  <p className="text-sm font-bold text-white">{selectedStop.location_name}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Completion Time</label>
                  <input 
                    type="datetime-local"
                    required
                    value={completionData.completed_at}
                    onChange={e => setCompletionData({...completionData, completed_at: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Observations / Notes</label>
                  <textarea 
                    placeholder="Any issues or special notes?"
                    value={completionData.notes}
                    onChange={e => setCompletionData({...completionData, notes: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[100px]"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowCompleteModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-[2] bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all">
                    Confirm Completion
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
