interface TokenResponse {
  'access token'?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  '.issued'?: string;
  '.expires'?: string;
}

interface AccountStatus {
  nombre?: string;
  apellido?: string;
  documento?: string;
  numeroCuenta?: string;
  tipoCuenta?: string;
  estado?: string;
}

interface PortfolioItem {
  simbolo?: string;
  cantidad?: number;
  precioMedio?: number;
  precioActual?: number;
  variacion?: number;
  ganancia?: number;
  valorizacion?: number;
  mercado?: string;
  tipo?: string;
}

interface Portfolio {
  acciones?: PortfolioItem[];
  bonos?: PortfolioItem[];
  fondosComunes?: PortfolioItem[];
  titulosValor?: PortfolioItem[];
  opciones?: PortfolioItem[];
}

interface Operation {
  numero?: number;
  fecha?: string;
  hora?: string;
  estado?: string;
  tipo?: string;
  simbolo?: string;
  cantidad?: number;
  precio?: number;
  monto?: number;
  mercado?: string;
  plazo?: string;
}

interface BuyOrder {
  mercado: string;
  simbolo: string;
  cantidad: number;
  precio: number;
  plazo?: string;
  validez?: string;
}

interface SellOrder {
  mercado: string;
  simbolo: string;
  cantidad: number;
  precio: number;
  plazo?: string;
  validez?: string;
}

interface Quote {
  simbolo?: string;
  apertura?: number;
  maximo?: number;
  minimo?: number;
  ultimo?: number;
  cierre?: number;
  variacion?: number;
  volumen?: number;
  fecha?: string;
  hora?: string;
}

interface QuoteDetail {
  simbolo?: string;
  apertura?: number;
  maximo?: number;
  minimo?: number;
  ultimo?: number;
  cierre?: number;
  variacion?: number;
  volumen?: number;
  montoOperado?: number;
  operaciones?: number;
  fecha?: string;
  hora?: string;
  estado?: string;
}

interface OptionQuote {
  simbolo?: string;
  tipo?: string;
  strike?: number;
  vencimiento?: string;
  ultimo?: number;
  compra?: number;
  venta?: number;
  volumen?: number;
}

interface FCI {
  simbolo?: string;
  nombre?: string;
  tipo?: string;
  administradora?: string;
  valorCuota?: number;
  variacion?: number;
}

interface FCIType {
  id?: number;
  nombre?: string;
}

interface FCIAdministrator {
  id?: number;
  nombre?: string;
}

interface CPDEstado {
  estado?: string;
  segmento?: string;
}

interface CPDComision {
  importe?: number;
  comision?: number;
  tasa?: number;
}

interface OperatoriaSimplificadaMontos {
  monto?: number;
  comision?: number;
  iva?: number;
  montoTotal?: number;
}

interface OperatoriaSimplificadaParametros {
  idTipoOperatoria?: number;
  nombre?: string;
  montoMinimo?: number;
  montoMaximo?: number;
}

interface Notification {
  id?: number;
  mensaje?: string;
  fecha?: string;
  leida?: boolean;
}

interface ProfileData {
  nombre?: string;
  apellido?: string;
  documento?: string;
  email?: string;
  telefono?: string;
}

interface HistoricalQuote {
  fecha?: string;
  apertura?: number;
  maximo?: number;
  minimo?: number;
  cierre?: number;
  volumen?: number;
}

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export type {
  TokenResponse,
  AccountStatus,
  PortfolioItem,
  Portfolio,
  Operation,
  BuyOrder,
  SellOrder,
  Quote,
  QuoteDetail,
  OptionQuote,
  FCI,
  FCIType,
  FCIAdministrator,
  CPDEstado,
  CPDComision,
  OperatoriaSimplificadaMontos,
  OperatoriaSimplificadaParametros,
  Notification,
  ProfileData,
  HistoricalQuote,
  StoredToken
};
