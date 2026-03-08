import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { configureSocket } from "./config/socketConfig";
import { socketHandler } from "./socket/socketHandler";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = configureSocket(server);

socketHandler(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 WhisperChat Server running on port ${PORT}`);
  console.log(`🔗 Socket.io endpoint active`);
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "WhisperChat Backend" });
});
