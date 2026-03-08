import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";

export const configureSocket = (server: HttpServer) => {
  const io = new SocketServer(server, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"],
    },
  });

  return io;
};
