import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, string>(); // socketId → userId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(client.id, userId);
      this.server.emit("user:online", { userId });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      this.server.emit("user:offline", { userId });
    }
  }

  // Emit events to all connected clients
  emitAssetUpdate(assetId: string, data: unknown) {
    this.server.emit("asset:updated", { assetId, data });
  }

  emitJournalEntry(entityId: string, entry: unknown) {
    this.server.emit("journal:new", { entityId, entry });
  }

  emitNotification(userId: string, notification: unknown) {
    // Find socket for specific user
    for (const [socketId, uid] of this.connectedUsers.entries()) {
      if (uid === userId) {
        this.server.to(socketId).emit("notification:new", notification);
      }
    }
  }

  emitMatchFound(data: unknown) {
    this.server.emit("matching:new", data);
  }
}
