'use client';

import React, { useCallback, useState, useEffect } from 'react';

interface ImageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: File | string) => void;
}

interface ExistingImage {
  url: string;
  filename: string;
}

export default function ImageSelectModal({ isOpen, onClose, onSelect }: ImageSelectModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'existing'>('upload');
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'existing') {
      fetchExistingImages();
    }
  }, [isOpen, activeTab]);

  const fetchExistingImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/images');
      const data = await response.json();
      setExistingImages(data.images);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedFile) {
      onSelect(selectedFile);
      onClose();
    }
  }, [selectedFile, onSelect, onClose]);

  const handleExistingImageSelect = (url: string) => {
    onSelect(url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select Image</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'upload' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              Upload New
            </button>
            <button
              onClick={() => setActiveTab('existing')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'existing' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              Existing Images
            </button>
          </div>
        </div>

        {activeTab === 'upload' ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 ${
              dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 mx-auto mb-4" />
            ) : (
              <p>Drag and drop an image here, or click to select</p>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600"
            >
              Choose File
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="col-span-3 text-center py-8">Loading...</div>
            ) : existingImages.length > 0 ? (
              existingImages.map((image) => (
                <div
                  key={image.url}
                  onClick={() => handleExistingImageSelect(image.url)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                No images found
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          {activeTab === 'upload' && (
            <button
              onClick={handleConfirm}
              disabled={!selectedFile}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              Insert Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
