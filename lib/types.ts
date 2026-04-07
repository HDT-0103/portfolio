export type Project = {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  imageUrl: string;
  githubUrl?: string | null;
  demoUrl?: string | null;
  featured: boolean;
  sortOrder: number;
  status: "draft" | "published";
};

