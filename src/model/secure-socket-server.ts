import { fromEvent, Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { Server, Socket } from "socket.io";
import {
  RxSocketServer,
  SecureSocket,
  SocketAuthenticator,
  SocketRoom
} from "./";

export class SecureSocketServer implements RxSocketServer {
  constructor(
    private _authenticator: SocketAuthenticator,
    private _server: Server
  ) {}

  emit<T>(event: string, payload?: T): void {
    this._server.in(SocketRoom.AUTHENTICATED).emit(event, payload);
  }

  on(event: "connection"): Observable<SecureSocket> {
    return this._authenticator.connect().pipe(
      mergeMap(() => fromEvent<Socket>(<any>this._server, event)),
      map((socket: Socket) => new SecureSocket(this._authenticator, socket))
    );
  }
}
