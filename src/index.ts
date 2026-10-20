const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function isValidFilename(filename: string): boolean {
	return (
		filename.length > 0 &&
		filename.length <= 255 &&
		/^[a-zA-Z0-9._-]+$/.test(filename) &&
		filename !== "." &&
		filename !== ".."
	);
}

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

		// Create a project in D1
		if (url.pathname === "/projects" && request.method === "POST") {
			let body: {
				name: string;
				description?: string;
				user_id: number;
			};

			try {
				body = await request.json();
			} catch {
				return Response.json(
					{ error: "Invalid JSON body" },
					{ status: 400 },
				);
			}

			if (
				typeof body.name !== "string" ||
				body.name.trim().length === 0 ||
				!Number.isInteger(body.user_id)
			) {
				return Response.json(
					{ error: "A project name and integer user_id are required" },
					{ status: 400 },
				);
			}

			const result = await env.DB
				.prepare(
					"INSERT INTO projects (name, description, user_id) VALUES (?, ?, ?)",
				)
				.bind(
					body.name.trim(),
					body.description ?? null,
					body.user_id,
				)
				.run();

			return Response.json(
				{
					message: "Project created successfully",
					project: {
						id: result.meta.last_row_id,
						name: body.name.trim(),
						description: body.description ?? null,
						user_id: body.user_id,
					},
				},
				{ status: 201 },
			);
		}

		// Upload a file to private R2 storage
if (url.pathname === "/files" && request.method === "POST") {
	const filename = url.searchParams.get("filename");

	if (!filename || !isValidFilename(filename)) {
		return Response.json(
			{
				error:
					"Provide a valid filename using letters, numbers, dots, underscores, or hyphens",
			},
			{ status: 400 },
		);
	}

	if (!request.body) {
		return Response.json(
			{ error: "A file body is required" },
			{ status: 400 },
		);
	}

	const contentLengthHeader = request.headers.get("content-length");

	if (contentLengthHeader !== null) {
		const contentLength = Number(contentLengthHeader);

		if (
			!Number.isSafeInteger(contentLength) ||
			contentLength < 0
		) {
			return Response.json(
				{ error: "Invalid Content-Length header" },
				{ status: 400 },
			);
		}

		if (contentLength > MAX_FILE_SIZE) {
			return Response.json(
				{ error: "File size must not exceed 5 MB" },
				{ status: 413 },
			);
		}
	}

	// Enforce the size limit while reading the body.
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let totalSize = 0;

	try {
		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			totalSize += value.byteLength;

			if (totalSize > MAX_FILE_SIZE) {
				await reader.cancel();

				return Response.json(
					{ error: "File size must not exceed 5 MB" },
					{ status: 413 },
				);
			}

			chunks.push(value);
		}
	} catch {
		return Response.json(
			{ error: "Unable to read uploaded file" },
			{ status: 400 },
		);
	}

	const fileBytes = new Uint8Array(totalSize);
	let offset = 0;

	for (const chunk of chunks) {
		fileBytes.set(chunk, offset);
		offset += chunk.byteLength;
	}

	const contentType =
		request.headers.get("content-type") ??
		"application/octet-stream";

	const object = await env.cloudflare_saas_files.put(
		filename,
		fileBytes,
		{
			httpMetadata: {
				contentType,
			},
		},
	);

	return Response.json(
		{
			message: "File uploaded successfully",
			file: {
				filename,
				size: object.size,
			},
		},
		{ status: 201 },
	);
}
		// Download a file from private R2 storage
		if (
			url.pathname.startsWith("/files/") &&
			request.method === "GET"
		) {
			const filename = decodeURIComponent(
				url.pathname.slice("/files/".length),
			);

			if (!isValidFilename(filename)) {
				return Response.json(
					{ error: "Invalid filename" },
					{ status: 400 },
				);
			}

			const object = await env.cloudflare_saas_files.get(filename);

			if (!object) {
				return Response.json(
					{ error: "File not found" },
					{ status: 404 },
				);
			}

			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set("etag", object.httpEtag);
			headers.set("content-disposition", "attachment");

			return new Response(object.body, { headers });
		}

		// Route not found
		return Response.json(
			{ error: "Route not found" },
			{ status: 404 },
		);
	},
} satisfies ExportedHandler<Env>;
