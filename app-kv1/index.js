export default {
	async fetch(req, env) {
		const url = new URL(req.url);
		const { method } = req;

		// CORS Middleware
		const withCors = (res) => {
			res.headers.set('Access-Control-Allow-Origin', '*');
			res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
			res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
			return res;
		};

		// Preflight req Handling (OPTIONS method)
		if (method === 'OPTIONS') {
			return withCors(new Response(null, { status: 204 }));
		}

		// Handle POST /kv/set
		if (url.pathname === '/kv/set' && method === 'POST') {
			try {
				const { app, key, value } = await req.json();
				if (!app || !key || !value) return withCors(new Response('Missing app, key, or value', { status: 400 }));

				await env.store0.put(`${app}:${key}`, JSON.stringify(value)); // Namespaced Key
				return withCors(new Response(JSON.stringify({ success: true }), { status: 200 }));
			} catch (error) {
				return withCors(new Response(error.toString(), { status: 500 }));
			}
		}

		// Handle GET /kv/get/:app/:key
		if (url.pathname.startsWith('/kv/get/') && method === 'GET') {
			const [, , , app, key] = url.pathname.split('/');
			if (!app || !key) return withCors(new Response('Missing app or key', { status: 400 }));

			const value = await env.store0.get(`${app}:${key}`);
			return value ? withCors(new Response(value)) : withCors(new Response('Not Found', { status: 404 }));
		}

		// Handle DELETE /kv/delete/:app/:key
		if (url.pathname.startsWith('/kv/delete/') && method === 'DELETE') {
			const [, , , app, key] = url.pathname.split('/');
			if (!app || !key) return withCors(new Response('Missing app or key', { status: 400 }));

			await env.store0.delete(`${app}:${key}`);
			return withCors(new Response(JSON.stringify({ success: true }), { status: 200 }));
		}

		// Handle GET /kv/list/:app
		if (url.pathname.startsWith('/kv/list/') && method === 'GET') {
			const [, , , app] = url.pathname.split('/');
			if (!app) return withCors(new Response('Missing app', { status: 400 }));

			const list = await env.store0.list({ prefix: `${app}:` });
			const keys = list.keys.map((k) => k.name.replace(`${app}:`, ''));
			return withCors(new Response(JSON.stringify(keys), { status: 200 }));
		}

		// 404 Not Found
		return withCors(new Response('Not Found', { status: 404 }));
	},
};
