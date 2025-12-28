const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDb = require('./config/dbConnect')
const bodyParser = require('body-parser')
const authRoute = require('./routes/auth.Routes')
const chatRoute = require('./routes/chatRoute')
const statusRoute = require('./routes/statusRoute')
const http = require('http')
const initializeSocket = require('./services/socketService')
dotenv.config()

const PORT = process.env.PORT
const app = express()

// Configure CORS to allow production + development origins.
// Use comma-separated ALLOWED_ORIGINS or single FRONTEND_URL from env, plus common local dev ports.
const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const allowedOrigins = [
  ...envAllowedOrigins,
  'https://whatsapp-clone-3frontend.onrender.com',
  'https://whatsapp-clone-2frontend.onrender.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean)

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser requests like curl/postman (no origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
)

//middlewares
app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))

//database connection
connectDb()

//create server
const server = http.createServer(app)

const io = initializeSocket(server)

//apply socket middleware before routes
app.use((req, res, next) => {
  req.io = io
  req.socketUserMap = io.socketUserMap
  next()
})

//routes
app.use('/api/auth', authRoute)
app.use('/api/chat', chatRoute)
app.use('/api/status', statusRoute)

server.listen(PORT, () => {
  console.log(`server running on this port ${PORT}`)
})

