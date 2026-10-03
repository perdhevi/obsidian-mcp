import http from "node:http";

const TOOLS = [{
    name: "ping",
    description: "Health check. Returns pong.",
    inputSchema: { type: "object", properties: {} },
}, {
    name: "echo",
    description: "Echoes the input.",
    inputSchema: { type: "object", properties: {
        text: { type: "string", description: "The text to echo." },
        } },
}];

function handle({ id, method, params }) {
    switch (method) {
        case "initialize":
            return { result: {
                    protocolVersion: params.protocolVersion,
                    capabilities: { tools: {} },
                    serverInfo: { name: "vault-raw", version: "0.0.1" },
                }};
        case "tools/list":
            return { result: { tools: TOOLS } };
        case "tools/call":
            const {name, arguments: args = {} } = params;
            console.log(params);
            switch (name ) {
                case "ping" :
                    return {result: {content: [{type: "text", text: "pong"}]}};
                case "echo" :
                    if(typeof args.text != "string")
                        return { result: { isError: true, content: [{ type: "text", text: `Missing parameter ${params.name}` }] } };
                    return {result: {content: [{type: "text", text: "result + " + args.text}]}};
            }
            return { result: { isError: true, content: [{ type: "text", text: `Unknown tool ${params.name}` }] } };
        default:
            return { error: { code: -32601, message: "Method not found" } };
    }
}

http.createServer((req, res) => {
    if (req.url !== "/mcp" || req.method !== "POST") return res.writeHead(405).end();
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
        let msg;
        try { msg = JSON.parse(body); }
        catch { return res.writeHead(400).end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } })); }
        if (msg.id === undefined) return res.writeHead(202).end(); // notification
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", id: msg.id, ...handle(msg) }));
    });
}).listen(3000, "127.0.0.1", () => console.error("raw MCP on :3000"));