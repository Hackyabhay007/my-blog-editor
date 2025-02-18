'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import ImageSelectModal from '@/components/ImageSelectModal';
import { Blog } from '@/types/blog';

const BlogEditor = dynamic(() => import('../components/BlogEditor'), {
  ssr: false,
  loading: () => <div>Loading editor...</div>
});

export default function Home() {
  const [blog, setBlog] = useState<Partial<Blog>>({
    title: '',
    subtitle: '',
    headerImage: '',
    content: ''
  });
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleContentChange = useCallback((content: string) => {
    setBlog(prev => ({ ...prev, content }));
  }, []);

  const handleImageSelect = async (input: File | string) => {
    let imageUrl = input;
    
    if (input instanceof File) {
      const formData = new FormData();
      formData.append('image', input);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        if (result.success) {
          imageUrl = result.url;
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image');
        return;
      }
    }

    setBlog(prev => ({ ...prev, headerImage: imageUrl as string }));
    setIsImageModalOpen(false);
  };

  const handleSave = async () => {
    if (!blog.title?.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!blog.content?.trim()) {
      alert('Please add some content');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...blog,
          subtitle: blog.subtitle || '',
          headerImage: blog.headerImage || '',
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save blog');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to save blog');
      }
      
      alert('Blog saved successfully!');
      // Reset form
      setBlog({
        title: '',
        subtitle: '',
        headerImage: '',
        content: ''
      });
    } catch (error) {
      console.error('Failed to save blog:', error);
      alert(error instanceof Error ? error.message : 'Failed to save blog');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Create New Blog</h1>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Blog'}
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Blog Title"
            value={blog.title}
            onChange={e => setBlog(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2 text-xl font-bold border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
          
          <input
            type="text"
            placeholder="Blog Subtitle (optional)"
            value={blog.subtitle}
            onChange={e => setBlog(prev => ({ ...prev, subtitle: e.target.value }))}
            className="w-full px-4 py-2 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />

          <div 
            onClick={() => setIsImageModalOpen(true)}
            className="relative w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {blog.headerImage ? (
              <div className="relative w-full h-full">
                <img
                  src={blog.headerImage}
                  alt="Header"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBlog(prev => ({ ...prev, headerImage: '' }));
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p>Click to add header image</p>
                <p className="text-sm text-gray-500">Recommended size: 1200x600</p>
              </div>
            )}
          </div>
        </div>

        <BlogEditor 
          content={blog.content || ''} 
          onChange={handleContentChange}
        />
      </div>

      <ImageSelectModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onSelect={handleImageSelect}
      />
    </div>
  );
}
