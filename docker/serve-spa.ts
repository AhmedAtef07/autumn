// Minimal static file server with SPA fallback, using Bun's built-in server.
// No external deps (avoids `bunx serve` fetching from npm at container runtime).
// Usage: bun docker/serve-spa.ts <distDir> <port>
import { join, normalize } from "node:path";
import { existsSync, statSync } from "node:fs";

const distDir = process.argv[2] || "dist";
const port = Number(process.argv[3] || 3000);
const indexPath = join(distDir, "index.html");

function filePath(pathname: string): string | null {
	// Strip query, decode, prevent path traversal.
	let p = decodeURIComponent(pathname.split("?")[0]);
	if (p === "/") p = "/index.html";
	const full = normalize(join(distDir, p));
	if (!full.startsWith(normalize(distDir))) return null;
	if (existsSync(full) && statSync(full).isFile()) return full;
	return null;
}

Bun.serve({
	port,
	hostname: "0.0.0.0",
	async fetch(req) {
		const url = new URL(req.url);
		const f = filePath(url.pathname);
		if (f) return new Response(Bun.file(f));
		// SPA fallback -> index.html
		if (existsSync(indexPath)) return new Response(Bun.file(indexPath));
		return new Response("dashboard not built", { status: 503 });
	},
});

console.log(`[serve-spa] serving ${distDir} on :${port}`);
