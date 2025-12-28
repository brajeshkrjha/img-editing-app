
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { notFound } from "next/navigation";

type SessionData = {
  _id: string;
  imageDataUrl: string;
  originalFileName: string | null;
  createdAt: string;
  snapshot: {
    title: string;
  }
};

async function loadSession(id: string): Promise<SessionData | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const db = await getDb();
  const collection = db.collection("sessions");
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) {
    return null;
  }
  return {
    _id: doc._id.toString(),
    imageDataUrl: doc.imageDataUrl as string,
    originalFileName: (doc.originalFileName as string | null | undefined) ?? null,
    createdAt: (doc.createdAt as Date).toISOString(),
    snapshot: doc.snapshot as { title: string },
  };
}

export default async function SharedSessionPage({ params }: { params: { id: string } }) {
  const session = await loadSession(params.id);

  if (!session) {
    notFound();
  }

  const creationDate = new Date(session.createdAt);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(creationDate);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-[0_18px_45px_rgba(0,0,0,0.7)]">
          <div className="p-6 sm:p-8">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-zinc-800">
              <img
                src={session.imageDataUrl}
                alt={session.originalFileName ?? "Shared image"}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="border-t border-zinc-800 px-6 py-4 sm:px-8 sm:py-5">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-lg font-semibold text-zinc-50">
                  {session.snapshot.title || "Untitled"}
                </h1>
                <p className="text-xs text-zinc-400">
                  Created on {formattedDate}
                </p>
              </div>
              <Link
                href={`/?session=${session._id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-900 shadow-sm shadow-black/30 transition hover:bg-zinc-200"
              >
                <span>Open in Editor</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-xs text-zinc-500 transition hover:text-zinc-300"
          >
            Create your own image
          </Link>
        </div>
      </div>
    </main>
  );
}
