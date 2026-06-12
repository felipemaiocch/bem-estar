import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/admin-permissions";

type BookLookupResult = {
  title?: string;
  mainAuthor?: string;
  author?: string;
  publisher?: string;
  publicationPlace?: string;
  year?: number;
  isbn?: string;
  category?: string;
  subject?: string;
  description?: string;
  physicalDescription?: string;
  coverUrl?: string;
  originalLanguage?: string;
};

function normalizeIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function parseYear(value?: string | number | null) {
  const match = String(value ?? "").match(/\d{4}/);
  return match ? Number(match[0]) : undefined;
}

function bestIsbn(identifiers: Array<{ type?: string; identifier?: string }> | undefined, fallback: string) {
  return identifiers?.find((item) => item.type === "ISBN_13")?.identifier
    ?? identifiers?.find((item) => item.type === "ISBN_10")?.identifier
    ?? fallback;
}

async function lookupGoogleBooks(isbn: string): Promise<BookLookupResult | null> {
  const params = new URLSearchParams({
    q: `isbn:${isbn}`,
    maxResults: "1",
  });

  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }

  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) return null;

  const data = await response.json() as {
    totalItems?: number;
    items?: Array<{
      volumeInfo?: {
        title?: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string;
        description?: string;
        pageCount?: number;
        categories?: string[];
        language?: string;
        industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
        imageLinks?: { thumbnail?: string; smallThumbnail?: string };
      };
    }>;
  };

  const volume = data.items?.[0]?.volumeInfo;
  if (!data.totalItems || !volume?.title) return null;

  return {
    title: volume.title,
    mainAuthor: volume.authors?.[0],
    author: volume.authors?.[0],
    publisher: volume.publisher,
    year: parseYear(volume.publishedDate),
    isbn: bestIsbn(volume.industryIdentifiers, isbn),
    category: volume.categories?.[0],
    subject: volume.categories?.join("; "),
    description: volume.description?.replace(/<[^>]+>/g, ""),
    physicalDescription: volume.pageCount ? `${volume.pageCount} p.` : undefined,
    coverUrl: volume.imageLinks?.thumbnail?.replace("http://", "https://") ?? volume.imageLinks?.smallThumbnail?.replace("http://", "https://"),
    originalLanguage: volume.language,
  };
}

async function lookupOpenLibrary(isbn: string): Promise<BookLookupResult | null> {
  const response = await fetch(`https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&limit=1`, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) return null;

  const data = await response.json() as {
    docs?: Array<{
      title?: string;
      author_name?: string[];
      publisher?: string[];
      publish_place?: string[];
      first_publish_year?: number;
      isbn?: string[];
      language?: string[];
      subject?: string[];
    }>;
  };

  const doc = data.docs?.[0];
  if (!doc?.title) return null;

  return {
    title: doc.title,
    mainAuthor: doc.author_name?.[0],
    author: doc.author_name?.[0],
    publisher: doc.publisher?.[0],
    publicationPlace: doc.publish_place?.[0],
    year: parseYear(doc.first_publish_year),
    isbn: doc.isbn?.[0] ?? isbn,
    category: doc.subject?.[0],
    subject: doc.subject?.slice(0, 8).join("; "),
    coverUrl: `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`,
    originalLanguage: doc.language?.[0],
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, "LIBRARY");

  if (auth.response) {
    return auth.response;
  }

  const isbn = normalizeIsbn(request.nextUrl.searchParams.get("code") ?? "");

  if (isbn.length < 10) {
    return NextResponse.json({ ok: false, error: "Informe um ISBN válido." }, { status: 400 });
  }

  const book = await lookupGoogleBooks(isbn) ?? await lookupOpenLibrary(isbn);

  if (!book) {
    return NextResponse.json({ ok: false, error: "ISBN não encontrado nas bases públicas." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, book });
}
