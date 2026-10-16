import { Server } from 'socket.io';
import { verifyAccessToken } from './utils/jwt.util.js';
import User from './models/User.js';

let io = null;

function parseCookies(header = '') {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((c) => {
    const i = c.indexOf('=');
    if (i > -1) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}

export function initSocket(httpServer) {
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001')
    .split(',')
    .map((s) => s.trim());

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    },
  });

  // Auth middleware: only a logged-in ADMIN may connect
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie || '');
      // Admin cookie takes priority, then storefront/general access token, then auth payload
      const token = cookies.adminAccessToken || cookies.accessToken || socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));

      const decoded = verifyAccessToken(token);
      if (!decoded) return next(new Error('Invalid token'));

      const user = await User.findById(decoded.id);
      if (!user || user.role !== 'ADMIN') return next(new Error('Not an admin'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('admin'); // every admin joins the "admin" room
  });

  return io;
}

export function emitToAdmins(event, data) {
  if (io) {
    io.to('admin').emit(event, data);
  }
}

export function getIO() {
  return io;
}
