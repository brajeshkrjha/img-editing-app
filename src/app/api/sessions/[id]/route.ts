import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToMongo } from "@/lib/mongodb";
import type { EditorSnapshot } from "@/app/editor/types";

type SessionDocument = {
  _id: ObjectId;
  imageDataUrl: string;
  originalFileName: string | null;
  snapshot: EditorSnapshot;
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    const { id } = context.params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const { db } = await connectToMongo();
    const collection = db.collection<SessionDocument>("sessions");
    const doc = await collection.findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: doc._id.toHexString(),
      imageDataUrl: doc.imageDataUrl,
      originalFileName: doc.originalFileName,
      snapshot: doc.snapshot,
      isTemplate: doc.isTemplate,
      isPublic: doc.isPublic,
      createdAt: doc.createdAt.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

