import { Observable } from 'rxjs';

export interface Listener {
  on<T>(event: string): Observable<T>;
}
