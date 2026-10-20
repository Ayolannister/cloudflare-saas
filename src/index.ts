export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		// Home route
		if (url.pathname === "/") {
			return Response.json({
				message: "Cloudflare SaaS API is running",
				status: "ok",
			});
		}

		// Health check
		if (url.pathname === "/health") {
			return Response.json({
				status: "healthy",
			});
		}

		// Get projects from D1
		if (url.pathname === "/projects" && request.method === "GET") {
			const { results } = await env.DB
				.prepare("SELECT * FROM projects ORDER BY created_at DESC")
				.all();

			return Response.json({
				projects: results,
			});
		}


               // Create a project
               if (url.pathname === "/projects" && request.method === "POST") {
	              const body = await request.json<{
		name: string;
		description?: string;
		user_id: number;
	}>();

	const result = await env.DB
		.prepare(
			"INSERT INTO projects (name, description, user_id) VALUES (?, ?, ?)",
		)
		.bind(
			body.name,
			body.description ?? null,
			body.user_id,
		)
		.run();

	return Response.json(
		{
			message: "Project created successfully",
			project: {
				id: result.meta.last_row_id,
				name: body.name,
				description: body.description ?? null,
				user_id: body.user_id,
			},
		},
		{ status: 201 },
	);
}



		// Route not found
		return Response.json(
			{
				error: "Route not found",
			},
			{ status: 404 },
		);
	},
} satisfies ExportedHandler<Env>;
