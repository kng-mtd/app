function corsHeaders() {
	return {
		'Access-Control-Allow-Origin': '*', // Allow all origins
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allowed HTTP methods
		'Access-Control-Allow-Headers': 'Content-Type', // Allowed headers
	};
}

export default {
	async fetch(req, env) {
		const url = new URL(req.url);

		// Handle CORS preflight requests (OPTIONS)
		if (req.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders() });
		}

		if (url.pathname === '/todos') {
			if (req.method === 'GET') return getTodos(env);
			if (req.method === 'POST') return addTodo(req, env);
		}

		if (url.pathname.startsWith('/todos/')) {
			const id = url.pathname.split('/').pop();
			if (req.method === 'DELETE') return deleteTodo(id, env);
			if (req.method === 'PUT') return toggleTodo(id, req, env);
		}

		return new Response('Not Found', { status: 404, headers: corsHeaders() });
	},
};

// Retrieve all tasks (GET /todos)
async function getTodos(env) {
	const keys = await env.todo.list();
	const todos = await Promise.all(keys.keys.map((k) => env.todo.get(k.name, 'json')));
	return new Response(JSON.stringify(todos), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
}

// Add a new task (POST /todos)
async function addTodo(req, env) {
	const { title } = await req.json();
	if (!title) return new Response('Title is required', { status: 400, headers: corsHeaders() });

	const id = crypto.randomUUID();
	const todo = { id, title, done: false, createdAt: new Date().toISOString() };
	await env.todo.put(id, JSON.stringify(todo));

	return new Response(JSON.stringify(todo), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
}

// Delete a task (DELETE /todos/{id})
async function deleteTodo(id, env) {
	const existing = await env.todo.get(id);
	if (!existing) return new Response('Not Found', { status: 404, headers: corsHeaders() });

	await env.todo.delete(id);
	return new Response('Task deleted', { status: 200, headers: corsHeaders() });
}

// Toggle task completion status (PUT /todos/{id})
async function toggleTodo(id, req, env) {
	const existing = await env.todo.get(id, 'json');
	if (!existing) return new Response('Not Found', { status: 404, headers: corsHeaders() });

	const updatedTodo = { ...existing, done: !existing.done };
	await env.todo.put(id, JSON.stringify(updatedTodo));

	return new Response(JSON.stringify(updatedTodo), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
}
