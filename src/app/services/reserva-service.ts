import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Reserva } from '../models/reserva';
import { Observable } from 'rxjs';

@Service()
export class ReservaService {
    private http = inject(HttpClient)
    
    private urlR = 'http://localhost:8080/api/reservas'

    getClientResevas (id :number) : Observable<Reserva[]>{
        return this.http.get<Reserva[]>(`${this.urlR}/usuario/${id}`)
    }

    getReserva(id :number) : Observable <Reserva>{
        return this.http.get<Reserva>(`${this.urlR}/${id}`)
    }
}
