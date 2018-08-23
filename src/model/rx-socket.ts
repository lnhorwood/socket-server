import { fromEvent, Observable } from 'rxjs';
import { Socket } from 'socket.io';

export class RxSocket {
  constructor(private _socket: Socket) {}

  join(room: string): void {
    this._socket.join(room);
  }

  leave(room: string): void {
    this._socket.leave(room);
  }

  emit<T>(event: string, payload?: T): void {
    this._socket.emit(event, payload);
  }

  on<T>(event: string): Observable<T> {
    return fromEvent<T>(this._socket, event);
  }

  get rooms(): { [id: string]: string } {
    return this._socket.rooms;
  }
}
