import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TokenResponse } from "./interface";
import { makeIOLPostRequest, makeIOLTokenRequest } from "./request";
import { z } from "zod";

const IOL_API_BASE: string = "https://api.invertironline.com/";

const registerTools = (server: McpServer) => {
    // Register iol tools
    server.registerTool(
        "get_token",
        {
            description: "Get token for an account",
            inputSchema: {
                username: z
                    .string()
                    .describe("Username or email for an account"),
                password: z
                    .string()
                    .describe("Password for an account")
            }
        },
        async ({ username, password }) => {
            const tokenUrl = `${IOL_API_BASE}/token`;
            const tokenData = await makeIOLTokenRequest<TokenResponse>(tokenUrl, { username, password, grant_type: 'password' });

            if (!tokenData) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "Failed to retrieve token data",
                        },
                    ],
                };
            }

            const accessToken: string = tokenData["access token"] || '';
            if (accessToken === '') {
                return {
                    content: [
                        {
                            type: "text",
                            text: `No active token for ${username}`,
                        },
                    ],
                };
            }

            const formatedToken = [
                `Access Token: ${tokenData["access token"] || "Unknown"}`,
                `Token Type: ${tokenData.token_type || "Unknown"}`,
                `Expires In: ${tokenData.expires_in || "Unknown"}`,
                `Refresh Token: ${tokenData.refresh_token || "Unknown"}`,
                `Issued: ${tokenData[".issued"] || "Unknown"}`,
                `Expires: ${tokenData[".expires"] || "Unknown"}`,
                "---",
            ];
            const tokenText = `Active token for ${username}:\n\n${formatedToken.join("\n")}`;

            return {
                content: [
                    {
                        type: "text",
                        text: tokenText,
                    },
                ],
            };
        },
    );

    server.registerTool(
        "refresh_token",
        {
            description: "Refresh token for an account",
            inputSchema: {
                refresh_token: z
                    .string()
                    .describe("Refresh token for an account")
            }
        },
        async ({ refresh_token }) => {
            const tokenUrl = `${IOL_API_BASE}/token`;
            const tokenData = await makeIOLTokenRequest<TokenResponse>(tokenUrl, { refresh_token, grant_type: 'refresh_token' });

            if (!tokenData) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "Failed to retrieve token data",
                        },
                    ],
                };
            }

            const accessToken: string = tokenData["access token"] || '';
            if (accessToken === '') {
                return {
                    content: [
                        {
                            type: "text",
                            text: `No active token for refresh token ${refresh_token}`,
                        },
                    ],
                };
            }

            const formatedToken = [
                `Access Token: ${tokenData["access token"] || "Unknown"}`,
                `Token Type: ${tokenData.token_type || "Unknown"}`,
                `Expires In: ${tokenData.expires_in || "Unknown"}`,
                `Refresh Token: ${tokenData.refresh_token || "Unknown"}`,
                `Issued: ${tokenData[".issued"] || "Unknown"}`,
                `Expires: ${tokenData[".expires"] || "Unknown"}`,
                "---",
            ];
            const tokenText = `Active token for ${refresh_token}:\n\n${formatedToken.join("\n")}`;

            return {
                content: [
                    {
                        type: "text",
                        text: tokenText,
                    },
                ],
            };
        },
    );
};

export { registerTools };