'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Instagram, Facebook, ChevronLeft, ChevronRight, Loader2, AlertCircle, Image as ImageIcon, RefreshCw, Play, Youtube } from 'lucide-react';
import { FaTiktok, FaYoutube } from 'react-icons/fa6';
import PageHero from '@/components/ui/PageHero';
import { usePageHeader, useSite } from '@/components/site/SiteProvider';
import EmptyState from '@/components/ui/EmptyState';
import { galleryService, GalleryCategory, GalleryImage } from '@/app/api_services/galleryService';
import { youtubeService, YoutubeVideo } from '@/app/api_services/youtubeService';
import { optimizedSrc } from '@/app/lib/imageSrc';

const VIDEOS_PAGE_SIZE = 9;
const PHOTOS_PAGE_SIZE = 18;

export default function GalleryClient() {
  const header = usePageHeader('gallery', { eyebrow: '', title: 'Gallery', subtitle: 'Hikes, bootcamps, classes and training moments with Berry Fitness for Health.' });
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const social = useSite().settings.social ?? {};
  const socialLinks = [
    { key: 'Facebook', href: social.facebook, Icon: Facebook, className: 'bg-gradient-to-br from-blue-600 to-blue-700' },
    { key: 'YouTube', href: social.youtube, Icon: FaYoutube, className: 'bg-gradient-to-br from-red-600 to-red-700' },
    { key: 'Instagram', href: social.instagram, Icon: Instagram, className: 'bg-gradient-to-br from-[#BE2D6B] to-[#771440]' },
    { key: 'TikTok', href: social.tiktok, Icon: FaTiktok, className: 'bg-gradient-to-br from-gray-800 to-black' },
  ].filter((l): l is typeof l & { href: string } => Boolean(l.href));

  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [visiblePhotoCount, setVisiblePhotoCount] = useState(PHOTOS_PAGE_SIZE);

  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState('');
  const [visibleVideoCount, setVisibleVideoCount] = useState(VIDEOS_PAGE_SIZE);
  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);

  const fetchGallery = () => {
    setIsLoading(true);
    setError('');
    Promise.all([galleryService.getCategories(), galleryService.getImages()])
      .then(([cats, imgs]) => {
        setCategories(cats);
        setImages(imgs);
      })
      .catch(() => setError('Could not load the gallery. Please try again shortly.'))
      .finally(() => setIsLoading(false));
  };

  const fetchVideos = () => {
    setVideosLoading(true);
    setVideosError('');
    youtubeService
      .getVideos()
      .then(setVideos)
      .catch(() => setVideosError('Could not load videos. Please try again shortly.'))
      .finally(() => setVideosLoading(false));
  };

  useEffect(() => {
    fetchGallery();
    fetchVideos();
  }, []);

  const categoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? '';

  const filteredImages =
    activeCategory === 'all' ? images : images.filter((img) => img.categoryId === activeCategory);

  const visibleVideos = videos.slice(0, visibleVideoCount);
  const visibleImages = filteredImages.slice(0, visiblePhotoCount);

  // Lightbox: previous/next wrap around the current category.
  const stepImage = useCallback(
    (delta: number) => {
      setSelectedImage((current) => {
        if (!current || filteredImages.length === 0) return current;
        const index = filteredImages.findIndex((img) => img.id === current.id);
        return filteredImages[(index + delta + filteredImages.length) % filteredImages.length];
      });
    },
    [filteredImages]
  );

  useEffect(() => {
    if (!selectedImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
      if (e.key === 'ArrowLeft') stepImage(-1);
      if (e.key === 'ArrowRight') stepImage(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedImage, stepImage]);

  const chooseCategory = (id: string) => {
    setActiveCategory(id);
    setVisiblePhotoCount(PHOTOS_PAGE_SIZE);
  };

  return (
    <div className="pt-0">
      {/* Hero Section */}
      <PageHero badge={header.eyebrow} title={header.title} subtitle={header.subtitle} />

      {/* Photos / Videos toggle (only when the channel has videos) */}
      {videos.length > 0 && (
      <div className="pt-16 flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-full p-1.5">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all ${
              activeTab === 'photos' ? 'bg-white text-fitness-primary shadow-sm' : 'text-gray-600 hover:text-fitness-primary'
            }`}
          >
            <ImageIcon size={18} />
            Photos
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all ${
              activeTab === 'videos' ? 'bg-white text-fitness-primary shadow-sm' : 'text-gray-600 hover:text-fitness-primary'
            }`}
          >
            <Youtube size={18} />
            Videos
          </button>
        </div>
      </div>
      )}

      {activeTab === 'photos' ? (
      <>
      {/* Gallery Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-gray-300" />
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load the gallery"
              description={error}
              action={{ label: 'Try Again', icon: RefreshCw, onClick: fetchGallery }}
            />
          ) : images.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No photos yet"
              description="Check back soon — new photos from training sessions and events are added regularly."
            />
          ) : (
            <>
              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <button
                  onClick={() => chooseCategory('all')}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    activeCategory === 'all'
                      ? 'bg-fitness-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-fitness-primary/10 hover:text-fitness-primary'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => chooseCategory(category.id)}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                      activeCategory === category.id
                        ? 'bg-fitness-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-fitness-primary/10 hover:text-fitness-primary'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Images Grid */}
              {filteredImages.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title="No photos in this category yet"
                  description="Try a different category, or check back soon."
                  action={{ label: 'Show All Photos', onClick: () => chooseCategory('all') }}
                />
              ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleImages.map((image) => (
                  <button
                    type="button"
                    key={image.id}
                    aria-label={`View photo: ${image.title || categoryName(image.categoryId)}`}
                    className="group relative block w-full aspect-[4/3] rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={optimizedSrc(galleryService.getImageUrl(image), 640)}
                      loading="lazy"
                      decoding="async"
                      alt=""
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-fitness-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white text-sm font-medium mb-1">{categoryName(image.categoryId)}</p>
                        {image.title && <h3 className="text-white font-semibold">{image.title}</h3>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {visiblePhotoCount < filteredImages.length && (
                <div className="flex justify-center mt-10">
                  <button
                    type="button"
                    onClick={() => setVisiblePhotoCount((n) => n + PHOTOS_PAGE_SIZE)}
                    className="btn-primary rounded-full!"
                  >
                    Load more photos ({filteredImages.length - visiblePhotoCount} left)
                  </button>
                </div>
              )}
              </>
              )}
            </>
          )}
        </div>
      </section>
      </>
      ) : (
      <>
      {/* Videos Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {videosLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-gray-300" />
            </div>
          ) : videosError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load videos"
              description={videosError}
              action={{ label: 'Try Again', icon: RefreshCw, onClick: fetchVideos }}
            />
          ) : videos.length === 0 ? (
            <EmptyState
              icon={Youtube}
              title="No videos yet"
              description="Check back soon — videos from the channel will show up here."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleVideos.map((video) => (
                  <div
                    key={video.id}
                    className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer bg-gray-100"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-fitness-dark/80 via-fitness-dark/10 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-white transition-all shadow-lg">
                        <Play size={22} className="text-fitness-primary ml-1" fill="currentColor" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-semibold text-sm line-clamp-2">{video.title}</h3>
                      <p className="text-white/70 text-xs mt-1">{youtubeService.formatDate(video.publishedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {visibleVideoCount < videos.length && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setVisibleVideoCount((n) => n + VIDEOS_PAGE_SIZE)}
                    className="px-8 py-3 rounded-full font-medium bg-gray-100 text-gray-700 hover:bg-fitness-primary/10 hover:text-fitness-primary transition-all"
                  >
                    Load More Videos
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      </>
      )}

      {/* Social Media Section (links from Admin → Settings → Social) */}
      {socialLinks.length > 0 && (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Follow Berry Fitness
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Workout videos, events and training moments from the Berry Fitness community.
          </p>
          <div className="flex justify-center gap-6">
            {socialLinks.map(({ key, href, Icon, className }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key}
                className={`p-4 text-white rounded-xl hover:shadow-fitness-lg transition-all hover:-translate-y-1 ${className}`}
              >
                <Icon size={28} />
              </a>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Lightbox Modal */}
      {selectedImage && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            aria-label="Close photo"
            className="absolute top-4 right-4 p-2 text-white hover:text-fitness-accent transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>
          {filteredImages.length > 1 && (
            <>
              <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); stepImage(-1); }} className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white hover:text-fitness-dark">
                <ChevronLeft size={26} />
              </button>
              <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); stepImage(1); }} className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white hover:text-fitness-dark">
                <ChevronRight size={26} />
              </button>
            </>
          )}
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={optimizedSrc(galleryService.getImageUrl(selectedImage), 1920)}
              alt={selectedImage.title || categoryName(selectedImage.categoryId)}
              className="mx-auto max-h-[80vh] w-auto max-w-full rounded-xl"
            />
            <div className="mt-4 text-white text-center">
              <p className="text-sm text-fitness-primary-light">{categoryName(selectedImage.categoryId)}</p>
              {selectedImage.title && <h3 className="text-xl font-semibold">{selectedImage.title}</h3>}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Video Player Modal */}
      {selectedVideo && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:text-fitness-accent transition-colors"
            onClick={() => setSelectedVideo(null)}
          >
            <X size={32} />
          </button>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={youtubeService.getEmbedUrl(selectedVideo.id)}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="mt-4 text-white text-center">
              <h3 className="text-xl font-semibold">{selectedVideo.title}</h3>
              <p className="text-sm text-white/60 mt-1">{youtubeService.formatDate(selectedVideo.publishedAt)}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
