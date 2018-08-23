import { Observable } from 'rxjs';
import { SocketCredentials } from './';

export interface SocketAuthenticator {
  login(credentials: SocketCredentials): Observable<string>;

  logout(token: string): Observable<void>;

  register(credentials: SocketCredentials): Observable<string>;

  validate(token: string): Observable<string>;
}
