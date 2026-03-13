import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DailyRoute, Employee } from '../types';
import { 
  Users, 
  Map as MapIcon, 
  History, 
  LogOut, 
  Plus, 
  Search,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  UserPlus,
  Route as RouteIcon,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Calendar,
  MessageSquare,
  MapPin,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'routes' | 'employees' | 'logs'>('routes');
  const [routes, setRoutes] = useState<DailyRoute[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<DailyRoute | null>(null);

  // Form States
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday by default
  const [tempSchedule, setTempSchedule] = useState<{ [key: number]: any[] }>({
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: []
  });

  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '', email: '', password: '' });
  const [rangeData, setRangeData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd')
  });
  const [newRoute, setNewRoute] = useState({
    employeeId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    stops: [{ location_name: '', address: '', scheduled_time: '', notes: '' }]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [routesRes, employeesRes] = await Promise.all([
        api.get('/routes/today'),
        api.get('/employees')
      ]);
      setRoutes(routesRes.data);
      setEmployees(employeesRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      await api.put(`/employees/${selectedEmployee.id}/schedule`, { schedule: tempSchedule });
      setShowScheduleModal(false);
      fetchData();
    } catch (err) {
      alert('Error updating schedule');
    }
  };

  const openScheduleModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setTempSchedule(emp.weekly_schedule || { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] });
    setShowScheduleModal(true);
  };

  const addTemplateStop = () => {
    const updated = { ...tempSchedule };
    updated[selectedDay] = [...(updated[selectedDay] || []), { location_name: '', address: '', scheduled_time: '', notes: '' }];
    setTempSchedule(updated);
  };

  const removeTemplateStop = (idx: number) => {
    const updated = { ...tempSchedule };
    updated[selectedDay] = updated[selectedDay].filter((_, i) => i !== idx);
    setTempSchedule(updated);
  };

  const updateTemplateStop = (idx: number, field: string, value: string) => {
    const updated = { ...tempSchedule };
    const dayStops = [...updated[selectedDay]];
    dayStops[idx] = { ...dayStops[idx], [field]: value };
    updated[selectedDay] = dayStops;
    setTempSchedule(updated);
  };

  const handleGenerateRange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/routes/generate-range', rangeData);
      alert(res.data.message);
      setShowRangeModal(false);
      fetchData();
    } catch (err) {
      alert('Error generating routes');
    }
  };

  const handleGenerateMonth = () => {
    const now = new Date();
    const start = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
    const end = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
    setRangeData({ startDate: start, endDate: end });
  };

  const weekdays = [
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
    { id: 0, label: 'Sun' },
  ];

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/employees', newEmployee);
      setShowEmployeeModal(false);
      setNewEmployee({ name: '', phone: '', email: '', password: '' });
      fetchData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error adding employee';
      alert(errorMsg);
    }
  };

  const handleCreateWeeklyRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoute.employeeId) return alert('Select an employee');
    try {
      await api.post('/routes/weekly', newRoute);
      setShowRouteModal(false);
      setNewRoute({
        employeeId: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        stops: [{ location_name: '', address: '', scheduled_time: '', notes: '' }]
      });
      fetchData();
    } catch (err) {
      alert('Error creating weekly route');
    }
  };

  const addStopField = () => {
    setNewRoute({
      ...newRoute,
      stops: [...newRoute.stops, { location_name: '', address: '', scheduled_time: '', notes: '' }]
    });
  };

  const removeStopField = (index: number) => {
    const updatedStops = newRoute.stops.filter((_, i) => i !== index);
    setNewRoute({ ...newRoute, stops: updatedStops });
  };

  const updateStopField = (index: number, field: string, value: string) => {
    const updatedStops = [...newRoute.stops];
    updatedStops[index] = { ...updatedStops[index], [field]: value };
    setNewRoute({ ...newRoute, stops: updatedStops });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-20 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20 overflow-hidden p-1">
             <div className="relative w-full h-full flex items-center justify-center scale-75">
              <div className="absolute w-6 h-6 bg-red-600 rounded-full opacity-80 mix-blend-multiply transform -translate-x-1"></div>
              <div className="absolute w-6 h-6 bg-zinc-900 rounded-full opacity-80 mix-blend-multiply transform translate-x-1"></div>
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">VAST</h1>
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Maintenance Ltd.</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass p-4 rounded-2xl space-y-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Routes Today</p>
            <p className="text-2xl font-bold text-white">{routes.length}</p>
          </div>
          <div className="glass p-4 rounded-2xl space-y-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Employees</p>
            <p className="text-2xl font-bold text-white">{employees.filter(e => e.active).length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          {[
            { id: 'routes', label: 'Routes', icon: MapIcon },
            { id: 'employees', label: 'Team', icon: Users },
            { id: 'logs', label: 'History', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
                : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'routes' && (
                <motion.div
                  key="routes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Active Routes</h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowRangeModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 text-zinc-400 rounded-lg hover:bg-white/10 text-[10px] font-bold transition-all"
                      >
                        <Calendar className="w-3 h-3" /> Generate Routes
                      </button>
                      <button 
                        onClick={() => setShowRouteModal(true)}
                        className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600/20 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {routes.length === 0 ? (
                    <div className="glass p-8 rounded-2xl text-center space-y-2">
                      <RouteIcon className="w-8 h-8 text-zinc-700 mx-auto" />
                      <p className="text-sm text-zinc-500">No routes created for today.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {routes.map((route) => {
                        const completedStops = route.stops.filter(s => s.completed).length;
                        const totalStops = route.stops.length;
                        const progress = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

                        return (
                          <div 
                            key={route.id} 
                            onClick={() => setSelectedRoute(route)}
                            className="glass p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                route.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                                route.status === 'in_progress' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-500'
                              }`}>
                                <RouteIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-sm">{route.employee_name || 'Employee'}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-red-600 transition-all duration-500" 
                                      style={{ width: `${progress}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[9px] text-zinc-500 font-bold">{completedStops}/{totalStops}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                route.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                route.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-zinc-500/10 text-zinc-500'
                              }`}>
                                {route.status.replace('_', ' ')}
                              </div>
                              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'employees' && (
                <motion.div
                  key="employees"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Team</h2>
                    <button 
                      onClick={() => setShowEmployeeModal(true)}
                      className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600/20 transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {employees.map((emp) => (
                      <div key={emp.id} className="glass p-4 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm">{emp.name}</h3>
                            <p className="text-[10px] text-zinc-500">{emp.phone || 'No phone'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => openScheduleModal(emp)}
                            className="p-2 bg-white/5 text-zinc-400 rounded-lg hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            title="Edit Base Weekly Route"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <div className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            emp.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {emp.active ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="Semantic search (ex: cleaning in the center)..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div className="glass p-8 rounded-2xl text-center space-y-2">
                    <History className="w-8 h-8 text-zinc-700 mx-auto" />
                    <p className="text-sm text-zinc-500">The 30-day history will appear here.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="sm:hidden glass sticky bottom-0 z-20 px-6 py-3 flex items-center justify-between border-t border-white/5">
        <button onClick={() => setActiveTab('routes')} className={`p-2 rounded-xl transition-all ${activeTab === 'routes' ? 'text-red-500 bg-red-500/10' : 'text-zinc-500'}`}>
          <MapIcon className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('employees')} className={`p-2 rounded-xl transition-all ${activeTab === 'employees' ? 'text-red-500 bg-red-500/10' : 'text-zinc-500'}`}>
          <Users className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('logs')} className={`p-2 rounded-xl transition-all ${activeTab === 'logs' ? 'text-red-500 bg-red-500/10' : 'text-zinc-500'}`}>
          <History className="w-6 h-6" />
        </button>
      </nav>
      {/* Modals */}
      <AnimatePresence>
        {showEmployeeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-md p-6 rounded-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Add New Employee</h3>
                <button onClick={() => setShowEmployeeModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newEmployee.name}
                    onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={newEmployee.phone}
                    onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email (Login)</label>
                    <input 
                      type="email"
                      required
                      value={newEmployee.email}
                      onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Password</label>
                    <input 
                      type="password"
                      required
                      value={newEmployee.password}
                      onChange={e => setNewEmployee({...newEmployee, password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all">
                  Create Employee & Account
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showRouteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-2xl p-6 rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Create Weekly Schedule</h3>
                <button onClick={() => setShowRouteModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateWeeklyRoute} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Select Employee</label>
                    <select 
                      required
                      value={newRoute.employeeId}
                      onChange={e => setNewRoute({...newRoute, employeeId: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                      <option value="" className="bg-zinc-900">Select...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id} className="bg-zinc-900">{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Start Date</label>
                    <input 
                      type="date" 
                      required
                      value={newRoute.startDate}
                      onChange={e => setNewRoute({...newRoute, startDate: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Checklist (Locations)</h4>
                    <button 
                      type="button"
                      onClick={addStopField}
                      className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Location
                    </button>
                  </div>
                  
                  {newRoute.stops.map((stop, idx) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3 relative">
                      {newRoute.stops.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeStopField(idx)}
                          className="absolute top-2 right-2 text-zinc-600 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <input 
                            placeholder="Location Name"
                            value={stop.location_name}
                            onChange={e => updateStopField(idx, 'location_name', e.target.value)}
                            className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div>
                          <input 
                            type="time"
                            value={stop.scheduled_time}
                            onChange={e => updateStopField(idx, 'scheduled_time', e.target.value)}
                            className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>
                      <input 
                        placeholder="Address (Optional)"
                        value={stop.address}
                        onChange={e => updateStopField(idx, 'address', e.target.value)}
                        className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-zinc-400 focus:outline-none focus:border-red-500"
                      />
                      <input 
                        placeholder="Notes (Optional)"
                        value={stop.notes}
                        onChange={e => updateStopField(idx, 'notes', e.target.value)}
                        className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-zinc-500 italic focus:outline-none focus:border-red-500"
                      />
                    </div>
                  ))}
                </div>

                <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all">
                  Create Weekly Schedule (7 Days)
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedRoute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-lg p-6 rounded-2xl space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Route Details</h3>
                  <p className="text-xs text-zinc-500">{selectedRoute.employee_name} • {selectedRoute.route_date}</p>
                </div>
                <button onClick={() => setSelectedRoute(null)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Status</p>
                    <p className="text-sm font-bold text-white capitalize">{selectedRoute.status.replace('_', ' ')}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Progress</p>
                    <p className="text-sm font-bold text-white">
                      {Math.round((selectedRoute.stops.filter(s => s.completed).length / selectedRoute.stops.length) * 100)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Checklist Progress</h4>
                  {selectedRoute.stops.map((stop, idx) => (
                    <div key={stop.id} className={`p-3 rounded-xl border transition-all ${
                      stop.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                            stop.completed ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            {stop.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${stop.completed ? 'text-emerald-500 line-through' : 'text-white'}`}>
                              {stop.location_name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              <span className="text-[10px] text-zinc-500">Scheduled: {stop.scheduled_time}</span>
                              {stop.completed_at && (
                                <>
                                  <span className="text-zinc-700">•</span>
                                  <span className="text-[10px] text-emerald-500 font-bold">Done: {format(new Date(stop.completed_at), 'HH:mm')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {stop.notes && (
                        <div className="mt-2 ml-9 p-2 bg-black/20 rounded-lg flex gap-2 items-start">
                          <MessageSquare className="w-3 h-3 text-zinc-500 mt-0.5" />
                          <p className="text-[11px] text-zinc-400 italic">"{stop.notes}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setSelectedRoute(null)}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}

        {showRangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-md p-6 rounded-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Generate Routes</h3>
                <button onClick={() => setShowRangeModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleGenerateMonth}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold rounded-lg border border-white/10 transition-all"
                >
                  Current Month
                </button>
              </div>

              <form onSubmit={handleGenerateRange} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Start Date</label>
                    <input 
                      type="date"
                      required
                      value={rangeData.startDate}
                      onChange={e => setRangeData({...rangeData, startDate: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">End Date</label>
                    <input 
                      type="date"
                      required
                      value={rangeData.endDate}
                      onChange={e => setRangeData({...rangeData, endDate: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 italic">
                  * Routes will be created based on each employee's Master Schedule for the corresponding weekdays.
                </p>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all">
                  Generate All Routes
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showScheduleModal && selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-2xl p-6 rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Base Weekly Route (Template)</h3>
                  <p className="text-xs text-zinc-500">Define the repeating schedule for {selectedEmployee.name}</p>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                {weekdays.map(day => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      selectedDay === day.id 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white/5 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleUpdateSchedule} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      {weekdays.find(d => d.id === selectedDay)?.label} Checklist
                    </h4>
                    <button 
                      type="button"
                      onClick={addTemplateStop}
                      className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Location
                    </button>
                  </div>
                  
                  {!tempSchedule[selectedDay] || tempSchedule[selectedDay].length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-white/10 rounded-xl">
                      <p className="text-xs text-zinc-600">No locations scheduled for this day.</p>
                    </div>
                  ) : (
                    tempSchedule[selectedDay].map((stop, idx) => (
                      <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3 relative">
                        <button 
                          type="button"
                          onClick={() => removeTemplateStop(idx)}
                          className="absolute top-2 right-2 text-zinc-600 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <input 
                              placeholder="Location Name"
                              value={stop.location_name}
                              onChange={e => updateTemplateStop(idx, 'location_name', e.target.value)}
                              className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white focus:outline-none focus:border-red-500"
                            />
                          </div>
                          <div>
                            <input 
                              type="time"
                              value={stop.scheduled_time}
                              onChange={e => updateTemplateStop(idx, 'scheduled_time', e.target.value)}
                              className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white focus:outline-none focus:border-red-500"
                            />
                          </div>
                        </div>
                        <input 
                          placeholder="Address (Optional)"
                          value={stop.address}
                          onChange={e => updateTemplateStop(idx, 'address', e.target.value)}
                          className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-zinc-400 focus:outline-none focus:border-red-500"
                        />
                        <input 
                          placeholder="Notes (Optional)"
                          value={stop.notes}
                          onChange={e => updateTemplateStop(idx, 'notes', e.target.value)}
                          className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-zinc-500 italic focus:outline-none focus:border-red-500"
                        />
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-[2] bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all">
                    Save Base Weekly Route
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
