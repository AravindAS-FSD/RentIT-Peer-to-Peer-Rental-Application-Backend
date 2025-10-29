import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from 'http';
import { Server } from 'socket.io';

// Use .js extension for local file imports in ES Modules
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import itemRoutes from "./routes/items.js"; 
import rentalRoutes from './routes/rentals.js';
import bundleRoutes from './routes/bundles.js';
import Rental from './models/Rental.js';

// --- INITIAL SETUP ---
dotenv.config();
const app = express();

// --- MIDDLEWARE ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable the express app to parse JSON formatted request bodies

// --- DATABASE CONNECTION ---
connectDB();

// --- API ROUTES ---
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes); 
app.use("/api/rentals", rentalRoutes);
app.use("/api/bundles", bundleRoutes);

// --- SERVER & SOCKET.IO SETUP ---
const io = new Server(server, {
  cors: { 
    origin: [
      "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// --- SOCKET.IO EVENT HANDLERS ---
io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    socket.on('join_rental_room', (rentalId) => {
        socket.join(rentalId);
        console.log(`   Client ${socket.id} joined room: ${rentalId}`);
    });

    socket.on('send_message', async ({ rentalId, senderId, text }) => {
        try {
            const rental = await Rental.findById(rentalId);
            if (rental) {
                const message = { sender: senderId, text, timestamp: new Date() };
                rental.messages.push(message);
                await rental.save();

                // Broadcast the message to everyone in the specific rental room
                io.to(rentalId).emit('receive_message', message);
            }
        } catch (error) {
            console.error('Error saving or broadcasting message:', error);
        }
    });
    
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// --- START THE SERVER ---
const PORT = process.env.PORT || 5000;

// Call .listen() on the 'server' instance (the http server)
server.listen(PORT, () => {
  console.log(`🚀 Server with Socket.IO running on http://localhost:${PORT}`);
});
