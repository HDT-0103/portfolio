import "server-only";

import type { Project } from "./types";
import { createSupabasePublicClient } from "./supabasePublic";

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  tags: string[] | null;
  image_url: string;
  github_url: string | null;
  demo_url: string | null;
  featured: boolean;
  sort_order: number;
  status: "draft" | "published";
};

export async function getFeaturedProjects(): Promise<Project[]> {
  try {
    const supabase = createSupabasePublicClient();

    const { data, error } = await supabase
      .from("projects")
      .select(
        "id,title,description,tags,image_url,github_url,demo_url,featured,sort_order,status",
      )
      .eq("featured", true)
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as ProjectRow[];
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      desc: row.description,
      tags: row.tags ?? [],
      imageUrl: row.image_url,
      githubUrl: row.github_url,
      demoUrl: row.demo_url,
      featured: row.featured,
      sortOrder: row.sort_order,
      status: row.status,
    }));
  } catch (err) {
    console.error("Failed to load featured projects:", err);
    return [];
  }
}
