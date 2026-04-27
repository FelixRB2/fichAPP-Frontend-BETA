import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environment';
import { Horario } from '../interface/attendance';

@Injectable({
  providedIn: 'root',
})
export class HorarioService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/horarios`;

  async asignarHorario(data: any): Promise<Horario> {
    return await firstValueFrom(
      this.http.post<Horario>(this.baseUrl, data)
    );
  }

  async listarPorUsuario(idUsuario: string): Promise<Horario[]> {
    return await firstValueFrom(
      this.http.get<Horario[]>(`${this.baseUrl}/usuario/${idUsuario}`)
    );
  }

  async obtenerVigente(idUsuario: string): Promise<Horario[]> {
    try {
      return await firstValueFrom(
        this.http.get<Horario[]>(`${this.baseUrl}/usuario/${idUsuario}/vigente`)
      );
    } catch (e) {
      return [];
    }
  }

  async eliminar(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/${id}`)
    );
  }
}
