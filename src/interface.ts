// ─── Auth ────────────────────────────────────────────────────────────────────

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  '.issued'?: string;
  '.expires'?: string;
}

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ─── MiCuenta ────────────────────────────────────────────────────────────────

interface Saldo {
  liquidacion: string;
  saldo: number;
  comprometido: number;
  disponible: number;
  disponibleOperar: number;
}

interface Cuenta {
  numero: string;
  tipo: string;
  moneda: string;
  disponible: number;
  comprometido: number;
  saldo: number;
  titulosValorizados: number;
  total: number;
  saldos: Saldo[];
  estado: string;
}

interface Estadistica {
  descripcion: string;
  cantidad: number;
  volumen: number;
}

interface AccountStatus {
  cuentas: Cuenta[];
  estadisticas: Estadistica[];
  totalEnPesos: number;
}

interface TituloPortafolio {
  simbolo: string;
  descripcion: string;
  pais: string;
  mercado: string;
  tipo: string;
  plazo: string;
  moneda: string;
}

interface Parking {
  disponibleInmediato: number;
}

interface PortfolioAsset {
  cantidad: number;
  comprometido: number;
  puntosVariacion: number;
  variacionDiaria: number;
  ultimoPrecio: number;
  ppc: number;
  gananciaPorcentaje: number;
  gananciaDinero: number;
  valorizado: number;
  titulo: TituloPortafolio;
  parking: Parking;
}

interface Portfolio {
  pais: string;
  activos: PortfolioAsset[];
}

// ─── Operaciones ─────────────────────────────────────────────────────────────

interface OperacionEstado {
  detalle: string;
  fecha: string;
}

interface Arancel {
  tipo: string;
  neto: number;
  iva: number;
  moneda: string;
}

interface OperacionEjecutada {
  fecha: string;
  cantidad: number;
  precio: number;
}

interface OperationDetail {
  numero: number;
  mercado: string;
  simbolo: string;
  moneda: string;
  tipo: string;
  fechaAlta: string;
  validez: string;
  fechaOperado: string;
  estadoActual: string;
  estados: OperacionEstado[];
  aranceles: Arancel[];
  operaciones: OperacionEjecutada[];
  precio: number;
  cantidad: number;
  monto: number;
  fondosParaOperacion: number;
  montoOperacion: number;
  modalidad: string;
}

interface Operation {
  numero: number;
  fechaOrden: string;
  tipo: string;
  estado: string;
  mercado: string;
  simbolo: string;
  cantidad: number;
  monto: number;
  modalidad: string;
  precio: number;
  fechaOperada: string;
  cantidadOperada: number;
  precioOperado: number;
  montoOperado: number;
}

// ─── Perfil ──────────────────────────────────────────────────────────────────

interface Profile {
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  email: string;
  [key: string]: unknown;
}

// ─── Notificaciones ──────────────────────────────────────────────────────────

interface Notification {
  id: number;
  fecha: string;
  mensaje: string;
  leida: boolean;
  [key: string]: unknown;
}

// ─── Operar ──────────────────────────────────────────────────────────────────

interface OrderResponse {
  numeroOperacion?: number;
  [key: string]: unknown;
}

// ─── Títulos ─────────────────────────────────────────────────────────────────

interface FCI {
  simbolo?: string;
  descripcion?: string;
  variacion?: number;
  ultimoOperado?: number;
  horizonteInversion?: string;
  rescate?: string;
  tipoFondo?: string;
  moneda?: string;
  pais?: string;
  mercado?: string;
  [key: string]: unknown;
}

interface Security {
  simbolo: string;
  descripcion: string;
  pais: string;
  mercado: string;
  tipo: string;
  plazo: string;
  moneda: string;
  [key: string]: unknown;
}

interface Opcion {
  cotizacion?: TituloCotizacion;
  simboloSubyacente?: string;
  fechaVencimiento?: string;
  tipoOpcion?: string;
  simbolo?: string;
  descripcion?: string;
  pais?: string;
  mercado?: string;
  tipo?: string;
  plazo?: string;
  moneda?: string;
}

// ─── Cotizaciones ────────────────────────────────────────────────────────────

interface Puntas {
  cantidadCompra: number;
  precioCompra: number;
  precioVenta: number;
  cantidadVenta: number;
}

interface TituloCotizacion {
  simbolo?: string;
  descripcion?: string;
  puntas?: Puntas[];
  ultimoPrecio?: number;
  variacion?: number;
  apertura?: number;
  maximo?: number;
  minimo?: number;
  cierreAnterior?: number;
  ultimoCierre?: number;
  volumen?: number;
  volumenNominal?: number;
  cantidadOperaciones?: number;
  fecha?: string;
  fechaHora?: string;
  tipoOpcion?: string;
  precioEjercicio?: number;
  fechaVencimiento?: string;
  mercado?: string;
  moneda?: string;
  tendencia?: string;
  precioPromedio?: number;
  precioAjuste?: number;
  interesesAbiertos?: number;
}

interface Quote {
  titulo: TituloCotizacion[];
}

interface QuoteHistoryEntry {
  fecha: string;
  apertura: number;
  maximo: number;
  minimo: number;
  ultimo: number;
  cierre: number;
  volumen: number;
  cantidadOperaciones: number;
  [key: string]: unknown;
}

interface MepQuote {
  simbolo?: string;
  precio?: number;
  [key: string]: unknown;
}

// ─── Quote Instruments / Panels ──────────────────────────────────────────────

interface Instrument {
  instrumento: string;
  [key: string]: unknown;
}

interface Panel {
  panel: string;
  [key: string]: unknown;
}

// ─── CPD ─────────────────────────────────────────────────────────────────────

interface CpdCanOperate {
  puedeOperar: boolean;
  [key: string]: unknown;
}

interface CpdEntry {
  [key: string]: unknown;
}

interface CpdCommission {
  [key: string]: unknown;
}

// ─── Operatoria Simplificada ─────────────────────────────────────────────────

interface SimplifiedAmounts {
  [key: string]: unknown;
}

interface SimplifiedParameters {
  [key: string]: unknown;
}

interface SimplifiedValidation {
  [key: string]: unknown;
}

// ─── Asesores ────────────────────────────────────────────────────────────────

interface AdvisorTest {
  [key: string]: unknown;
}

interface AdvisorMovements {
  [key: string]: unknown;
}

export type {
  // Auth
  TokenResponse,
  StoredToken,
  // MiCuenta
  AccountStatus,
  Portfolio,
  PortfolioAsset,
  // Operaciones
  Operation,
  OperationDetail,
  // Perfil
  Profile,
  // Notificaciones
  Notification,
  // Operar
  OrderResponse,
  // Títulos
  FCI,
  Security,
  Opcion,
  // Cotizaciones
  Quote,
  QuoteHistoryEntry,
  MepQuote,
  TituloCotizacion,
  // Instruments / Panels
  Instrument,
  Panel,
  // CPD
  CpdCanOperate,
  CpdEntry,
  CpdCommission,
  // Simplified
  SimplifiedAmounts,
  SimplifiedParameters,
  SimplifiedValidation,
  // Advisors
  AdvisorTest,
  AdvisorMovements,
};