import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// CORS middleware
app.use(
	'*',
	cors({
		origin: '*',
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type'],
	})
);

// POST /kv/set
app.post('/kv/set', async (c) => {
	const { app: appName, key, value } = await c.req.json();
	if (!appName || !key || !value) {
		return c.text('Missing app, key, or value', 400);
	}
	const env = c.env;
	await env.store0.put(`${appName}:${key}`, JSON.stringify(value));
	return c.json({ success: true });
});

// GET /kv/get/:app/:key
app.get('/kv/get/:app/:key', async (c) => {
	const { app: appName, key } = c.req.param();
	const env = c.env;
	const value = await env.store0.get(`${appName}:${key}`);
	if (!value) {
		return c.text('Not Found', 404);
	}
	return c.text(value);
});

// DELETE /kv/delete/:app/:key
app.delete('/kv/delete/:app/:key', async (c) => {
	const { app: appName, key } = c.req.param();
	const env = c.env;
	await env.store0.delete(`${appName}:${key}`);
	return c.json({ success: true });
});

// GET /kv/list/:app
app.get('/kv/list/:app', async (c) => {
	const { app: appName } = c.req.param();
	const env = c.env;
	const list = await env.store0.list({ prefix: `${appName}:` });
	const keys = list.keys.map((k) => k.name.replace(`${appName}:`, ''));
	return c.json(keys);
});

// GET /kv/list-all
app.get('/kv/list-all', async (c) => {
	const env = c.env;
	// Fetch all keys from Cloudflare KV storage
	const list = await env.store0.list();

	// Extract key names from the result and classify them by app name
	const keys = list.keys.map((k) => {
		const [appName, key] = k.name.split(':'); // Split the key into app name and actual key
		return { appName, key };
	});

	// Group the keys by app name
	const groupedByApp = keys.reduce((acc, { appName, key }) => {
		if (!acc[appName]) acc[appName] = []; // Initialize an empty array if app name does not exist
		acc[appName].push(key); // Add the key under the corresponding app name
		return acc;
	}, {});

	// Return the grouped keys in JSON format
	return c.json(groupedByApp);
});

// POST /kv/set-multiple
app.post('/kv/set-multiple', async (c) => {
	const { app: appName, items } = await c.req.json();
	if (!appName || !Array.isArray(items)) {
		return c.text('Missing app or items (must be array)', 400);
	}

	const env = c.env;
	const results = [];

	for (const item of items) {
		const { key, value } = item;
		if (!key || typeof value === 'undefined') {
			results.push({ key, success: false, error: 'Missing key or value' });
			continue;
		}

		try {
			await env.store0.put(`${appName}:${key}`, JSON.stringify(value));
			results.push({ key, success: true });
		} catch (err) {
			results.push({ key, success: false, error: err.message });
		}
	}

	return c.json({ success: true, results });
});

export default app;
