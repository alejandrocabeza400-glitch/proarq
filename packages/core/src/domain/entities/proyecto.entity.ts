export interface Proyecto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  estado: 'PLANIFICACION' | 'EN_EJECUCION' | 'FINALIZADO' | 'SUSPENDIDO';
  clienteId?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
