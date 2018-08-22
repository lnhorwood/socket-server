import { Socket } from "socket.io";
import { Observable } from "rxjs";
import { RxSocket, SocketRoom } from "./";
import { filter } from "rxjs/operators";

export class UnsecureSocket extends RxSocket {
  constructor(socket: Socket) {
    super(socket);
  }

  emit<T>(event: string, payload: T): void {
    if (this.unauthenticated) {
      super.emit<T>(event, payload);
    }
  }

  on<T>(event: string): Observable<T> {
    return super.on<T>(event).pipe(filter(() => this.unauthenticated));
  }

  get unauthenticated(): boolean {
    return this.rooms[SocketRoom.UNAUTHENTICATED] !== undefined;
  }
}
