import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  TokenResponse,
  AccountStatus,
  Portfolio,
  Operation,
  OperationDetail,
  Notification,
  Profile,
  OrderResponse,
  FCI,
  Security,
  Opcion,
  Quote,
  QuoteHistoryEntry,
  MepQuote,
  Instrument,
  Panel,
  CpdCanOperate,
  CpdEntry,
  CpdCommission,
  SimplifiedAmounts,
  SimplifiedParameters,
  SimplifiedValidation,
  AdvisorTest,
  AdvisorMovements,
} from "./interface";
import { IOLMaintenanceError, makeIOLTokenRequest, makeIOLGetRequest, makeIOLPostRequest, makeIOLDeleteRequest } from "./request";
import { tokenManager } from "./tokenManager";
import { z } from "zod";

const IOL_API_BASE: string = "https://api.invertironline.com";

let activeUsername: string | undefined = process.env.IOL_USERNAME;

const formatTokenResponse = (username: string, tokenData: TokenResponse): string => {
    return [
        `Token for user ${username}:`,
        `Access Token: ${tokenData.access_token || "N/A"}`,
        `Token Type: ${tokenData.token_type || "N/A"}`,
        `Expires In: ${tokenData.expires_in || "N/A"} seconds`,
        `Refresh Token: ${tokenData.refresh_token || "N/A"}`,
        `Issued: ${tokenData[".issued"] || "N/A"}`,
        `Expires: ${tokenData[".expires"] || "N/A"}`,
    ].join("\n");
};

const login = async (username: string, password: string): Promise<string> => {
    const tokenData = await makeIOLTokenRequest<TokenResponse>(`${IOL_API_BASE}/token`, { username, password, grant_type: 'password' });
    const accessToken: string = tokenData.access_token || '';
    if (accessToken === '') return `No active token for ${username}`;
    tokenManager.storeToken(username, tokenData);
    return formatTokenResponse(username, tokenData);
};

const ensureToken = async (): Promise<string | null> => {
    const user = activeUsername || process.env.IOL_USERNAME;
    if (!user) return null;

    let token = tokenManager.getAccessToken(user);
    if (token) return token;

    const refreshToken = tokenManager.getRefreshToken(user);
    if (refreshToken) {
        const tokenData = await makeIOLTokenRequest<TokenResponse>(`${IOL_API_BASE}/token`, { refresh_token: refreshToken, grant_type: 'refresh_token' });
        if (tokenData && tokenData.access_token) {
            tokenManager.storeToken(user, tokenData);
            return tokenData.access_token;
        }
    }

    const envPass = process.env.IOL_PASSWORD;
    if (envPass) {
        await login(user, envPass);
        token = tokenManager.getAccessToken(user);
    }

    return token;
};

const isTradingEnabled = (): boolean => {
    const value = process.env.IOL_ENABLE_TRADING;
    return value === "true" || value === "1";
};

const formatError = (error: unknown): string => {
    if (error instanceof IOLMaintenanceError) {
        const retry = error.retryAfter ? ` Retry in ${error.retryAfter} seconds.` : "";
        return `API is under maintenance.${retry}`;
    }
    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return "Unknown error";
};

