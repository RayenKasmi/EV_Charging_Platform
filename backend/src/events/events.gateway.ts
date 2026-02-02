import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:4200', // Angular dev
      'http://localhost:3000', // Alternative frontend
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Subscribe to a specific charger's real-time updates
   * Client sends: { chargerId: 'uuid' }
   * Room format: charger:<chargerId>
   */
  @SubscribeMessage('subscribeToCharger')
  handleSubscribeToCharger(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chargerId: string },
  ) {
    const room = `charger:${data.chargerId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    
    return {
      event: 'subscribed',
      data: { room, chargerId: data.chargerId },
    };
  }

  /**
   * Unsubscribe from a specific charger's updates
   */
  @SubscribeMessage('unsubscribeFromCharger')
  handleUnsubscribeFromCharger(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chargerId: string },
  ) {
    const room = `charger:${data.chargerId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    
    return {
      event: 'unsubscribed',
      data: { room, chargerId: data.chargerId },
    };
  }

  /**
   * Subscribe to a station's updates (all chargers in the station)
   */
  @SubscribeMessage('subscribeToStation')
  handleSubscribeToStation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { stationId: string },
  ) {
    const room = `station:${data.stationId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    
    return {
      event: 'subscribed',
      data: { room, stationId: data.stationId },
    };
  }

  /**
   * Unsubscribe from a station's updates
   */
  @SubscribeMessage('unsubscribeFromStation')
  handleUnsubscribeFromStation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { stationId: string },
  ) {
    const room = `station:${data.stationId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    
    return {
      event: 'unsubscribed',
      data: { room, stationId: data.stationId },
    };
  }
}
