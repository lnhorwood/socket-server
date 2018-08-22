import { Observable } from "rxjs";
import { SocketCredentials } from "./";

export interface SocketAuthenticator {
  connect(): Observable<void>;
  login(credentials: SocketCredentials): Observable<string>;
  logout(token: string): Observable<void>;
  validate(token: string): Observable<string>;
}
