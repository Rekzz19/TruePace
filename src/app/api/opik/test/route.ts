import { NextResponse } from "next/server";
import { Opik } from "opik";

export async function GET() {
  const opik = new Opik({ apiKey: process.env.OPIK_API_KEY });

  const trace = opik.trace({ name: "truepace_test_trace" });

  try {
    const span = trace.span({
      name: "ping",
      input: { now: new Date().toISOString() },
    });

    span.end();
    trace.end();

    await opik.flush();

    return NextResponse.json({ ok: true, message: "Opik trace flushed" });
  } catch (err) {
    try {
      trace.update({ tags: ["error"], metadata: { error: String(err) } });
      trace.end();
      await opik.flush();
    } catch (e) {
      // ignore secondary errors
    }

    console.error("Opik test error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
