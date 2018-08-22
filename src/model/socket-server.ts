import SocketIO, { Server, ServerOptions, Socket } from "socket.io";
import { fromEvent, Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  RxSocket,
  RxSocketServer,
  SecureSocketServer,
  SocketAuthenticator,
  SocketRoom,
  UnsecureSocket
} from "./";
import { UnsecureSocketServer } from "./unsecure-socket-server";

export class SocketServer implements RxSocketServer {
  private _server: Server;

  constructor(port: number = 8080, options: ServerOptions = {}) {
    this._server = SocketIO(port, options);
    this.on("connection").subscribe((socket: UnsecureSocket) => {
      socket.join(SocketRoom.UNAUTHENTICATED);
    });
    console.log(`Server open for business on port ${port}!`);
  }

  emit<T>(event: string, payload?: T): void {
    this._server.emit(event, payload);
  }

  on(event: "connection"): Observable<RxSocket> {
    return fromEvent<Socket>(<any>this._server, event).pipe(
      map((socket: Socket) => new RxSocket(socket))
    );
  }

  secure(authenticator: SocketAuthenticator): SecureSocketServer {
    return new SecureSocketServer(authenticator, this._server);
  }

  unsecure(): UnsecureSocketServer {
    return new UnsecureSocketServer(this._server);
  }

  get server(): SocketIO.Server {
    return this._server;
  }

  set server(value: SocketIO.Server) {
    this._server = value;
  }
}
