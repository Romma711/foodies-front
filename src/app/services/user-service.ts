import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user';

@Service()
export class UserService {
    private http = inject(HttpClient)

    private urlC = 'http://localhost:8080/api/clientes'

    getClientInfo(id :number) :Observable<User>{
        return this.http.get<User>(`${this.urlC}/${id}`)
    }

    putClient(id :number, user :User) : Observable<User>{
        return this.http.put<User>(`${this.urlC}/${id}`, user)
    }
}