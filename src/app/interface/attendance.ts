export interface Fichaje {
  idFichajes: string;
  usuario: any;
  fecha: string; // ISO date YYYY-MM-DD
  horaEntrada: string; // HH:mm:ss
  horaSalida: string | null; // HH:mm:ss or null
  minutosDescanso: number;
  horasTrabajadas: number | null;
  estado: 'normal' | 'editado' | 'pendiente_revision';
  comentario: string;
  horaEntradaPropuesta?: string;
  horaSalidaPropuesta?: string;
  latitudEntrada?: number;
  longitudEntrada?: number;
  latitudSalida?: number;
  longitudSalida?: number;
}

export interface Solicitud {
  idSolicitud: string;
  usuario: any;
  revisor?: any;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaInicio: string;
  fechaFin: string;
  motivo: 'vacaciones' | 'permiso_horas' | 'baja_medica' | 'maternidad' | 'paternidad' | 'defuncion' | 'asuntos_propios';
  comentario: string;
  fichajeRef?: Fichaje;
  archivoNombre?: string;
  archivoUrl?: string;
  fechaRevision?: string;
  createdAt?: string;
}

export interface Horario {
  idHorario: string;
  nombre: string;
  horaEntrada: string;
  horaSalida: string;
  diasLaborables: string; // "lunes,martes,..."
  fechaInicio: string;
  fechaFin: string | null;
}