const registerTools = (server: McpServer) => {

    // ─── Configuración ────────────────────────────────────────────────────────

    server.registerTool(
        "get_config_status",
        { description: "Check which IOL environment variables are configured on the server" },
        async () => {
            const username = process.env.IOL_USERNAME ? "configured" : "not set";
            const password = process.env.IOL_PASSWORD ? "configured" : "not set";
            const trading = process.env.IOL_ENABLE_TRADING || "not set";
            const tradingEnabled = isTradingEnabled();
            return {
                content: [{
                    type: "text",
                    text: [
                        `IOL_USERNAME: ${username}`,
                        `IOL_PASSWORD: ${password}`,
                        `IOL_ENABLE_TRADING: ${trading}`,
                        `Active user: ${activeUsername || "(none)"}`,
                        "",
                        `Auto-login: ${username === "configured" && password === "configured" ? "enabled" : "disabled"}`,
                        `Trading: ${tradingEnabled ? "enabled" : "disabled"}`
                    ].join("\n")
                }]
            };
        }
    );

    server.registerTool(
        "set_active_user",
        {
            description: "Set the active user for subsequent operations. If not set, uses IOL_USERNAME env.",
            inputSchema: { username: z.string().describe("Username or email to set as active") }
        },
        async ({ username }) => {
            activeUsername = username;
            return { content: [{ type: "text", text: `Active user set to: ${username}` }] };
        }
    );

    // ─── Autenticación ────────────────────────────────────────────────────────

    server.registerTool(
        "get_token",
        {
            description: "Get token for an IOL account",
            inputSchema: {
                username: z.string().describe("Username or email for IOL account"),
                password: z.string().describe("Password for IOL account")
            }
        },
        async ({ username, password }) => {
            try {
                const result = await login(username, password);
                return { content: [{ type: "text", text: result }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    // ─── MiCuenta ─────────────────────────────────────────────────────────────

    server.registerTool(
        "get_account_status",
        { description: "Get account status" },
        async () => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<AccountStatus>(`${IOL_API_BASE}/api/v2/estadocuenta`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_portfolio",
        {
            description: "Get portfolio by country",
            inputSchema: { country: z.enum(["argentina", "estados-unidos"]).describe("Country for portfolio lookup") }
        },
        async ({ country }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Portfolio>(`${IOL_API_BASE}/api/v2/portafolio/${country}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_operations",
        {
            description: "Get operations list",
            inputSchema: {
                country: z.enum(["argentina", "estados-unidos"]).optional().describe("Country filter"),
                status: z.enum(["pendientes", "concertadas", "canceladas"]).optional().describe("Status filter"),
                from_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
                to_date: z.string().optional().describe("End date (YYYY-MM-DD)")
            }
        },
        async ({ country, status, from_date, to_date }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            const params = new URLSearchParams();
            if (country) params.append('pais', country);
            if (status) params.append('estado', status);
            if (from_date) params.append('fechaDesde', from_date);
            if (to_date) params.append('fechaHasta', to_date);
            const queryString = params.toString();
            const url = `${IOL_API_BASE}/api/v2/operaciones${queryString ? `?${queryString}` : ''}`;
            try {
                const data = await makeIOLGetRequest<Operation[]>(url, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_operation",
        {
            description: "Get a specific operation by number",
            inputSchema: { operation_number: z.number().describe("Operation number") }
        },
        async ({ operation_number }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<OperationDetail>(`${IOL_API_BASE}/api/v2/operaciones/${operation_number}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "cancel_operation",
        {
            description: "Cancel a pending operation",
            inputSchema: { operation_number: z.number().describe("Operation number to cancel") }
        },
        async ({ operation_number }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLDeleteRequest<OrderResponse>(`${IOL_API_BASE}/api/v2/operaciones/${operation_number}`, accessToken);
                if (!data) return { content: [{ type: "text", text: "Operation cancelled (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    // ─── Notificaciones ───────────────────────────────────────────────────────

    server.registerTool(
        "get_notifications",
        { description: "Get notifications" },
        async () => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Notification[]>(`${IOL_API_BASE}/api/v2/Notificacion`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    // ─── Perfil ───────────────────────────────────────────────────────────────

    server.registerTool(
        "get_profile",
        { description: "Get profile data" },
        async () => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Profile>(`${IOL_API_BASE}/api/v2/datos-perfil`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    // ─── Operar ───────────────────────────────────────────────────────────────

    server.registerTool(
        "buy",
        {
            description: "Place a buy order",
            inputSchema: {
                market: z.enum(["bCBA", "nYSE", "nASDAQ", "rOFX"]).describe("Market code"),
                symbol: z.string().describe("Stock/bond symbol"),
                quantity: z.number().positive().describe("Quantity to buy"),
                price: z.number().positive().describe("Price per unit"),
                term: z.enum(["t0", "t1", "t2"]).optional().default("t0").describe("Settlement term"),
                expiry: z.string().optional().describe("Order expiry date (YYYY-MM-DD)")
            }
        },
        async ({ market, symbol, quantity, price, term, expiry }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const order = { mercado: market, simbolo: symbol, cantidad: quantity, precio: price, plazo: term, validez: expiry };
                const data = await makeIOLPostRequest<OrderResponse>(`${IOL_API_BASE}/api/v2/operar/Comprar`, accessToken, order);
                if (!data) return { content: [{ type: "text", text: "Buy order sent (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "sell",
        {
            description: "Place a sell order",
            inputSchema: {
                market: z.enum(["bCBA", "nYSE", "nASDAQ", "rOFX"]).describe("Market code"),
                symbol: z.string().describe("Stock/bond symbol"),
                quantity: z.number().positive().describe("Quantity to sell"),
                price: z.number().positive().describe("Price per unit"),
                term: z.enum(["t0", "t1", "t2"]).optional().default("t0").describe("Settlement term"),
                expiry: z.string().optional().describe("Order expiry date (YYYY-MM-DD)")
            }
        },
        async ({ market, symbol, quantity, price, term, expiry }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const order = { mercado: market, simbolo: symbol, cantidad: quantity, precio: price, plazo: term, validez: expiry };
                const data = await makeIOLPostRequest<OrderResponse>(`${IOL_API_BASE}/api/v2/operar/Vender`, accessToken, order);
                if (!data) return { content: [{ type: "text", text: "Sell order sent (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "buy_d",
        {
            description: "Place a buy order for D specie (dollar MEP)",
            inputSchema: {
                market: z.enum(["bCBA"]).describe("Market code (bCBA)"),
                symbol: z.string().describe("Stock/bond symbol"),
                quantity: z.number().positive().describe("Quantity to buy"),
                price: z.number().positive().describe("Price per unit"),
                term: z.enum(["t0", "t1", "t2"]).optional().default("t0").describe("Settlement term"),
                expiry: z.string().optional().describe("Order expiry date (YYYY-MM-DD)")
            }
        },
        async ({ market, symbol, quantity, price, term, expiry }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const order = { mercado: market, simbolo: symbol, cantidad: quantity, precio: price, plazo: term, validez: expiry };
                const data = await makeIOLPostRequest<OrderResponse>(`${IOL_API_BASE}/api/v2/operar/ComprarEspecieD`, accessToken, order);
                if (!data) return { content: [{ type: "text", text: "Buy D order sent (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "sell_d",
        {
            description: "Place a sell order for D specie (dollar MEP)",
            inputSchema: {
                market: z.enum(["bCBA"]).describe("Market code (bCBA)"),
                symbol: z.string().describe("Stock/bond symbol"),
                quantity: z.number().positive().describe("Quantity to sell"),
                price: z.number().positive().describe("Price per unit"),
                term: z.enum(["t0", "t1", "t2"]).optional().default("t0").describe("Settlement term"),
                expiry: z.string().optional().describe("Order expiry date (YYYY-MM-DD)")
            }
        },
        async ({ market, symbol, quantity, price, term, expiry }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const order = { mercado: market, simbolo: symbol, cantidad: quantity, precio: price, plazo: term, validez: expiry };
                const data = await makeIOLPostRequest<OrderResponse>(`${IOL_API_BASE}/api/v2/operar/VenderEspecieD`, accessToken, order);
                if (!data) return { content: [{ type: "text", text: "Sell D order sent (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "subscribe_fci",
        {
            description: "Subscribe to a mutual fund (FCI)",
            inputSchema: {
                symbol: z.string().describe("FCI symbol"),
                amount: z.number().positive().describe("Amount to invest")
            }
        },
        async ({ symbol, amount }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLPostRequest<OrderResponse>(`${IOL_API_BASE}/api/v2/operar/suscripcion/fci`, accessToken, { simbolo: symbol, monto: amount });
                if (!data) return { content: [{ type: "text", text: "FCI subscription sent (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "rescue_fci",
        {
            description: "Rescue (redeem) from a mutual fund (FCI)",
            inputSchema: {
                symbol: z.string().describe("FCI symbol"),
                quantity: z.number().positive().describe("Quantity of shares to redeem")
            }
        },
        async ({ symbol, quantity }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLPostRequest<OrderResponse>(`${IOL_API_BASE}/api/v2/operar/rescate/fci`, accessToken, { simbolo: symbol, cantidad: quantity });
                if (!data) return { content: [{ type: "text", text: "FCI rescue sent (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_cpd_can_operate",
        { description: "Check if account can operate CPD" },
        async () => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<CpdCanOperate>(`${IOL_API_BASE}/api/v2/operar/CPD/PuedeOperar`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_cpd_by_status",
        {
            description: "Get CPD by status and segment",
            inputSchema: {
                estado: z.string().describe("Estado del CPD"),
                segmento: z.string().describe("Segmento del CPD")
            }
        },
        async ({ estado, segmento }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<CpdEntry[]>(`${IOL_API_BASE}/api/v2/operar/CPD/${estado}/${segmento}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_cpd_commissions",
        {
            description: "Get CPD commissions by amount, term and rate",
            inputSchema: {
                importe: z.number().describe("Importe"),
                plazo: z.string().describe("Plazo"),
                tasa: z.string().describe("Tasa")
            }
        },
        async ({ importe, plazo, tasa }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<CpdCommission[]>(`${IOL_API_BASE}/api/v2/operar/CPD/Comisiones/${importe}/${plazo}/${tasa}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "place_cpd",
        {
            description: "Place a CPD order",
            inputSchema: { body: z.any().describe("CPD order body") }
        },
        async ({ body }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLPostRequest<OrderResponse>(`${IOL_API_BASE}/api/v2/operar/CPD`, accessToken, body);
                if (!data) return { content: [{ type: "text", text: "CPD order sent (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_operate_token",
        { description: "Get operate token" },
        async () => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLPostRequest<{ token?: string; [key: string]: unknown }>(`${IOL_API_BASE}/api/v2/operar/Token`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    // ─── Operatoria Simplificada ──────────────────────────────────────────────

    server.registerTool(
        "get_simplified_amounts",
        {
            description: "Get estimated amounts for simplified operations",
            inputSchema: { amount: z.number().positive().describe("Amount") }
        },
        async ({ amount }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<SimplifiedAmounts>(`${IOL_API_BASE}/api/v2/OperatoriaSimplificada/MontosEstimados/${amount}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_simplified_parameters",
        {
            description: "Get parameters for simplified operation type",
            inputSchema: { operation_type_id: z.number().describe("Operation type ID") }
        },
        async ({ operation_type_id }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<SimplifiedParameters>(`${IOL_API_BASE}/api/v2/OperatoriaSimplificada/${operation_type_id}/Parametros`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "validate_simplified_operation",
        {
            description: "Validate a simplified operation",
            inputSchema: {
                amount: z.number().positive().describe("Amount"),
                operation_type_id: z.number().describe("Operation type ID")
            }
        },
        async ({ amount, operation_type_id }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<SimplifiedValidation>(`${IOL_API_BASE}/api/v2/OperatoriaSimplificada/Validar/${amount}/${operation_type_id}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_simplified_mep_amounts",
        {
            description: "Get estimated amounts for simplified MEP sale",
            inputSchema: { amount: z.number().positive().describe("Amount") }
        },
        async ({ amount }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<SimplifiedAmounts>(`${IOL_API_BASE}/api/v2/OperatoriaSimplificada/VentaMepSimple/MontosEstimados/${amount}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "buy_simplified",
        {
            description: "Place a simplified buy order",
            inputSchema: { body: z.any().describe("Simplified buy body") }
        },
        async ({ body }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLPostRequest<OrderResponse>(`${IOL_API_BASE}/api/v2/OperatoriaSimplificada/Comprar`, accessToken, body);
                if (!data) return { content: [{ type: "text", text: "Simplified buy sent (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    // ─── Títulos ──────────────────────────────────────────────────────────────

    server.registerTool(
        "get_fci_list",
        { description: "Get all mutual funds (FCI)" },
        async () => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<FCI[]>(`${IOL_API_BASE}/api/v2/Titulos/FCI`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_fci",
        {
            description: "Get a specific mutual fund (FCI) by symbol",
            inputSchema: { symbol: z.string().describe("FCI symbol") }
        },
        async ({ symbol }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<FCI>(`${IOL_API_BASE}/api/v2/Titulos/FCI/${symbol}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_fci_types",
        { description: "Get FCI fund types" },
        async () => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<string[]>(`${IOL_API_BASE}/api/v2/Titulos/FCI/TipoFondos`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_fci_administrators",
        { description: "Get FCI administrators" },
        async () => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<string[]>(`${IOL_API_BASE}/api/v2/Titulos/FCI/Administradoras`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_fci_by_administrator",
        {
            description: "Get FCI types by administrator",
            inputSchema: { administrator: z.string().describe("Administrator name") }
        },
        async ({ administrator }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<string[]>(`${IOL_API_BASE}/api/v2/Titulos/FCI/Administradoras/${administrator}/TipoFondos`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_fci_by_administrator_and_type",
        {
            description: "Get FCI by administrator and type",
            inputSchema: {
                administrator: z.string().describe("Administrator name"),
                fund_type: z.string().describe("Fund type")
            }
        },
        async ({ administrator, fund_type }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<FCI[]>(`${IOL_API_BASE}/api/v2/Titulos/FCI/Administradoras/${administrator}/TipoFondos/${fund_type}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_security",
        {
            description: "Get security info by market and symbol",
            inputSchema: {
                market: z.enum(["bCBA", "nYSE", "nASDAQ", "rOFX"]).describe("Market code"),
                symbol: z.string().describe("Security symbol")
            }
        },
        async ({ market, symbol }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Security>(`${IOL_API_BASE}/api/v2/${market}/Titulos/${symbol}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_options",
        {
            description: "Get options for a security",
            inputSchema: {
                market: z.enum(["bCBA", "nYSE", "nASDAQ", "rOFX"]).describe("Market code"),
                symbol: z.string().describe("Security symbol")
            }
        },
        async ({ market, symbol }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Opcion[]>(`${IOL_API_BASE}/api/v2/${market}/Titulos/${symbol}/Opciones`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    // ─── Cotizaciones ─────────────────────────────────────────────────────────

    server.registerTool(
        "get_quote_instruments",
        {
            description: "Get available quote instruments for a country",
            inputSchema: { country: z.enum(["argentina", "estados-unidos"]).describe("Country") }
        },
        async ({ country }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Instrument[]>(`${IOL_API_BASE}/api/v2/${country}/Titulos/Cotizacion/Instrumentos`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_quote_panels",
        {
            description: "Get available quote panels for an instrument and country",
            inputSchema: {
                instrument: z.string().describe("Instrument type"),
                country: z.enum(["argentina", "estados-unidos"]).describe("Country")
            }
        },
        async ({ instrument, country }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Panel[]>(`${IOL_API_BASE}/api/v2/${country}/Titulos/Cotizacion/Paneles/${instrument}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_quotes_by_instrument_panel_country",
        {
            description: "Get quotes by instrument, panel and country",
            inputSchema: {
                instrument: z.string().describe("Instrument type"),
                panel: z.string().describe("Panel name"),
                country: z.enum(["argentina", "estados-unidos"]).describe("Country")
            }
        },
        async ({ instrument, panel, country }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Quote>(`${IOL_API_BASE}/api/v2/Cotizaciones/${instrument}/${panel}/${country}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_quotes_all",
        {
            description: "Get all quotes for an instrument and country",
            inputSchema: {
                instrument: z.string().describe("Instrument type"),
                country: z.enum(["argentina", "estados-unidos"]).describe("Country")
            }
        },
        async ({ instrument, country }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Quote>(`${IOL_API_BASE}/api/v2/Cotizaciones/${instrument}/${country}/Todos`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_quote",
        {
            description: "Get quote for a specific symbol in a market",
            inputSchema: {
                market: z.enum(["bCBA", "nYSE", "nASDAQ", "rOFX"]).describe("Market code"),
                symbol: z.string().describe("Stock/bond symbol")
            }
        },
        async ({ market, symbol }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Quote>(`${IOL_API_BASE}/api/v2/${market}/Titulos/${symbol}/Cotizacion`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_quote_detail",
        {
            description: "Get detailed quote for a specific symbol",
            inputSchema: {
                market: z.enum(["bCBA", "nYSE", "nASDAQ", "rOFX"]).describe("Market code"),
                symbol: z.string().describe("Stock/bond symbol")
            }
        },
        async ({ market, symbol }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Quote>(`${IOL_API_BASE}/api/v2/${market}/Titulos/${symbol}/CotizacionDetalle`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_quote_detail_mobile",
        {
            description: "Get detailed quote for mobile with settlement term",
            inputSchema: {
                market: z.enum(["bCBA", "nYSE", "nASDAQ", "rOFX"]).describe("Market code"),
                symbol: z.string().describe("Stock/bond symbol"),
                term: z.enum(["t0", "t1", "t2"]).describe("Settlement term")
            }
        },
        async ({ market, symbol, term }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Quote>(`${IOL_API_BASE}/api/v2/${market}/Titulos/${symbol}/CotizacionDetalleMobile/${term}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_quote_history",
        {
            description: "Get historical quotes for a symbol",
            inputSchema: {
                market: z.enum(["bCBA", "nYSE", "nASDAQ", "rOFX"]).describe("Market code"),
                symbol: z.string().describe("Stock/bond symbol"),
                from_date: z.string().describe("Start date (YYYY-MM-DD)"),
                to_date: z.string().describe("End date (YYYY-MM-DD)"),
                adjusted: z.enum(["0", "1"]).optional().default("1").describe("Adjusted prices (0=no, 1=yes)")
            }
        },
        async ({ market, symbol, from_date, to_date, adjusted }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<QuoteHistoryEntry[]>(`${IOL_API_BASE}/api/v2/${market}/Titulos/${symbol}/Cotizacion/seriehistorica/${from_date}/${to_date}/${adjusted}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_mep_quote",
        {
            description: "Get MEP quote for a symbol",
            inputSchema: { symbol: z.string().describe("Security symbol") }
        },
        async ({ symbol }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<MepQuote>(`${IOL_API_BASE}/api/v2/Cotizaciones/MEP/${symbol}`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_mep_quotes",
        {
            description: "Get MEP quotes (POST)",
            inputSchema: { body: z.any().describe("Request body") }
        },
        async ({ body }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLPostRequest<MepQuote[]>(`${IOL_API_BASE}/api/v2/Cotizaciones/MEP`, accessToken, body);
                if (!data) return { content: [{ type: "text", text: "Failed to get MEP quotes (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_orleans_quotes",
        {
            description: "Get Orleans quotes for instrument and country",
            inputSchema: {
                instrument: z.string().describe("Instrument type"),
                country: z.enum(["argentina", "estados-unidos"]).describe("Country")
            }
        },
        async ({ instrument, country }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Quote>(`${IOL_API_BASE}/api/v2/cotizaciones-orleans/${instrument}/${country}/Todos`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_orleans_operable_quotes",
        {
            description: "Get Orleans operable quotes for instrument and country",
            inputSchema: {
                instrument: z.string().describe("Instrument type"),
                country: z.enum(["argentina", "estados-unidos"]).describe("Country")
            }
        },
        async ({ instrument, country }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Quote>(`${IOL_API_BASE}/api/v2/cotizaciones-orleans/${instrument}/${country}/Operables`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_orleans_panel_quotes",
        {
            description: "Get Orleans panel quotes for instrument and country",
            inputSchema: {
                instrument: z.string().describe("Instrument type"),
                country: z.enum(["argentina", "estados-unidos"]).describe("Country")
            }
        },
        async ({ instrument, country }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Quote>(`${IOL_API_BASE}/api/v2/cotizaciones-orleans-panel/${instrument}/${country}/Todos`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_orleans_panel_operable_quotes",
        {
            description: "Get Orleans panel operable quotes for instrument and country",
            inputSchema: {
                instrument: z.string().describe("Instrument type"),
                country: z.enum(["argentina", "estados-unidos"]).describe("Country")
            }
        },
        async ({ instrument, country }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<Quote>(`${IOL_API_BASE}/api/v2/cotizaciones-orleans-panel/${instrument}/${country}/Operables`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    // ─── Asesores ─────────────────────────────────────────────────────────────

    server.registerTool(
        "get_advisor_test_inversor",
        { description: "Get advisor investor test" },
        async () => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLGetRequest<AdvisorTest>(`${IOL_API_BASE}/api/v2/asesores/test-inversor`, accessToken);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "submit_advisor_test",
        {
            description: "Submit advisor investor test",
            inputSchema: { body: z.any().describe("Test body") }
        },
        async ({ body }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLPostRequest<AdvisorTest>(`${IOL_API_BASE}/api/v2/asesores/test-inversor`, accessToken, body);
                if (!data) return { content: [{ type: "text", text: "Failed to submit advisor test (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "submit_advisor_test_for_client",
        {
            description: "Submit advisor investor test for a specific client",
            inputSchema: {
                client_id: z.string().describe("Client ID"),
                body: z.any().describe("Test body")
            }
        },
        async ({ client_id, body }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLPostRequest<AdvisorTest>(`${IOL_API_BASE}/api/v2/asesores/test-inversor/${client_id}`, accessToken, body);
                if (!data) return { content: [{ type: "text", text: "Failed to submit advisor test for client (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "get_advisor_movements",
        {
            description: "Get advisor movements",
            inputSchema: { body: z.any().describe("Request body") }
        },
        async ({ body }) => {
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLPostRequest<AdvisorMovements>(`${IOL_API_BASE}/api/v2/Asesor/Movimientos`, accessToken, body);
                if (!data) return { content: [{ type: "text", text: "Failed to get advisor movements (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );

    server.registerTool(
        "sell_d_advisor",
        {
            description: "Advisor sell D specie order",
            inputSchema: { body: z.any().describe("Sell order body") }
        },
        async ({ body }) => {
            if (!isTradingEnabled()) return { content: [{ type: "text", text: "Trading not enabled. Set IOL_ENABLE_TRADING=true to enable." }] };
            const accessToken = await ensureToken();
            if (!accessToken) return { content: [{ type: "text", text: `No valid token for ${activeUsername || "this account"}. Please login first.` }] };
            try {
                const data = await makeIOLPostRequest<OrderResponse>(`${IOL_API_BASE}/api/v2/asesores/operar/VenderEspecieD`, accessToken, body);
                if (!data) return { content: [{ type: "text", text: "Advisor sell D order sent (no response data)" }] };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: formatError(error) }] };
            }
        }
    );
};

export { registerTools };