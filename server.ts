import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'vast-maintenance-secret-key-2025';

// In-memory store for demo
let users: any[] = [
  { id: 'admin-1', name: 'Vast Administrator', email: 'admin@vast.com', password: 'admin', role: 'admin' },
  { id: 'emp-1', name: 'Cleaning Employee', email: 'cleaning@vast.com', password: '123', role: 'employee', employeeId: 'employee-1' }
];

let employees: any[] = [
  { 
    id: 'employee-1', 
    user_id: 'emp-1',
    name: 'John Doe', 
    phone: '(11) 99999-9999', 
    active: true,
    weekly_schedule: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] }
  }
];

let dailyRoutes: any[] = [
  { 
    id: 'route-1', 
    employee_id: 'employee-1', 
    employee_name: 'John Doe',
    status: 'in_progress', 
    departure_time: '08:00',
    route_date: new Date().toISOString().split('T')[0],
    stops: [
      { id: 'stop-1', location_name: 'Central Office - 4th Floor', address: 'Main St, 1000', scheduled_time: '08:30', notes: 'Heavy cleaning in meeting rooms', completed: false, stop_order: 1 },
      { id: 'stop-2', location_name: 'Reception and Hall', address: 'Main St, 1000', scheduled_time: '10:00', notes: 'Floor polishing', completed: false, stop_order: 2 },
      { id: 'stop-3', location_name: 'Kitchen and Bathrooms', address: 'Main St, 1000', scheduled_time: '11:30', notes: 'Restocking supplies', completed: false, stop_order: 3 }
    ]
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AUTH
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const token = jwt.sign({ 
        userId: user.id, 
        role: user.role,
        employeeId: user.employeeId 
      }, JWT_SECRET, { expiresIn: '24h' });
      
      return res.json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        employeeId: user.employeeId 
      });
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  });

  // EMPLOYEES
  app.get('/api/employees', (req, res) => {
    res.json(employees);
  });

  app.post('/api/employees', (req, res) => {
    const { name, phone, email, password } = req.body;
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const userId = `user-${Date.now()}`;
    const employeeId = `employee-${Date.now()}`;

    const newUser = {
      id: userId,
      name,
      email,
      password,
      role: 'employee',
      employeeId
    };

    const newEmployee = {
      id: employeeId,
      user_id: userId,
      name,
      phone,
      active: true,
      weekly_schedule: {
        1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: []
      }
    };

    users.push(newUser);
    employees.push(newEmployee);
    
    res.status(201).json(newEmployee);
  });

  app.put('/api/employees/:id/schedule', (req, res) => {
    const employee = employees.find(e => e.id === req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    employee.weekly_schedule = req.body.schedule;
    res.json(employee);
  });

  // ROUTES
  app.get('/api/routes/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const todayRoutes = dailyRoutes.filter(r => r.route_date === today);
    res.json(todayRoutes);
  });

  app.get('/api/routes/today/:employeeId', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    let route = dailyRoutes.find(r => r.employee_id === req.params.employeeId && r.route_date === today);
    
    // Auto-generate from template if not exists
    if (!route) {
      const employee = employees.find(e => e.id === req.params.employeeId);
      const dayOfWeek = new Date().getDay(); // 0-6
      const template = employee?.weekly_schedule?.[dayOfWeek];
      
      if (template && template.length > 0) {
        route = {
          id: `route-${Date.now()}`,
          employee_id: employee.id,
          employee_name: employee.name,
          route_date: today,
          status: 'pending',
          stops: template.map((s: any, idx: number) => ({
            ...s,
            id: `stop-${Date.now()}-${idx}`,
            completed: false,
            stop_order: idx + 1
          }))
        };
        dailyRoutes.push(route);
      }
    }

    if (!route) return res.status(404).json({ error: 'No route for today' });
    res.json(route);
  });

  app.post('/api/routes/generate-range', (req, res) => {
    const { startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let generatedCount = 0;

    employees.forEach(employee => {
      let current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay();
        
        const template = employee.weekly_schedule?.[dayOfWeek];
        if (template && template.length > 0) {
          // Check if route already exists
          const exists = dailyRoutes.find(r => r.employee_id === employee.id && r.route_date === dateStr);
          if (!exists) {
            const newRoute = {
              id: `route-${Date.now()}-${employee.id}-${dateStr}`,
              employee_id: employee.id,
              employee_name: employee.name,
              route_date: dateStr,
              status: 'pending',
              stops: template.map((s: any, idx: number) => ({
                ...s,
                id: `stop-${Date.now()}-${employee.id}-${dateStr}-${idx}`,
                completed: false,
                stop_order: idx + 1
              }))
            };
            dailyRoutes.push(newRoute);
            generatedCount++;
          }
        }
        current.setDate(current.getDate() + 1);
      }
    });

    res.json({ message: `Generated ${generatedCount} routes successfully.` });
  });

  app.get('/api/routes/future/:employeeId', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const futureRoutes = dailyRoutes.filter(r => r.employee_id === req.params.employeeId && r.route_date > today);
    res.json(futureRoutes);
  });

  app.patch('/api/routes/:routeId/stops/:stopId', (req, res) => {
    const route = dailyRoutes.find(r => r.id === req.params.routeId);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    const stop = route.stops.find((s: any) => s.id === req.params.stopId);
    if (!stop) return res.status(404).json({ error: 'Stop not found' });
    
    const { completed_at, notes } = req.body;
    
    stop.completed = true;
    stop.completed_at = completed_at || new Date().toISOString();
    if (notes) stop.notes = notes;
    
    // Check if all stops are completed
    if (route.stops.every((s: any) => s.completed)) {
      route.status = 'completed';
    } else {
      route.status = 'in_progress';
    }
    
    res.json(route);
  });

  app.patch('/api/routes/:routeId/departure', (req, res) => {
    const route = dailyRoutes.find(r => r.id === req.params.routeId);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    route.departure_time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    route.status = 'in_progress';
    res.json(route);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
