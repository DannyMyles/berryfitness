import type { Metadata } from 'next';
import BlogPostClient from './BlogPostClient';
import { blogService } from '@/app/api_services/blogService';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const blog = await blogService.getBlogBySlug(slug);
    return {
      title: blog.title,
      description: blog.excerpt,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: {
        title: `${blog.title} | Berry Fitness for Health`,
        description: blog.excerpt,
        url: `/blog/${slug}`,
        images: blog.imageInfo?.hasImage ? [{ url: blogService.getBlogImageUrl(blog) }] : undefined,
      },
    };
  } catch {
    return { title: 'Blog Post' };
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
