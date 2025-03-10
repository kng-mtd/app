export default {
	async fetch(req, env) {
		const url = new URL(req.url);
		const method = req.method;
		const authHeader = req.headers.get('Authorization');
		const validToken = env.AUTH_TOKEN;

		if (method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders(req) });
		}

		// auth check
		if (url.pathname === '/api/auth-check') {
			if (authHeader !== `Bearer ${validToken}`) {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders() });
			}
			return new Response(JSON.stringify({ success: true }), responseHeaders());
		}

		if (url.pathname.startsWith('/api')) {
			try {
				const params = url.pathname.split('/').slice(2); // /api/{table}/{id}
				const table = params[0];
				const id = params[1];

				// reject invalid table name
				const allowedTables = ['table0', 'table1', 'table2'];
				if (!allowedTables.includes(table)) {
					return new Response(JSON.stringify({ error: 'Invalid table name' }), responseHeaders(400));
				}

				if (method === 'GET') {
					const query = id ? `SELECT * FROM ${table} WHERE id = ?;` : `SELECT * FROM ${table} ORDER BY id;`;
					const { results } = id ? await env.DB.prepare(query).bind(id).all() : await env.DB.prepare(query).all();
					return new Response(JSON.stringify(results), responseHeaders());
				}

				// reject no-JSON
				if (!['GET', 'DELETE'].includes(method) && req.headers.get('Content-Type') !== 'application/json') {
					return new Response(JSON.stringify({ error: 'Invalid Content-Type' }), responseHeaders(400));
				}

				const body = method !== 'DELETE' ? await req.json() : null;

				if (method === 'POST') {
					if (!body.id || !body.name || !body.age) {
						return new Response(JSON.stringify({ error: 'Missing required fields (id, name, age)' }), responseHeaders(400));
					}

					const query = `INSERT INTO ${table} (id, name, age) VALUES (?, ?, ?);`;
					const { success } = await env.DB.prepare(query).bind(body.id, body.name, body.age).run();
					return new Response(JSON.stringify({ success }), responseHeaders(201));
				}

				if (method === 'PUT' && id) {
					const updates = Object.keys(body)
						.map((key) => `${key} = ?`)
						.join(', ');
					const values = [...Object.values(body), id];
					const query = `UPDATE ${table} SET ${updates} WHERE id = ?;`;
					const { success } = await env.DB.prepare(query)
						.bind(...values)
						.run();
					return new Response(JSON.stringify({ success }), responseHeaders());
				}

				if (method === 'DELETE' && id) {
					const query = `DELETE FROM ${table} WHERE id = ?;`;
					const { success } = await env.DB.prepare(query).bind(id).run();
					return new Response(JSON.stringify({ success }), responseHeaders());
				}
			} catch (error) {
				return new Response(JSON.stringify({ error: error.message }), responseHeaders(500));
			}
		}

		return new Response('Not Found', { status: 404 });
	},
};

function responseHeaders(status = 200) {
	return { status, headers: corsHeaders() };
}

function corsHeaders(req = null) {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
	if (req) {
		const requestedHeaders = req.headers.get('Access-Control-Request-Headers');
		if (requestedHeaders) {
			headers['Access-Control-Allow-Headers'] = requestedHeaders;
		}
	}
	return headers;
}
