import { Socket } from "socket.io";
import { Observable } from "rxjs";
import { filter, mergeMap } from "rxjs/operators";
import {
  RxSocket,
  SocketAuthenticator,
  SocketCredentials,
  SocketEvent,
  SocketRoom
} from "./";

export class SecureSocket extends RxSocket {
  private _token: string;

  constructor(authenticator: SocketAuthenticator, socket: Socket) {
    super(socket);
    super
      .on<SocketCredentials>(SocketEvent.LOGIN)
      .pipe(
        filter(() => !this.authenticated),
        mergeMap(authenticator.login)
      )
      .subscribe(
        (token: string) => this.authenticate(token),
        error => super.emit(SocketEvent.LOGIN_FAILED, error)
      );
    super
      .on<string>(SocketEvent.LOGOUT)
      .pipe(
        filter(() => this.authenticated),
        mergeMap(authenticator.logout)
      )
      .subscribe(
        () => this.logout(),
        error => super.emit(SocketEvent.LOGOUT_FAILED, error)
      );
    super
      .on<string>(SocketEvent.VALIDATE_TOKEN)
      .pipe(
        filter(() => !this.authenticated),
        mergeMap(authenticator.validate)
      )
      .subscribe(
        (token: string) => this.authenticate(token),
        error => super.emit(SocketEvent.TOKEN_VALIDATION_FAILED, error)
      );
  }

  emit<T>(event: string, payload: T): void {
    if (this.authenticated) {
      super.emit(event, payload);
    }
  }

  on<T>(event: string): Observable<T> {
    return super.on<T>(event).pipe(filter(() => this.authenticated));
  }

  get token(): string {
    return this._token;
  }

  set token(value: string) {
    this._token = value;
  }

  private get authenticated(): boolean {
    return this.rooms[SocketRoom.AUTHENTICATED] !== undefined;
  }

  private authenticate(token: string): void {
    this.join(SocketRoom.AUTHENTICATED);
    this.leave(SocketRoom.UNAUTHENTICATED);
    this._token = token;
    super.emit(SocketEvent.AUTHENTICATED, token);
  }

  private logout(): void {
    this.join(SocketRoom.UNAUTHENTICATED);
    this.leave(SocketRoom.AUTHENTICATED);
    delete this._token;
    super.emit(SocketEvent.LOGOUT_SUCCESS);
  }
}
