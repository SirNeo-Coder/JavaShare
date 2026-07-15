type JudgeResult = {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: { description?: string };
  time?: string;
};

export async function POST(request: Request) {
  const body = await request.json() as { code?: string; stdin?: string };
  if (typeof body.code !== "string" || !body.code.trim() || body.code.length > 100_000) {
    return Response.json({ error: "Java source is required" }, { status: 400 });
  }

  const judgeUrl = process.env.JUDGE0_URL;
  if (!judgeUrl) {
    return Response.json({
      mode: "demo",
      output: "Java execution demo\n\nMaya: 95\nLiam: 88\nSofia: 92\n\n✓ Configure JUDGE0_URL to compile this source securely.",
    });
  }

  try {
    const response = await fetch(`${judgeUrl.replace(/\/$/, "")}/submissions?base64_encoded=false&wait=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.JUDGE0_API_KEY ? { "X-Auth-Token": process.env.JUDGE0_API_KEY } : {}),
      },
      body: JSON.stringify({ source_code: body.code, stdin: body.stdin ?? "", language_id: 62, cpu_time_limit: 3, memory_limit: 128000 }),
    });
    if (!response.ok) throw new Error(`Execution service returned ${response.status}`);
    const result = await response.json() as JudgeResult;
    const output = result.compile_output ?? result.stderr ?? result.stdout ?? result.message ?? result.status?.description ?? "Program completed without output.";
    return Response.json({ mode: "judge0", output, status: result.status?.description, time: result.time });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Execution service unavailable" }, { status: 502 });
  }
}

