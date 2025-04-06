export default {
	async fetch(req, env) {
		// Handle CORS preflight (OPTIONS req)
		if (req.method === 'OPTIONS') {
			const headers = {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Max-Age': '86400',
			};
			return new Response(null, { status: 204, headers });
		}

		if (req.method === 'POST') {
			try {
				// Get the Authorization header and extract token
				const authHeader = req.headers.get('Authorization');
				const token = authHeader?.split(' ')[1]; // Expected format: "Bearer <token>"

				// Compare with env.AUTH_TOKEN
				if (!token || token !== env.AUTH_TOKEN) {
					return new Response('Unauthorized', { status: 401 });
				}

				const { text } = await req.json();
				if (!text) {
					return new Response('Text field is required', { status: 400 });
				}

				const messages = [
					{ role: 'system', content: 'You are a friendly assistant' },
					{ role: 'user', content: text },
				];

				const response = await env.AI.run('@cf/meta/llama-3.2-1b-instruct', { messages });

				const headers = {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				};

				return new Response(JSON.stringify(response), { headers });
			} catch (error) {
				return new Response('Error processing req: ' + error.message, { status: 500 });
			}
		} else {
			return new Response('Method Not Allowed', { status: 405 });
		}
	},
};
