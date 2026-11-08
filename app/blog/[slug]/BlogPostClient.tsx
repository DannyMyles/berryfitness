'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, User, Heart, ArrowLeft, Loader2 } from 'lucide-react';
import { blogService, Blog } from '@/app/api_services/blogService';

export default function BlogPostClient({ slug }: { slug: string }) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setError('');
    blogService
      .getBlogBySlug(slug)
      .then((post) => {
        setBlog(post);
        setLikes(post.likes);
      })
      .catch(() => setError('This post could not be found.'))
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleLike = () => {
    if (!blog || liked) return;
    setLiked(true);
    setLikes((n) => n + 1);
    blogService.likeBlog(blog.id).catch(() => {
      setLiked(false);
      setLikes((n) => n - 1);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-fitness-primary" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-fitness-dark mb-2">Post Not Found</h1>
        <p className="text-gray-600 mb-6">{error || 'This post could not be found.'}</p>
        <Link href="/blog" className="btn-fitness">Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-20 bg-white">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-fitness-primary font-medium hover:text-fitness-primary-dark transition-colors mb-6">
          <ArrowLeft size={18} />
          Back to Blog
        </Link>

        <span className="inline-block bg-fitness-primary text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
          {blog.category}
        </span>

        <h1 className="text-3xl md:text-4xl font-bold text-fitness-dark mb-4">{blog.title}</h1>

        <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-8">
          <span className="flex items-center gap-1.5">
            <User size={16} />
            {blog.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={16} />
            {blogService.formatDate(blog.date)}
          </span>
          {blog.readTime && (
            <span className="flex items-center gap-1.5">
              <Clock size={16} />
              {blog.readTime}
            </span>
          )}
        </div>

        {blog.imageInfo?.hasImage && (
          <div className="rounded-2xl overflow-hidden mb-8 bg-gray-100">
            <img src={blogService.getBlogImageUrl(blog)} alt={blog.title} className="w-full h-auto object-cover" />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
          {blog.content}
        </div>

        {blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {blog.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
          <button
            onClick={handleLike}
            disabled={liked}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-colors ${
              liked
                ? 'bg-fitness-primary/10 text-fitness-primary'
                : 'bg-gray-100 text-gray-600 hover:bg-fitness-primary/10 hover:text-fitness-primary'
            }`}
          >
            <Heart size={18} className={liked ? 'fill-fitness-primary' : ''} />
            {likes} {likes === 1 ? 'Like' : 'Likes'}
          </button>
        </div>
      </div>
    </div>
  );
}
