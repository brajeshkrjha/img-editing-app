import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToMongo } from "@/lib/mongodb";
import type { EditorSnapshot } from "@/app/editor/types";

type CreateSessionPayload = {
  imageDataUrl: string;
  originalFileName: string | null;
  snapshot: EditorSnapshot;
  isTemplate?: boolean;
  isPublic?: boolean;
};

type SessionDocument = {
  _id?: ObjectId;
  imageDataUrl: string;
  originalFileName: string | null;
  snapshot: EditorSnapshot;
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSessionPayload;
    if (!body || typeof body.imageDataUrl !== "string") {
      return NextResponse.json(
        { error: "imageDataUrl is required" },
        { status: 400 },
      );
    }
    if (!body.snapshot || typeof body.snapshot !== "object") {
      return NextResponse.json(
        { error: "snapshot is required" },
        { status: 400 },
      );
    }
    const { db } = await connectToMongo();
    const collection = db.collection<SessionDocument>("sessions");
    const now = new Date();
    const doc: SessionDocument = {
      imageDataUrl: body.imageDataUrl,
      originalFileName: body.originalFileName ?? null,
      snapshot: body.snapshot,
      isTemplate: Boolean(body.isTemplate),
      isPublic: body.isPublic !== false,
      createdAt: now,
      updatedAt: now,
    };
    const result = await collection.insertOne(doc);
    return NextResponse.json(
      { id: result.insertedId.toHexString() },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind");
    const limitParam = url.searchParams.get("limit");
    const limit =
      typeof limitParam === "string"
        ? Math.min(Math.max(Number.parseInt(limitParam, 10) || 0, 1), 50)
        : 20;
    const { db } = await connectToMongo();
    const collection = db.collection<SessionDocument>("sessions");
    const query: Partial<Pick<SessionDocument, "isTemplate" | "isPublic">> = {};
    if (kind === "template") {
      query.isTemplate = true;
    }
    if (kind === "public") {
      query.isPublic = true;
    }
    const cursor = collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    const items = await cursor
      .map((doc) => ({
        id: doc._id ? doc._id.toHexString() : "",
        imageDataUrl: doc.imageDataUrl,
        originalFileName: doc.originalFileName,
        isTemplate: doc.isTemplate,
        isPublic: doc.isPublic,
        createdAt: doc.createdAt.toISOString(),
      }))
      .toArray();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

