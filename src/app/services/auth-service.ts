import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

interface RespuestaLogin {
  token: string;
}

interface RespuestaRegistro {
  id: number;
  nombre: string;
  email: string;
}

@Service()
export class Auth {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:8080/api/auth';

  login(email: string, password: string): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${this.apiUrl}/login`, { email, password });
  }

  registrar(nombre: string, email: string, password: string): Observable<RespuestaRegistro> {
    return this.http.post<RespuestaRegistro>(`${this.apiUrl}/register/cliente`, {
      nombre,
      email,
      password,
    });
  }

  validarToken() {
    return this.http.get('http://localhost:8080/api/protegido');
  }
}