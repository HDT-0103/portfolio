import { NextResponse } from "next/server";
import { assertAdmin } from "../../../../lib/adminAuth";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";

type ProjectUpdatePayload = {
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

function normalizeTags(tags: unknown): string[] | undefined {
  if (tags === undefined) return undefined;
  if (tags === null) return [];
  if (Array.isArray(tags)) return tags.filter((t) => typeof t === "string");
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return undefined;
}

function toUpdate(payload: ProjectUpdatePayload) {
  const update: Record<string, unknown> = {};

  if (typeof payload.title === "string") update.title = payload.title.trim();
  const description =
    typeof payload.desc === "string"
      ? payload.desc.trim()
      : typeof payload.description === "string"
        ? payload.description.trim()
        : undefined;
  if (description !== undefined) update.description = description;

  const tags = normalizeTags(payload.tags);
  if (tags !== undefined) update.tags = tags;

  const imageUrl =
    typeof payload.imageUrl === "string"
      ? payload.imageUrl.trim()
      : typeof payload.image_url === "string"
        ? payload.image_url.trim()
        : undefined;
  if (imageUrl !== undefined) update.image_url = imageUrl;

  const githubUrl =
    typeof payload.githubUrl === "string"
      ? payload.githubUrl.trim()
      : typeof payload.github_url === "string"
        ? payload.github_url.trim()
        : payload.githubUrl === null || payload.github_url === null
          ? null
          : undefined;
  if (githubUrl !== undefined) update.github_url = githubUrl;

  const demoUrl =
    typeof payload.demoUrl === "string"
      ? payload.demoUrl.trim()
      : typeof payload.demo_url === "string"
        ? payload.demo_url.trim()
        : payload.demoUrl === null || payload.demo_url === null
          ? null
          : undefined;
  if (demoUrl !== undefined) update.demo_url = demoUrl;

  if (typeof payload.featured === "boolean") update.featured = payload.featured;

  const sortOrder =
    typeof payload.sortOrder === "number"
      ? payload.sortOrder
      : typeof payload.sort_order === "number"
        ? payload.sort_order
        : undefined;
  if (sortOrder !== undefined) update.sort_order = sortOrder;

  if (payload.status === "draft" || payload.status === "published") {
    update.status = payload.status;
  }

  return update;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const isAdmin = assertAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const payload = (await req.json()) as ProjectUpdatePayload;
  const update = toUpdate(payload);
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", id)
    .select(
      "id,title,description,tags,image_url,github_url,demo_url,featured,sort_order,status,created_at,updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const isAdmin = assertAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
