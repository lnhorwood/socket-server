import SocketIO, { Namespace, Server, ServerOptions, Socket } from 'socket.io';
import { fromEvent, Observable, of } from 'rxjs';
import { SocketRoom } from './socket-room';
import { catchError, filter, map, mergeMap } from 'rxjs/operators';
import { SocketAuthenticator } from './socket-authenticator';
import { SocketEvent } from './socket-event';
import { SocketCredentials } from './socket-credentials';
import { SocketServerChannel } from './socket-server-channel';
import { SecureSocket } from './secure-socket';
import { Emitter } from './emitter';
import { SocketChannel } from './socket-channel';

export class SecureSocketServer implements SocketServerChannel {
  private readonly _server: Server;

  constructor(port: number = 8080, options: ServerOptions = {}) {
    this._server = SocketIO(port, options);
    console.log(`Server open for business on port ${port}!`);
  }

  authenticator(authenticator: SocketAuthenticator): SecureSocketServer {
    this.on('connection').subscribe((socket: SecureSocket) => {
      socket.join(SocketRoom.UNAUTHENTICATED);
      socket
        .on<string>(SocketEvent.VALIDATE_TOKEN)
        .pipe(
          mergeMap((token: string) =>
            authenticator.validate(token).pipe(
              catchError(error => {
                socket.unauthenticate(SocketEvent.TOKEN_VALIDATION_FAILED, error);
                return of(null);
              })
            )
          ),
          filter((token: string) => token !== null)
        )
        .subscribe((token: string) => socket.authenticate(token));
      socket.unsecure
        .on<SocketCredentials>(SocketEvent.LOGIN)
        .pipe(
          mergeMap((credentials: SocketCredentials) =>
            authenticator.login(credentials).pipe(
              catchError(error => {
                socket.emit(SocketEvent.LOGIN_FAILED, error);
                return of(null);
              })
            )
          ),
          filter((token: string) => token !== null)
        )
        .subscribe((token: string) => socket.authenticate(token));
      socket.unsecure
        .on<SocketCredentials>(SocketEvent.REGISTER)
        .pipe(
          mergeMap((credentials: SocketCredentials) =>
            authenticator.register(credentials).pipe(
              catchError(error => {
                socket.emit(SocketEvent.REGISTRATION_FAILED, error);
                return of(null);
              })
            )
          ),
          filter((token: string) => token !== null)
        )
        .subscribe((token: string) => socket.authenticate(token));
      socket.secure
        .on(SocketEvent.LOGOUT)
        .pipe(
          mergeMap(() =>
            authenticator.logout(socket.token).pipe(
              catchError(error => {
                socket.unauthenticate(SocketEvent.LOGOUT_FAILED, error);
                return of(true);
              })
            )
          ),
          filter((logoutFailed: boolean) => !logoutFailed)
        )
        .subscribe(() => {
          socket.unauthenticate(SocketEvent.LOGOUT_SUCCESS);
        });
    });
    return this;
  }

  emit<T>(event: string, payload?: T): void {
    this.server.emit(event, payload);
  }

  in(room: string): Emitter {
    const namespace: Namespace = this.server.in(room);
    return {
      emit: <T>(event: string, payload?: T) => {
        namespace.emit(event, payload);
      }
    };
  }

  on(event: 'connection'): Observable<SocketChannel> {
    return fromEvent<Socket>(<any>this._server, event).pipe(map((socket: Socket) => new SecureSocket(socket)));
  }

  get secure(): SocketServerChannel {
    return {
      emit: <T>(event: string, payload?: T) => this._server.in(SocketRoom.AUTHENTICATED).emit(event, payload),
      in: (room: string) => {
        return {
          emit: <T>(event: string, payload?: T) => {
            if (this.server.sockets.adapter.rooms[room] !== undefined) {
              Object.keys(this.server.sockets.adapter.rooms[room].sockets)
                .map((socketId: string) => this.server.sockets.connected[socketId])
                .filter((socket: Socket) => socket.rooms[SocketRoom.AUTHENTICATED] !== undefined)
                .forEach((socket: Socket) => socket.emit(event, payload));
            }
          }
        };
      }
    };
  }

  get unsecure(): SocketServerChannel {
    return {
      emit: <T>(event: string, payload?: T) => this._server.in(SocketRoom.UNAUTHENTICATED).emit(event, payload),
      in: (room: string) => {
        return {
          emit: <T>(event: string, payload?: T) => {
            if (this.server.sockets.adapter.rooms[room] !== undefined) {
              Object.keys(this.server.sockets.adapter.rooms[room].sockets)
                .map((socketId: string) => this.server.sockets.connected[socketId])
                .filter((socket: Socket) => socket.rooms[SocketRoom.UNAUTHENTICATED] !== undefined)
                .forEach((socket: Socket) => socket.emit(event, payload));
            }
          }
        };
      }
    };
  }

  private get server(): Server {
    return this._server;
  }
}
