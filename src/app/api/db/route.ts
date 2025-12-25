import { NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongodb";

export async function GET() {
  try {
    const { db } = await connectToMongo();
    await db.command({ ping: 1 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

