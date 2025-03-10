export default {
	async fetch(request, env) {
	  const url = new URL(request.url);
	  const method = request.method;
	  
	  // CORS プリフライト対応
	  if (method === "OPTIONS") {
		return new Response(null, {
		  status: 204,
		  headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type"
		  }
		});
	  }
	  
	  if (url.pathname.startsWith("/api/data")) {
		try {
		  if (method === "GET") {
			const { results } = await env.DB.prepare("SELECT * FROM table0;").all();
			return new Response(JSON.stringify(results), responseHeaders());
		  }
		  
		  if (method === "POST") {
			const body = await request.json();
			const { success } = await env.DB.prepare("INSERT INTO table0 (name, age) VALUES (?, ?);")
			  .bind(body.name, body.age)
			  .run();
			return new Response(JSON.stringify({ success }), responseHeaders(201));
		  }
		  
		  if (method === "PUT") {
			const id = url.pathname.split("/").pop();
			const body = await request.json();
			const { success } = await env.DB.prepare("UPDATE table0 SET name = ?, age = ? WHERE id = ?;")
			  .bind(body.name, body.age, id)
			  .run();
			return new Response(JSON.stringify({ success }), responseHeaders());
		  }
		  
		  if (method === "DELETE") {
			const id = url.pathname.split("/").pop();
			const { success } = await env.DB.prepare("DELETE FROM table0 WHERE id = ?;")
			  .bind(id)
			  .run();
			return new Response(JSON.stringify({ success }), responseHeaders());
		  }
		} catch (error) {
		  return new Response(JSON.stringify({ error: error.message }), responseHeaders(500));
		}
	  }
	  
	  return new Response("Not Found", { status: 404 });
	}
  };
  
  function responseHeaders(status = 200) {
	return {
	  status,
	  headers: {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*"
	  }
	};
  }
  