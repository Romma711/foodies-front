import { Timestamp } from "rxjs"

export interface Reserva {
    id :number,
    cantidad : number
    fecha : Date
    horarioLLegada: Date
    estadoReserva: string
    nombreUsuario: string
    nombreRestaurant: string
}
