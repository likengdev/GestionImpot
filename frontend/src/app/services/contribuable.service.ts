import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Contribuable } from '../models/contribuable.model';
import { unwrapList } from '../utils/api.util';

@Injectable({
  providedIn: 'root'
})
export class ContribuableService {
  private apiUrl = `${environment.apiUrl}/contribuables`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Contribuable[]> {
    return this.http.get<Contribuable[] | { results: Contribuable[] }>(`${this.apiUrl}/`).pipe(
      map(data => unwrapList(data))
    );
  }

  getById(id: number): Observable<Contribuable> {
    return this.http.get<Contribuable>(`${this.apiUrl}/${id}/`);
  }

  create(contribuable: Contribuable): Observable<Contribuable> {
    return this.http.post<Contribuable>(`${this.apiUrl}/`, contribuable);
  }

  update(id: number, contribuable: Contribuable): Observable<Contribuable> {
    return this.http.put<Contribuable>(`${this.apiUrl}/${id}/`, contribuable);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}