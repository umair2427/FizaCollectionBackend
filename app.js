const express = require('express');
const db = require('./helper/db');
const http = require('http');
const socketIo = require('socket.io');
var cors = require('cors');
const productRoutes = require('./routes/product.routes');
const authRoutes = require('./routes/auth.route');
const complainRoutes = require('./routes/complain.routes');
const orderRoutes = require('./routes/order.route');
const itemsRoutes = require('./routes/getItems.routes');
const app = express();

const server = http.createServer(app); // Create HTTP server
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:51730",
    methods: ["GET", "POST"]
  }
});

global.io = io;

const port = 3000; 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors());

app.use('/api', productRoutes, authRoutes, complainRoutes, orderRoutes, itemsRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A client connected');

  // Example: Handle order creation event
  socket.on('orderCreated', (order) => {
    console.log('New order created:', order);
    // Emit a notification to all connected clients
    io.emit('notification', 'New order created: ' + JSON.stringify(order));
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });