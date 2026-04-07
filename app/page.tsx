import HomePageClient from "./HomePageClient";
import { getFeaturedProjects } from "../lib/projects";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await getFeaturedProjects();
  return <HomePageClient projects={projects} />;
}
