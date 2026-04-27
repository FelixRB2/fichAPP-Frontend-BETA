import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../admin/sidebar';
import { SolicitudService } from '../../services/solicitud.service';
import { AuthService } from '../../services/auth.service';
import { Solicitud } from '../../interface/attendance';

@Component({
  selector: 'app-solicitudes-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, DatePipe, TitleCasePipe],
  templateUrl: './solicitudes.html',
  styleUrls: ['./solicitudes.css']
})
export class SolicitudesUsuario implements OnInit {
  private solicitudService = inject(SolicitudService);
  private authService = inject(AuthService);

  misSolicitudes = signal<Solicitud[]>([]);
  mostrarModalAusencia = signal(false);
  
  nuevaAusencia = signal({
    motivo: 'vacaciones' as any,
    fechaInicio: '',
    fechaFin: '',
    comentario: ''
  });
  archivoSeleccionado: File | null = null;

  async ngOnInit() {
    await this.cargarSolicitudes();
  }

  async cargarSolicitudes() {
    const idUsuario = this.authService.getUserId();
    if (idUsuario) {
      this.misSolicitudes.set(await this.solicitudService.obtenerPorUsuario(idUsuario));
    }
  }

  onArchivoSeleccionado(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.archivoSeleccionado = file;
    } else {
      alert('Solo se permiten archivos PDF');
      event.target.value = '';
    }
  }

  async enviarSolicitudAusencia() {
    const data = this.nuevaAusencia();
    const idUsuario = this.authService.getUserId();

    if (!idUsuario || !data.fechaInicio || !data.fechaFin || !this.archivoSeleccionado) {
      alert('Por favor, completa todos los campos y adjunta el PDF.');
      return;
    }

    const formData = new FormData();
    formData.append('idUsuario', idUsuario);
    formData.append('motivo', data.motivo);
    formData.append('fechaInicio', data.fechaInicio);
    formData.append('fechaFin', data.fechaFin);
    formData.append('comentario', data.comentario);
    formData.append('archivo', this.archivoSeleccionado);

    try {
      await this.solicitudService.crearSolicitudAusencia(formData);
      alert('Solicitud enviada correctamente');
      this.mostrarModalAusencia.set(false);
      this.nuevaAusencia.set({
        motivo: 'vacaciones',
        fechaInicio: '',
        fechaFin: '',
        comentario: ''
      });
      this.archivoSeleccionado = null;
      await this.cargarSolicitudes();
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      alert('Error al enviar la solicitud');
    }
  }
}
