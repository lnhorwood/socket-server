import { Socket } from 'socket.io';
import { Observable, of } from 'rxjs';
import { catchError, filter, mergeMap } from 'rxjs/operators';
import { RxSocket, SocketAuthenticator, SocketCredentials, SocketEvent, SocketRoom } from './';

export class SecureSocket extends RxSocket {
  private _token: string;

  constructor(authenticator: SocketAuthenticator, socket: Socket) {
    super(socket);
    super
      .on<SocketCredentials>(SocketEvent.LOGIN)
      .pipe(
        filter(() => !this.authenticated),
        mergeMap((credentials: SocketCredentials) =>
          authenticator.login(credentials).pipe(
            catchError(error => {
              super.emit(SocketEvent.LOGIN_FAILED, error);
              return of(null);
            })
          )
        ),
        filter((token: string) => token !== null)
      )
      .subscribe((token: string) => this.authenticate(token));
    super
      .on<string>(SocketEvent.LOGOUT)
      .pipe(
        filter(() => this.authenticated),
        mergeMap(() =>
          authenticator.logout(this.token).pipe(
            catchError(error => {
              this.invalidate(SocketEvent.LOGOUT_FAILED, error);
              return of(true);
            })
          )
        ),
        filter((logoutFailed: boolean) => !logoutFailed)
      )
      .subscribe(() => this.logout());
    super
      .on<SocketCredentials>(SocketEvent.REGISTER)
      .pipe(
        filter(() => !this.authenticated),
        mergeMap((credentials: SocketCredentials) =>
          authenticator.register(credentials).pipe(
            catchError(error => {
              super.emit(SocketEvent.REGISTRATION_FAILED, error);
              return of(null);
            })
          )
        ),
        filter((token: string) => token !== null)
      )
      .subscribe((token: string) => this.authenticate(token));
    super
      .on<string>(SocketEvent.VALIDATE_TOKEN)
      .pipe(
        mergeMap((token: string) =>
          authenticator.validate(token).pipe(
            catchError(error => {
              this.invalidate(SocketEvent.TOKEN_VALIDATION_FAILED, error);
              return of(null);
            })
          )
        ),
        filter((token: string) => token !== null)
      )
      .subscribe((token: string) => this.authenticate(token));
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
    this.invalidate(SocketEvent.LOGOUT_SUCCESS);
  }

  private invalidate<T>(event: SocketEvent, message?: T): void {
    if (this.authenticated) {
      this.join(SocketRoom.UNAUTHENTICATED);
      this.leave(SocketRoom.AUTHENTICATED);
      delete this._token;
    }
    super.emit<T>(event, message);
  }

}
