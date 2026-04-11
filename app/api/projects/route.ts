import { NextResponse } from "next/server";
import { assertAdmin } from "../../../lib/adminAuth";
import { createSupabaseAdminClient } from "../../../lib/supabaseAdmin";
import { createSupabasePublicClient } from "../../../lib/supabasePublic";

type ProjectPayload = {
  title?: string;
  desc?: string;
  description?: string;
  tags?: string[] | string;
  imageUrl?: string;
  image_url?: string;
  githubUrl?: string | null;
  github_url?: string | null;
  demoUrl?: string | null;
  demo_url?: string | null;
  featured?: boolean;
  sortOrder?: number;
  sort_order?: number;
  status?: "draft" | "published";
};

function normalizeTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter((t) => typeof t === "string");
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function toInsert(payload: ProjectPayload) {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const desc =
    typeof payload.desc === "string"
      ? payload.desc.trim()
      : typeof payload.description === "string"
        ? payload.description.trim()
        : "";
  const imageUrl =
    typeof payload.imageUrl === "string"
      ? payload.imageUrl.trim()
      : typeof payload.image_url === "string"
        ? payload.image_url.trim()
        : "";

  if (!title) return { error: "Missing title" } as const;
  if (!desc) return { error: "Missing desc" } as const;
  if (!imageUrl) return { error: "Missing imageUrl" } as const;

  const githubUrl =
    typeof payload.githubUrl === "string"
      ? payload.githubUrl.trim()
      : typeof payload.github_url === "string"
        ? payload.github_url.trim()
        : payload.githubUrl === null || payload.github_url === null
          ? null
          : undefined;

  const demoUrl =
    typeof payload.demoUrl === "string"
      ? payload.demoUrl.trim()
      : typeof payload.demo_url === "string"
        ? payload.demo_url.trim()
        : payload.demoUrl === null || payload.demo_url === null
          ? null
          : undefined;

  const featured =
    typeof payload.featured === "boolean" ? payload.featured : true;
  const sortOrder =
    typeof payload.sortOrder === "number"
      ? payload.sortOrder
      : typeof payload.sort_order === "number"
        ? payload.sort_order
        : 0;

  const status = payload.status ?? "published";

  return {
    value: {
      title,
      description: desc,
      tags: normalizeTags(payload.tags),
      image_url: imageUrl,
      github_url: githubUrl ?? null,
      demo_url: demoUrl ?? null,
      featured,
      sort_order: sortOrder,
      status,
    },
  } as const;
}

export async function GET(req: Request) {
  const isAdmin = assertAdmin(req);
  const supabase = isAdmin
    ? createSupabaseAdminClient()
    : createSupabasePublicClient();

  const query = supabase
    .from("projects")
    .select(
      "id,title,description,tags,image_url,github_url,demo_url,featured,sort_order,status,created_at,updated_at",
    )
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query.eq("featured", true).eq("status", "published");
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(req: Request) {
  const isAdmin = assertAdmin(req);
  if (!isAdmin) {
    return NextResponse.json(
      {
        error:
          "Unauthorized: invalid or missing ADMIN_TOKEN. Please reload token in Admin UI.",
      },
      { status: 401 },
    );
  }

  const payload = (await req.json()) as ProjectPayload;
  const parsed = toInsert(payload);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .insert([parsed.value])
    .select(
      "id,title,description,tags,image_url,github_url,demo_url,featured,sort_order,status,created_at,updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data }, { status: 201 });
}
