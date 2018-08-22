import { fromEvent, Observable } from "rxjs";
import { Server, Socket } from "socket.io";
import { RxSocket, RxSocketServer, SocketRoom, UnsecureSocket } from "./";
import { map } from "rxjs/operators";

export class UnsecureSocketServer implements RxSocketServer {
  constructor(private _server: Server) {}

  emit<T>(event: string, payload?: T): void {
    this._server.in(SocketRoom.UNAUTHENTICATED).emit(event, payload);
  }

  on(event: "connection"): Observable<RxSocket> {
    return fromEvent(<any>this._server, event).pipe(
      map((socket: Socket) => new UnsecureSocket(socket))
    );
  }
}
