import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private apiUrl = 'https://du-test-api.simbiotiktech.in/todos';
  private token = localStorage.getItem('token'); // ideally load from localStorage/sessionStorage

  constructor(private http: HttpClient) {}

  private getHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    });
  }

  getTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  addTodo(todo: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, todo, { headers: this.getHeaders() });
  }

  updateTodo(id: any, todo: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, todo, { headers: this.getHeaders() });
  }

  getTodo(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  deleteTodo(id: any): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
}
}
