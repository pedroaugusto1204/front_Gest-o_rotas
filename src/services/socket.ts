import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initiateSocketConnection = (token: string) => {
  socket = io('/', {
    auth: {
      token,
    },
  });
  console.log('Connecting socket...');
};

export const disconnectSocket = () => {
  console.log('Disconnecting socket...');
  if (socket) socket.disconnect();
};

export const subscribeToRouteUpdates = (employeeId: string, cb: (data: any) => void) => {
  if (!socket) return;
  socket.on(`route:${employeeId}`, cb);
};

export const subscribeToAdminUpdates = (cb: (data: any) => void) => {
  if (!socket) return;
  socket.on('admin_room_update', cb);
};

export const getSocket = () => socket;
