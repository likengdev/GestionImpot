import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Penalite } from '../models/penalite.model';
import { unwrapList } from '../utils/api.util';

@Injectable({
  providedIn: 'root'
})
export class PenaliteService {
  private apiUrl = `${environment.apiUrl}/penalites`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Penalite[]> {
    return this.http.get<Penalite[] | { results: Penalite[] }>(`${this.apiUrl}/`).pipe(
      map(data => unwrapList(data))
    );
  }

  getById(id: number): Observable<Penalite> {
    return this.http.get<Penalite>(`${this.apiUrl}/${id}/`);
  }

  create(penalite: Penalite): Observable<Penalite> {
    return this.http.post<Penalite>(`${this.apiUrl}/`, penalite);
  }

  update(id: number, penalite: Penalite): Observable<Penalite> {
    return this.http.put<Penalite>(`${this.apiUrl}/${id}/`, penalite);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}