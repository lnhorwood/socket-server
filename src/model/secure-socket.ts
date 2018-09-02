import { SocketEvent } from './socket-event';
import { SocketRoom } from './socket-room';
import { bindNodeCallback, forkJoin, fromEvent, Observable } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import { Socket } from 'socket.io';
import { SocketChannel } from './socket-channel';

export class SecureSocket implements SocketChannel {
  private _token: string;

  constructor(private readonly _socket: Socket) {}

  authenticate(token: string, event: SocketEvent = SocketEvent.AUTHENTICATED): void {
    this.leave(SocketRoom.UNAUTHENTICATED)
      .pipe(mergeMap(() => this.join(SocketRoom.AUTHENTICATED)))
      .subscribe(() => {
        this._token = token;
        this.secure.emit<string>(event, token);
      });
  }

  emit<T>(event: string, payload?: T): void {
    this.socket.emit(event, payload);
  }

  join(room: string): Observable<void> {
    return bindNodeCallback((room: string, callback: (err) => void) => this.socket.join(room, callback))(room);
  }

  leave(room: string): Observable<void> {
    return bindNodeCallback((room: string, callback: (err) => void) => this.socket.leave(room, callback))(room);
  }

  on<T>(event: string): Observable<T> {
    return fromEvent(this.socket, event);
  }

  unauthenticate<T>(event: SocketEvent, payload?: T): void {
    forkJoin(Object.keys(this.socket.rooms).map((room: string) => this.leave(room)))
      .pipe(mergeMap(() => this.join(SocketRoom.UNAUTHENTICATED)))
      .subscribe(() => {
        delete this._token;
        this.unsecure.emit(event, payload);
      });
  }

  get authenticated(): boolean {
    return this._socket.rooms[SocketRoom.AUTHENTICATED] !== undefined;
  }

  get secure(): SocketChannel {
    return {
      emit: <T>(event: string, payload?: T) => {
        if (this.authenticated) {
          this.emit<T>(event, payload);
        }
      },
      on: <T>(event: string) => this.on<T>(event).pipe(filter(() => this.authenticated))
    };
  }

  get token(): string {
    return this._token;
  }

  get unsecure(): SocketChannel {
    return {
      emit: <T>(event: string, payload?: T) => {
        if (!this.authenticated) {
          this.emit<T>(event, payload);
        }
      },
      on: <T>(event: string) => this.on<T>(event).pipe(filter(() => !this.authenticated))
    };
  }

  private get socket(): Socket {
    return this._socket;
  }
}
