import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS for all routes
app.use('*', cors());

// Handle GET request to fetch a JSON value by key
app.get('/item/:key', async (c) => {
	const key = c.req.param('key');
	const value = await c.env.store1.get(key);
	if (value === null) {
		return c.json({ message: 'Not Found' }, 404);
	}
	try {
		const jsonValue = JSON.parse(value);
		return c.json(jsonValue);
	} catch (e) {
		return c.json({ message: 'Invalid JSON stored' }, 500);
	}
});

// Handle POST request to create a new JSON item
app.post('/item/:key', async (c) => {
	const key = c.req.param('key');
	const body = await c.req.json();
	await c.env.store1.put(key, JSON.stringify(body));
	return c.json({ message: 'Created' }, 201);
});

// Handle PUT request to update an existing JSON item
app.put('/item/:key', async (c) => {
	const key = c.req.param('key');
	const body = await c.req.json();
	await c.env.store1.put(key, JSON.stringify(body));
	return c.json({ message: 'Updated' }, 200);
});

// Handle DELETE request to delete an item
app.delete('/item/:key', async (c) => {
	const key = c.req.param('key');
	await c.env.store1.delete(key);
	return c.json({ message: 'Deleted' }, 200);
});

// Handle GET request to fetch all JSON key-value pairs(max 1000 items)
app.get('/items', async (c) => {
	const list = await c.env.store1.list();
	const result = {};

	for (const key of list.keys) {
		const value = await c.env.store1.get(key.name);
		if (value !== null) {
			try {
				result[key.name] = JSON.parse(value);
			} catch (e) {
				result[key.name] = { message: 'Invalid JSON stored' };
			}
		}
	}

	return c.json(result);
});

export default app;
