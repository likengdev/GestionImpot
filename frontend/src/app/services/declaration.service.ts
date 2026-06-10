import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { unwrapList } from '../utils/api.util';

@Injectable({ providedIn: 'root' })
export class DeclarationService {
  private apiUrl = `${environment.apiUrl}/declarations`;
  
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/`).pipe(map(data => unwrapList(data)));
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/`, data);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  soumettre(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/soumettre/`, {});
  }

  valider(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/valider/`, {});
  }

  rejeter(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/rejeter/`, {});
  }
}