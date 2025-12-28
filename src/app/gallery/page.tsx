import Link from "next/link";
import { getDb } from "@/lib/mongodb";

type SessionListItem = {
  _id: string;
  imageDataUrl: string;
  originalFileName: string | null;
  createdAt: string;
};

async function loadSessions(): Promise<SessionListItem[]> {
  const db = await getDb();
  const collection = db.collection("sessions");
  const docs = await collection
    .find({ isPublic: true })
    .sort({ createdAt: -1 })
    .limit(24)
    .toArray();
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    imageDataUrl: doc.imageDataUrl as string,
    originalFileName:
      (doc.originalFileName as string | null | undefined) ?? null,
    createdAt: (doc.createdAt as Date).toISOString(),
  }));
}

export default async function GalleryPage() {
  const items = await loadSessions();
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Public gallery
            </h1>
            <p className="text-xs text-zinc-400">
              Recently shared images. Click one to open it in the editor.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-sm shadow-black/30 transition hover:border-zinc-500 hover:bg-zinc-900/80"
          >
            <span>Back to editor</span>
          </Link>
        </header>
        {items.length === 0 ? (
          <p className="mt-6 text-xs text-zinc-500">
            Nothing here yet. Share an image from the editor to see it appear
            in the gallery.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <Link
                key={item._id}
                href={`/?session=${item._id}`}
                className="group block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-[0_14px_40px_rgba(0,0,0,0.7)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-zinc-900">
                  <img
                    src={item.imageDataUrl}
                    alt={item.originalFileName ?? "Shared image"}
                    className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-105"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

