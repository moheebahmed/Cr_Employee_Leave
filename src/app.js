const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const hrRoutes = require('./routes/hr.routes');

const app = express();

// ===== SIMPLE CORS FOR TESTING =====
// Comment out the complex config and use this temporarily
app.use(cors()); // Allow all origins
app.options('*', cors()); // Enable preflight for all routes

// OR use this for specific origin
// app.use(cors({
//   origin: 'http://localhost:3000', // Your frontend URL
//   credentials: true
// }));

// ===== ORIGINAL CORS CONFIG (comment this out for now) =====
// const corsOptions = {
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);
    
//     const allowedOrigins = [
//       'http://localhost:3000',
//       'http://localhost:5173',
//       'http://localhost:8080',
//       'http://127.0.0.1:3000',
//       'http://127.0.0.1:5173',
//       'http://127.0.0.1:8080',
//     ];
    
//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: [
//     'Content-Type',
//     'Authorization',
//     'X-Requested-With',
//     'Accept',
//     'Origin',
//     'Access-Control-Request-Method',
//     'Access-Control-Request-Headers'
//   ],
//   exposedHeaders: ['Content-Range', 'X-Content-Range'],
//   maxAge: 86400
// };
// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));

// Other middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/hr', hrRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date(),
    cors: 'enabled' 
  });
});

// Test endpoint
app.get('/api/test-cors', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers
  });
});

app.post('/api/test-post', (req, res) => {
  res.json({
    message: 'POST request successful',
    data: req.body,
    origin: req.headers.origin
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;