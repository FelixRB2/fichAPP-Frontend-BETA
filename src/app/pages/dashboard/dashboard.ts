import { Fichaje, Horario, Solicitud } from './../../interface/attendance';
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, UpperCasePipe, NgClass, TitleCasePipe, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { HorarioService } from '../../services/horario.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../services/solicitud.service';

import { Sidebar } from '../admin/sidebar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, UpperCasePipe, NgClass, TitleCasePipe, CommonModule, Sidebar, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class PanelControl implements OnInit {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private horarioService = inject(HorarioService);
  private solicitudService = inject(SolicitudService);
  private enrutador = inject(Router);

  datosUsuario = signal<any>(null);
  fechaActual = signal(new Date());
  fichado = signal(false);
  fichajeActivo = signal<Fichaje | null>(null);
  tiempoTranscurrido = signal('00:00:00');
  
  horariosVigentes = signal<Horario[]>([]);
  historial = signal<Fichaje[]>([]);
  filtroTemporal = signal<'hoy' | 'semana' | 'mes' | 'todos' | 'dia' | 'rango'>('todos');
  
  // UI - Calendario
  mesCalendario = signal(new Date());
  fechaFiltro = signal<string | null>(null); // YYYY-MM-DD
  rangoInicio = signal<Date | null>(null);
  rangoFin = signal<Date | null>(null);

  // UI - Solicitud de Corrección
  mostrarModalCorreccion = signal(false);
  fichajeSeleccionado = signal<Fichaje | null>(null);
  propuesta = signal({
    nuevaEntrada: '',
    nuevaSalida: '',
    comentario: ''
  });


  // Historial filtrado dinámico
  historialFiltrado = computed(() => {
    const registros = this.historial();
    const filtro = this.filtroTemporal();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fRef = this.fechaFiltro();
    const mRef = this.mesCalendario();
    const rIni = this.rangoInicio();
    const rFin = this.rangoFin();

    return registros.filter(r => {
      const fechaReg = new Date(r.fecha);
      fechaReg.setHours(0, 0, 0, 0);
      
      if (filtro === 'dia' && fRef) {
        return r.fecha === fRef;
      }

      if (filtro === 'rango' && rIni) {
          if (!rFin) return fechaReg.getTime() === rIni.getTime();
          return fechaReg >= rIni && fechaReg <= rFin;
      }

      if (filtro === 'hoy') {
        return fechaReg.getTime() === hoy.getTime();
      }
      
      if (filtro === 'semana') {
        const tempHoy = new Date(hoy);
        const diff = tempHoy.getDate() - tempHoy.getDay() + (tempHoy.getDay() === 0 ? -6 : 1);
        const primerDiaSemana = new Date(tempHoy.setDate(diff));
        primerDiaSemana.setHours(0, 0, 0, 0);
        return fechaReg >= primerDiaSemana;
      }
      
      if (filtro === 'mes') {
        const queryDate = mRef;
        return fechaReg.getMonth() === queryDate.getMonth() && 
               fechaReg.getFullYear() === queryDate.getFullYear();
      }
      
      return true;
    });
  });

  horasSemanales = signal('0h 00m');
  horasAldia = signal('0h 00m');
  horasAlmes = signal('0h 00m');
  porcentajeSemanal = signal(0);
  porcentajeDia = signal(0);
  porcentajeMensual = signal(0);

  resumenPeriodo = computed(() => {
    const filtrados = this.historialFiltrado();
    const filtro = this.filtroTemporal();
    const user = this.datosUsuario();
    
    const horasTotales = filtrados.reduce((acc, curr) => acc + (curr.horasTrabajadas || 0), 0);
    // Usar horas semanales del usuario o 40 por defecto
    const horasSemanalesContrato = user?.horasSemanales || 40;
    
    let horasObjetivo = 0;
    let titulo = '';
    
    if (filtro === 'hoy' || filtro === 'dia') {
      horasObjetivo = horasSemanalesContrato / 5;
      titulo = filtro === 'hoy' ? 'Tu Resumen Diario' : 'Resumen del Día';
    } else if (filtro === 'semana') {
      horasObjetivo = horasSemanalesContrato;
      titulo = 'Tu Resumen Semanal';
    } else if (filtro === 'mes') {
      // Cálculo de días laborables en el mes actual (lun-vie)
      const ahora = this.mesCalendario();
      const año = ahora.getFullYear();
      const mes = ahora.getMonth();
      let diasLaborables = 0;
      const totalDias = new Date(año, mes + 1, 0).getDate();
      for (let i = 1; i <= totalDias; i++) {
        const diaSemana = new Date(año, mes, i).getDay();
        if (diaSemana !== 0 && diaSemana !== 6) diasLaborables++;
      }
      horasObjetivo = (horasSemanalesContrato / 5) * diasLaborables;
      titulo = 'Tu Resumen Mensual';
    } else if (filtro === 'rango' && this.rangoInicio()) {
      const inicio = this.rangoInicio()!;
      const fin = this.rangoFin() || inicio;
      let diasLaborables = 0;
      let curr = new Date(inicio);
      while (curr <= fin) {
        const ds = curr.getDay();
        if (ds !== 0 && ds !== 6) diasLaborables++;
        curr.setDate(curr.getDate() + 1);
      }
      horasObjetivo = (horasSemanalesContrato / 5) * diasLaborables;
      titulo = 'Resumen del Periodo';
    } else {
      // 'todos' u otros
      horasObjetivo = 0;
      titulo = 'Actividad Completa';
    }

    return {
      total: horasTotales,
      totalFormateado: this.formatearTiempo(horasTotales),
      objetivo: horasObjetivo,
      objetivoFormateado: `${Math.round(horasObjetivo)}h`,
      porcentaje: horasObjetivo > 0 ? Math.min(100, (horasTotales / horasObjetivo) * 100) : 0,
      titulo
    };
  });

  registrosFiltrados = computed(() => {

    

  })

  ngOnInit() {
    this.datosUsuario.set(this.authService.getUserData());
    this.cargarDatos();
    
    // Actualizar reloj y temporizador cada segundo
    setInterval(() => {
      this.fechaActual.set(new Date());
      if (this.fichado()) {
        this.actualizarTemporizador();
      }
    }, 1000);
  }

  async cargarDatos() {
    const idUsuario = this.authService.getUserId();
    if (!idUsuario) return;

    try {
      // 1. Cargamos datos básicos del dashboard (resumen, fichaje activo)
      const datos = await this.attendanceService.obtenerDatosDashboard(idUsuario);
      
      // 2. Cargamos el historial completo para el calendario
      const fullHistory = await this.attendanceService.obtenerHistorial(idUsuario);

      // 3. Cargamos los horarios vigentes (pueden ser varios para turnos partidos)
      const horarios = await this.horarioService.obtenerVigente(idUsuario);
      this.horariosVigentes.set(horarios);
      
      this.historial.set(fullHistory);
      this.fichajeActivo.set(datos.fichajeActivo);
      this.fichado.set(!!datos.fichajeActivo);
      this.horasSemanales.set(datos.horasSemanalesFormateadas);
      this.horasAldia.set(datos.horasAldiaFormateadas || this.formatearTiempo(0));
      this.horasAlmes.set(datos.horasAlmesFormateadas || this.formatearTiempo(0));
      this.porcentajeSemanal.set(datos.porcentajeSemanal);
      this.porcentajeDia.set(datos.porcentajeDia || 0);
      this.porcentajeMensual.set(datos.porcentajeMensual || 0);
      
      // Si el objeto usuario no tiene horasSemanales, lo actualizamos con lo que venga del dashboard
      if (datos.horasSemanales && !this.datosUsuario()?.horasSemanales) {
        this.datosUsuario.update(u => ({ ...u, horasSemanales: datos.horasSemanales }));
      }

      if (datos.fichajeActivo) {
        this.actualizarTemporizador();
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    }
  }

  async commutarFichaje() {
    const idUsuario = this.authService.getUserId();
    if (!idUsuario) return;

    try {
      const pos = await this.getPosition();
      const lat = pos?.lat || null;
      const lng = pos?.lng || null;

      if (this.fichado()) {
        const activo = this.fichajeActivo();
        if (activo) {
          await this.attendanceService.detenerJornada(activo.idFichajes, lat, lng);
        }
      } else {
        await this.attendanceService.iniciarJornada(idUsuario, lat, lng, 'Entrada desde Dashboard');
      }
      await this.cargarDatos();
    } catch (error) {
      alert('Error al fichar: ' + error);
    }
  }

  cambiarFiltro(nuevoFiltro: 'hoy' | 'semana' | 'mes' | 'todos' | 'dia' | 'rango') {
    this.filtroTemporal.set(nuevoFiltro);
    if (nuevoFiltro !== 'dia' && nuevoFiltro !== 'rango') {
        this.fechaFiltro.set(null);
        this.rangoInicio.set(null);
        this.rangoFin.set(null);
    }
  }

  actualizarTemporizador() {
    const activo = this.fichajeActivo();
    if (!activo) return;

    // Parsear tiempo del backend (HH:mm:ss) y fecha (YYYY-MM-DD)
    const inicioStr = `${activo.fecha}T${activo.horaEntrada}`;
    const inicio = new Date(inicioStr);
    const ahora = new Date();
    
    const diferencia = Math.max(0, ahora.getTime() - inicio.getTime());
    
    const horas = Math.floor(diferencia / 3600000);
    const minutos = Math.floor((diferencia % 3600000) / 60000);
    const segundos = Math.floor((diferencia % 60000) / 1000);

    this.tiempoTranscurrido.set(
      `${this.rellenarCeros(horas)}:${this.rellenarCeros(minutos)}:${this.rellenarCeros(segundos)}`
    );
  }

  private rellenarCeros(num: number): string {
    return num.toString().padStart(2, '0');
  }

  private formatTime(time: string | null): string | null {
    if (!time) return null;
    // Si el formato es HH:mm, añadimos :00
    if (time.length === 5) return `${time}:00`;
    return time;
  }

  formatearTiempo(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) return '--:--';
    const minutosTotales = Math.round(valor * 60);
    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;
    if (horas === 0 && minutos === 0 && valor > 0) return '< 1m';
    if (horas === 0) return `${minutos}m`;
    return `${horas}h ${minutos.toString().padStart(2, '0')}m`;
  }

  formatDias(dias: string): string {
    if (!dias) return '';
    return dias.split(',')
      .map(d => d.trim())
      .map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
      .join(', ');
  }

  checkDiaLaboral(diasStr: string, dia: string): boolean {
    if (!diasStr) return false;
    return diasStr.toLowerCase().split(',').some(d => d.trim() === dia.toLowerCase());
  }

  logout() {
    this.authService.logout();
  }

  // --- Lógica de Calendario ---
  get diasDelMes() {
    const mes = this.mesCalendario();
    const año = mes.getFullYear();
    const m = mes.getMonth();
    
    const primerDia = new Date(año, m, 1);
    const ultimoDia = new Date(año, m + 1, 0);
    
    let startDay = primerDia.getDay() - 1;
    if (startDay === -1) startDay = 6;
    
    const dias = [];
    const ultimoMesPasado = new Date(año, m, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      dias.push({
        fecha: new Date(año, m - 1, ultimoMesPasado.getDate() - i),
        enMesActual: false
      });
    }
    
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      dias.push({
        fecha: new Date(año, m, i),
        enMesActual: true
      });
    }
    
    const padding = 42 - dias.length;
    for (let i = 1; i <= padding; i++) {
      dias.push({
        fecha: new Date(año, m + 1, i),
        enMesActual: false
      });
    }
    
    return dias;
  }

  cambiarMes(delta: number) {
    const nuevo = new Date(this.mesCalendario());
    nuevo.setMonth(nuevo.getMonth() + delta);
    this.mesCalendario.set(nuevo);
    this.filtroTemporal.set('mes');
  }

  seleccionarDia(dia: Date) {
    const fecha = new Date(dia);
    fecha.setHours(0,0,0,0);

    const inicio = this.rangoInicio();
    const fin = this.rangoFin();

    if (!inicio || (inicio && fin)) {
      this.rangoInicio.set(fecha);
      this.rangoFin.set(null);
      this.filtroTemporal.set('rango');
    } else {
      if (fecha < inicio) {
        this.rangoFin.set(inicio);
        this.rangoInicio.set(fecha);
      } else {
        this.rangoFin.set(fecha);
      }
      this.filtroTemporal.set('rango');
    }
    
    // También actualizamos fechaFiltro para compatibilidad si solo es un día
    const y = fecha.getFullYear();
    const m = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const d = fecha.getDate().toString().padStart(2, '0');
    this.fechaFiltro.set(`${y}-${m}-${d}`);
  }

  estaEnRango(dia: Date): boolean {
    const d = new Date(dia);
    d.setHours(0,0,0,0);
    const ini = this.rangoInicio();
    const fin = this.rangoFin();
    if (!ini) return false;
    if (!fin) return d.getTime() === ini.getTime();
    return d >= ini && d <= fin;
  }

  tieneRegistros(dia: Date): boolean {
    const y = dia.getFullYear();
    const m = (dia.getMonth() + 1).toString().padStart(2, '0');
    const d = dia.getDate().toString().padStart(2, '0');
    const dStrLocal = `${y}-${m}-${d}`;
    return this.historial().some(r => r.fecha === dStrLocal);
  }

  // --- Lógica de Correcciones ---
  abrirModalCorreccion(fichaje: Fichaje) {

    
      if (!fichaje.horaSalida) return;
      this.fichajeSeleccionado.set(fichaje);
      this.propuesta.set({
        nuevaEntrada: fichaje.horaEntrada,
        nuevaSalida: fichaje.horaSalida || '',
        comentario: ''
      });
      this.mostrarModalCorreccion.set(true);
    
  }

  async enviarSolicitud() {
    const data = this.propuesta();
    const fichaje = this.fichajeSeleccionado();
    const idUsuario = this.authService.getUserId();

    if (!fichaje || !idUsuario || !data.comentario.trim()) {
      alert('El comentario es obligatorio para solicitar una corrección.');
      return;
    }

    try {
      const requestData = {
        nuevaHoraEntrada: this.formatTime(data.nuevaEntrada),
        nuevaHoraSalida: this.formatTime(data.nuevaSalida),
        comentario: data.comentario
      };

      if (!requestData.nuevaHoraEntrada) {
        alert('La hora de entrada es obligatoria.');
        return;
      }

      if (!requestData.nuevaHoraSalida) {
        alert('La hora de salida es obligatoria.');
        return;
      }

      if (requestData.nuevaHoraEntrada > requestData.nuevaHoraSalida) {
        alert('La hora de entrada no puede ser mayor que la hora de salida.');
        return;
      }

      await this.attendanceService.solicitarCorreccion(
        fichaje.idFichajes,
        requestData.nuevaHoraEntrada,
        requestData.nuevaHoraSalida || '',
        requestData.comentario
      );
      
      this.mostrarModalCorreccion.set(false);
      alert('Solicitud de corrección enviada correctamente.');
      await this.cargarDatos();
    } catch (error) {
      console.error('Error al enviar corrección:', error);
      let mensaje = 'No se ha podido procesar la solicitud.';
      
      if (error instanceof HttpErrorResponse) {
        mensaje = error.error || mensaje;
      }

      alert('Error: ' + mensaje);
    }

  }

  getPosition(): Promise<{ lat: number, lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        resp => {
          resolve({ lat: resp.coords.latitude, lng: resp.coords.longitude });
        },
        err => {
          console.warn('Error obteniendo ubicación:', err);
          resolve(null);
        },
        { timeout: 5000 }
      );
    });
  }
}
