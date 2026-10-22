export type UserRole = 'Admin' | 'User';

export interface LoginRequest {
  usuario: string;
  contrasena: string;
}

export interface LoginResponse {
  mensaje: string;
  usuario: string;
  rol: UserRole;
  token: string;
  duenoId?: number | null;
}

export interface CambiarContrasena {
  contrasenaActual: string;
  contrasenaNueva: string;
}

export interface Rol {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  usuario: string;
  contrasenaHash?: string;
  rolId: number;
  rol?: Rol | null;
}

export interface Tienda {
  id: number;
  tieneDueno: boolean;
  alquiler: boolean;
  costoAlquiler: number;
  duenoId: number | null;
}

export interface Dueno {
  id: number;
  nombre: string;
  apellido: string;
  ruc: string;
  fechaNacimiento: string;
  direccion: string;
  usuarioId?: number;
  usuario?: Usuario | null;
  tiendas?: Tienda[];
}

export interface DuenoCreateRequest {
  nombre: string;
  apellido: string;
  ruc: string;
  fechaNacimiento: string;
  direccion: string;
  usuario: {
    usuario: string;
    contrasenaHash: string;
  };
}

export interface Servicio {
  id: number;
  nombre: string;
  costo: number;
  diaCorte: number;
}

export type DeudaEstado = 'Pendiente' | 'Pagado';

export interface Deuda {
  id: number;
  montoDeuda: number;
  fechaFacturacion: string;
  fechaLimitePago: string;
  estado: DeudaEstado;
  tiendaId: number;
  tienda?: Tienda | null;
  servicioId: number;
  servicio?: Servicio | null;
  pago?: Pago | null;
}

export interface Pago {
  id: number;
  fechaPago: string;
  montoPago: number;
  deudaId: number;
  tiendaId?: number;
  servicioNombre?: string;
}

export interface PagoCreateRequest {
  deudaId: number;
  montoPago: number;
}

export interface ApiMessageResponse {
  mensaje: string;
}
