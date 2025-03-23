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

		// Authentication and Authorization
		const authenticate = (req) => {
			const authHeader = req.headers.get('Authorization');
			if (!authHeader || authHeader !== 'Bearer YOUR_API_KEY') {
				return new Response('Unauthorized', { status: 401 });
			}
			return null; // Return null if authentication is successful
		};

		// Preflight request handling (OPTIONS method)
		if (method === 'OPTIONS') {
			return withCors(new Response(null, { status: 204 }));
		}

		// Bulk operation (POST /kv/bulk-set)
		if (url.pathname === '/kv/bulk-set' && method === 'POST') {
			const authError = authenticate(req);
			if (authError) return authError;

			try {
				const { items } = await req.json();
				if (!Array.isArray(items)) return withCors(new Response('Items must be an array', { status: 400 }));

				for (const { app, key, value, ttl } of items) {
					if (!app || !key || value === undefined) {
						return withCors(new Response('Missing app, key, or value', { status: 400 }));
					}

					const options = ttl ? { expirationTtl: ttl } : {};
					await env.store0.put(`${app}:${key}`, JSON.stringify(value), options);
				}

				return withCors(new Response(JSON.stringify({ success: true }), { status: 200 }));
			} catch (error) {
				return withCors(new Response(error.toString(), { status: 500 }));
			}
		}

		// Save data with TTL (POST /kv/set)
		if (url.pathname === '/kv/set' && method === 'POST') {
			const authError = authenticate(req);
			if (authError) return authError;

			try {
				const { app, key, value, ttl } = await req.json();
				if (!app || !key || value === undefined) {
					return withCors(new Response('Missing app, key, or value', { status: 400 }));
				}

				const options = ttl ? { expirationTtl: ttl } : {};
				await env.store0.put(`${app}:${key}`, JSON.stringify(value), options);

				return withCors(new Response(JSON.stringify({ success: true }), { status: 200 }));
			} catch (error) {
				return withCors(new Response(error.toString(), { status: 500 }));
			}
		}

		// Search functionality (GET /kv/list/:app)
		if (url.pathname.startsWith('/kv/list/') && method === 'GET') {
			const authError = authenticate(req);
			if (authError) return authError;

			const [, , , app] = url.pathname.split('/');
			if (!app) return withCors(new Response('Missing app', { status: 400 }));

			try {
				const list = await env.store0.list({ prefix: `${app}:` });
				const keys = list.keys.map((k) => k.name.replace(`${app}:`, ''));
				return withCors(new Response(JSON.stringify(keys), { status: 200 }));
			} catch (error) {
				return withCors(new Response('Error listing data', { status: 500 }));
			}
		}

		// Data update support (PUT /kv/update)
		if (url.pathname === '/kv/update' && method === 'PUT') {
			const authError = authenticate(req);
			if (authError) return authError;

			try {
				const { app, key, newValue } = await req.json();
				if (!app || !key || newValue === undefined) {
					return withCors(new Response('Missing app, key, or new value', { status: 400 }));
				}

				const oldValue = await env.store0.get(`${app}:${key}`);
				if (!oldValue) return withCors(new Response('Key not found', { status: 404 }));

				await env.store0.put(`${app}:${key}`, JSON.stringify(newValue));
				return withCors(new Response(JSON.stringify({ success: true }), { status: 200 }));
			} catch (error) {
				return withCors(new Response('Error updating data', { status: 500 }));
			}
		}

		// Data backup and restore (GET /kv/backup, POST /kv/restore)
		if (url.pathname === '/kv/backup' && method === 'GET') {
			const authError = authenticate(req);
			if (authError) return authError;

			try {
				const list = await env.store0.list({});
				const backupData = await Promise.all(
					list.keys.map(async (k) => {
						const value = await env.store0.get(k.name);
						return { key: k.name, value: JSON.parse(value) };
					})
				);
				return withCors(new Response(JSON.stringify(backupData), { status: 200 }));
			} catch (error) {
				return withCors(new Response('Error backing up data', { status: 500 }));
			}
		}

		if (url.pathname === '/kv/restore' && method === 'POST') {
			const authError = authenticate(req);
			if (authError) return authError;

			try {
				const { backupData } = await req.json();
				if (!Array.isArray(backupData)) return withCors(new Response('Backup data must be an array', { status: 400 }));

				for (const { key, value } of backupData) {
					if (!key || value === undefined) {
						return withCors(new Response('Invalid backup data format', { status: 400 }));
					}
					await env.store0.put(key, JSON.stringify(value));
				}

				return withCors(new Response(JSON.stringify({ success: true }), { status: 200 }));
			} catch (error) {
				return withCors(new Response('Error restoring data', { status: 500 }));
			}
		}

		// 404 Not Found
		return withCors(new Response('Not Found', { status: 404 }));
	},
};
