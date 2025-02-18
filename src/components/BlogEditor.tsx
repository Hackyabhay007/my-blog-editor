'use client';

import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import React, { useState } from 'react';
import Quill from 'quill';
import ImageSelectModal from './ImageSelectModal';

interface BlogEditorProps {
  content: string;
  onChange: (value: string) => void;
}

interface UploadResponse {
  url: string;
  success: boolean;
  error?: string;
}

interface QuillToolbar extends Quill {
  getModule(name: 'toolbar'): {
    addHandler: (type: string, handler: () => void) => void;
  };
}

export default function BlogEditor({ content, onChange }: BlogEditorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'image'],
      [{ color: [] }, { background: [] }],
      ['clean']
    ]
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'header', 'list', 'bullet',
    'align', 'link', 'image',
    'color', 'background'
  ];

  const { quill, quillRef } = useQuill({
    modules,
    formats,
    theme: 'snow',
    placeholder: 'Write your blog post here...'
  });

  // Handle image upload
  const handleImageUpload = React.useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        
      });

      const result: UploadResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      return result.url;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  }, []);

  // Update image handler to use modal
  React.useEffect(() => {
    if (!quill) return;

    const toolbar = (quill as QuillToolbar).getModule('toolbar');
    toolbar.addHandler('image', () => {
      setIsModalOpen(true);
    });
  }, [quill]);

  const handleImageSelect = async (input: File | string) => {
    let url: string | null = null;
    
    if (input instanceof File) {
      url = await handleImageUpload(input);
    } else {
      url = input; // Input is already a URL
    }

    if (url && quill) {
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', url);
    }
  };

  // Handle content changes
  React.useEffect(() => {
    if (!quill) return;

    quill.on('text-change', () => {
      onChange(quill.root.innerHTML);
    });
  }, [quill, onChange]);

  // Set initial content
  React.useEffect(() => {
    if (!quill) return;
    if (content && quill.root.innerHTML !== content) {
      quill.root.innerHTML = content;
    }
  }, [quill, content]);

  return (
    <>
      <div className="bg-white rounded-lg border">
        <div ref={quillRef} className="min-h-[400px]" />
      </div>
      
      <ImageSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleImageSelect}
      />
    </>
  );
}
