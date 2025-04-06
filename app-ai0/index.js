export default {
	async fetch(req, env) {
		// Handle CORS preflight (OPTIONS req)
		if (req.method === 'OPTIONS') {
			const headers = {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Allow OPTIONS, GET, POST methods
				'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
				'Access-Control-Max-Age': '86400', // Cache preflight req for 24 hours
			};
			return new Response(null, { status: 204, headers }); // Return 204 No Content for OPTIONS req
		}

		// If the method is POST, process the req
		if (req.method === 'POST') {
			try {
				// Parse the incoming JSON data from the req
				const { text } = await req.json();

				// Make sure the text field is present
				if (!text) {
					return new Response('Text field is required', { status: 400 });
				}

				// You can use the provided text directly here
				const messages = [
					{ role: 'system', content: 'You are a friendly assistant' },
					{ role: 'user', content: text },
				];

				// Send the text to AI model
				const response = await env.AI.run('@cf/meta/llama-3.2-1b-instruct', { messages });

				// Add CORS headers to allow any origin to make reqs
				const headers = {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*', // Allow all origins (for testing)
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Allow POST and GET methods
					'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
				};

				// Return the response from the AI model as JSON
				return new Response(JSON.stringify(response), { headers });
			} catch (error) {
				// Handle any errors that occur during the req
				return new Response('Error processing req: ' + error.message, { status: 500 });
			}
		} else {
			// Return Method Not Allowed if the method isn't POST
			return new Response('Method Not Allowed', { status: 405 });
		}
	},
};
