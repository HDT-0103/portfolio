-- Optional seed data for `public.projects`.
-- Run after `supabase/projects.sql`.

insert into public.projects
  (title, description, tags, image_url, github_url, demo_url, featured, sort_order, status)
values
  (
    'EcomoveX',
    'A green-travel web app that helps users find eco-friendly transportation options and reduce carbon footprint.',
    array['Web App','Green Tech','Sustainability'],
    '/images/ecomovex.png',
    'https://github.com/HDT-0103/EcomoveX',
    null,
    true,
    1,
    'published'
  ),
  (
    'MystW',
    'A Pixel Art adventure game focused on puzzle-solving and storytelling, built with engaging retro-style visuals.',
    array['Game Dev','Pixel Art'],
    '/images/MystW.png',
    'https://github.com/HDT-0103/MystW',
    null,
    true,
    2,
    'published'
  ),
  (
    'Cloud Network Lab',
    'Sắp ra mắt: Dự án giả lập và tối ưu hóa hệ thống mạng doanh nghiệp trên nền tảng điện toán đám mây.',
    array['Networking','Cloud','Coming Soon'],
    '/images/cloud-network-lab.png',
    null,
    null,
    true,
    3,
    'published'
  );
