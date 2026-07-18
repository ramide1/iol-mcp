# iol-mcp

MCP server for IOL (InvertirOnline) API - provides tools for authentication, portfolio, operations, and quotes via stdio transport.

## Installation

```bash
bun install
```

## Usage

```bash
bun run start
```

### Environment Variables (Optional)

| Variable | Description |
|----------|-------------|
| `IOL_USERNAME` | IOL account username/email |
| `IOL_PASSWORD` | IOL account password |
| `IOL_ENABLE_TRADING` | Set to `true` or `1` to enable buy/sell/cancel operations |

If `IOL_USERNAME` and `IOL_PASSWORD` are set, the server will automatically authenticate when a tool requires it (lazy login). Access tokens auto-refresh using the refresh token when expired. The `username` parameter becomes optional in all tools (except `get_token`). If not set, call `get_token` manually.

Trading tools (`buy`, `sell`, `buy_d`, `sell_d`, `cancel_operation`, `subscribe_fci`, `rescue_fci`, `place_cpd`, `buy_simplified`, `submit_advisor_test`, `submit_advisor_test_for_client`, `sell_d_advisor`) are disabled by default. Set `IOL_ENABLE_TRADING=true` to enable them.

## Available Tools

### Autenticación
| Tool | Description |
|------|-------------|
| `get_token` | Login and get access/refresh tokens |

### MiCuenta
| Tool | Description |
|------|-------------|
| `get_account_status` | Get account info |
| `get_portfolio` | Get portfolio by country |
| `get_operations` | List operations with filters |
| `get_operation` | Get single operation by number |
| `cancel_operation` | Cancel a pending operation |

### Notificaciones y Perfil
| Tool | Description |
|------|-------------|
| `get_notifications` | Get notifications |
| `get_profile` | Get profile data |

### Operar
| Tool | Description |
|------|-------------|
| `buy` | Place a buy order |
| `sell` | Place a sell order |
| `buy_d` | Place a buy order for D specie (MEP) |
| `sell_d` | Place a sell order for D specie (MEP) |
| `subscribe_fci` | Subscribe to mutual fund |
| `rescue_fci` | Rescue from mutual fund |
| `get_cpd_can_operate` | Check CPD operation capability |
| `get_cpd_by_status` | Get CPD by status/segment |
| `get_cpd_commissions` | Get CPD commissions |
| `place_cpd` | Place CPD order |
| `get_operate_token` | Get operate token |

### Operatoria Simplificada
| Tool | Description |
|------|-------------|
| `get_simplified_amounts` | Get simplified operation amounts |
| `get_simplified_parameters` | Get simplified operation parameters |
| `validate_simplified_operation` | Validate simplified operation |
| `get_simplified_mep_amounts` | Get simplified MEP sale amounts |
| `buy_simplified` | Place simplified buy order |

### Títulos
| Tool | Description |
|------|-------------|
| `get_fci_list` | List all mutual funds |
| `get_fci` | Get specific FCI |
| `get_fci_types` | Get FCI fund types |
| `get_fci_administrators` | Get FCI administrators |
| `get_fci_by_administrator` | Get FCI by administrator |
| `get_fci_by_administrator_and_type` | Get FCI by admin and type |
| `get_security` | Get security info |
| `get_options` | Get options for security |

### Cotizaciones
| Tool | Description |
|------|-------------|
| `get_quote_instruments` | Get available quote instruments |
| `get_quote_panels` | Get available quote panels |
| `get_quotes_by_instrument_panel_country` | Get quotes by instrument/panel/country |
| `get_quotes_all` | Get all quotes for instrument |
| `get_quote` | Get quote for symbol |
| `get_quote_detail` | Get detailed quote |
| `get_quote_detail_mobile` | Get detailed quote with term |
| `get_quote_history` | Get historical quotes |
| `get_mep_quote` | Get MEP quote |
| `get_mep_quotes` | Get MEP quotes (POST) |
| `get_orleans_quotes` | Get Orleans quotes |
| `get_orleans_operable_quotes` | Get Orleans operable quotes |
| `get_orleans_panel_quotes` | Get Orleans panel quotes |
| `get_orleans_panel_operable_quotes` | Get Orleans panel operable quotes |

### Asesores
| Tool | Description |
|------|-------------|
| `get_advisor_test_inversor` | Get advisor investor test |
| `submit_advisor_test` | Submit advisor investor test |
| `submit_advisor_test_for_client` | Submit test for client |
| `get_advisor_movements` | Get advisor movements |
| `sell_d_advisor` | Advisor sell D specie |

## Architecture

- **Runtime**: Bun
- **Transport**: stdio
- **SDK**: `@modelcontextprotocol/sdk` v1.29+
- **API Base**: `https://api.invertironline.com`

## Project Structure

```
src/
├── main.ts           # Entry point
├── tool.ts           # MCP tool definitions
├── tokenManager.ts   # Token storage and lifecycle
├── request.ts        # HTTP request helpers
└── interface.ts      # TypeScript type definitions
```

## License

MIT
