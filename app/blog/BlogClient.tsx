'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Newspaper, Search, AlertCircle, RefreshCw,
  Loader2, Calendar, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import { usePageHeader } from '@/components/site/SiteProvider';
import EmptyState from '@/components/ui/EmptyState';
import { blogService, Blog, Category } from '@/app/api_services/blogService';

export default function BlogClient() {
  const header = usePageHeader('blog', { eyebrow: 'Insights & Tips', title: 'The Blog', subtitle: 'Training advice, nutrition tips, and updates from the team.' });
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pagination, setPagination] = useState<{ totalPages: number; hasNextPage: boolean; hasPrevPage: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    blogService.getBlogCategories().then(setCategories).catch(() => {});
  }, []);

  const fetchBlogs = () => {
    setIsLoading(true);
    setError('');
    blogService
      .getAllBlogs({
        page,
        limit: 9,
        category: activeCategory === 'All' ? undefined : activeCategory,
        search: searchQuery || undefined,
      })
      .then((res) => {
        setBlogs(res.blogs);
        setPagination(res.pagination);
      })
      .catch(() => setError('Could not load blog posts.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(fetchBlogs, 250); // debounce search typing
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, searchQuery, page]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, searchQuery]);

  return (
    <div className="pt-0">
      <PageHero
        badge={header.eyebrow}
        badgeIcon={Newspaper}
        title={header.title}
        subtitle={header.subtitle}
      />

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-3xl p-6 shadow-card sticky top-24">
                <div className="mb-6 relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-fitness-primary focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveCategory('All')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeCategory === 'All'
                          ? 'bg-fitness-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => setActiveCategory(category.name)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeCategory === category.name
                            ? 'bg-fitness-primary text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {category.name} ({category.count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="lg:w-3/4">
              {error ? (
                <EmptyState
                  icon={AlertCircle}
                  title="Couldn't load posts"
                  description={error}
                  action={{ label: 'Try Again', icon: RefreshCw, onClick: fetchBlogs }}
                />
              ) : isLoading ? (
                <div className="flex items-center justify-center py-24 text-gray-400">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : blogs.length === 0 ? (
                searchQuery || activeCategory !== 'All' ? (
                  <EmptyState
                    icon={Search}
                    title="No posts match your search"
                    description="Try a different search term or category."
                    action={{
                      label: 'Clear Filters',
                      onClick: () => {
                        setSearchQuery('');
                        setActiveCategory('All');
                      },
                    }}
                  />
                ) : (
                  <EmptyState
                    icon={Newspaper}
                    title="No posts yet"
                    description="New articles are on the way — check back soon."
                  />
                )
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogs.map((blog) => (
                      <Link
                        key={blog.id}
                        href={`/blog/${blog.slug}`}
                        className="card-fitness overflow-hidden group block"
                      >
                        <div className="relative h-48 overflow-hidden bg-gray-100">
                          <img
                            src={blogService.getBlogImageUrl(blog)}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 bg-fitness-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                            {blog.category}
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-gray-900 mb-2 group-hover:text-fitness-primary transition-colors line-clamp-2">
                            {blog.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{blog.excerpt}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {blogService.formatDate(blog.date)}
                            </span>
                            {blog.readTime && (
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {blog.readTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-10">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!pagination.hasPrevPage}
                        className="p-2 rounded-full bg-white shadow-card disabled:opacity-40 disabled:cursor-not-allowed hover:text-fitness-primary transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!pagination.hasNextPage}
                        className="p-2 rounded-full bg-white shadow-card disabled:opacity-40 disabled:cursor-not-allowed hover:text-fitness-primary transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
