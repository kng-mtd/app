export default {
	async fetch(req, env) {
		const url = new URL(req.url);
		const fileName = url.pathname.split('/')[1];

		// CORS headers for cross-origin reqs
		const headers = {
			'Access-Control-Allow-Origin': '*', // Allow all origins (can be restricted to a specific domain)
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Allowed methods
			'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allowed headers
		};

		// Handling OPTIONS req (CORS preflight)
		if (req.method === 'OPTIONS') {
			return new Response(null, { headers });
		}

		// GET req (fetch file from R2)
		if (req.method === 'GET' && fileName !== 'list') {
			try {
				if (!fileName) {
					return new Response('File name required', { status: 400, headers });
				}
				const file = await env.bckt0.get(fileName);
				if (!file) {
					return new Response('File not found', { status: 404, headers });
				}
				return new Response(file.body, {
					headers: {
						'Content-Type': 'application/octet-stream',
						'Content-Disposition': `attachment; filename="${fileName}"`,
						...headers,
					},
				});
			} catch (error) {
				return new Response('Error fetching file', { status: 500, headers });
			}
		}

		// POST req (upload file to R2)
		if (req.method === 'POST') {
			try {
				const formData = await req.formData();
				const file = formData.get('file');
				if (!file) {
					return new Response('No file uploaded', { status: 400, headers });
				}

				const fileBuffer = await file.arrayBuffer();
				await env.bckt0.put(file.name, fileBuffer); // Save file to R2 bucket

				return new Response('File uploaded successfully', { status: 200, headers });
			} catch (error) {
				return new Response('Error uploading file', { status: 500, headers });
			}
		}

		// File list display (GET req to show list of files in the bucket)
		if (req.method === 'GET' && fileName === 'list') {
			try {
				const objects = await env.bckt0.list();
				const fileNames = objects.objects.map((object) => object.key);
				return new Response(JSON.stringify(fileNames), {
					headers: {
						'Content-Type': 'application/json',
						...headers,
					},
				});
			} catch (error) {
				return new Response('Error retrieving file list', { status: 500, headers });
			}
		}

		return new Response('Invalid req method', { status: 405, headers });
	},
};
