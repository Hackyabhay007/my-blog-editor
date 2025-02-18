import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { Blog } from '@/types/blog';

const DATA_DIR = path.join(process.cwd(), 'data');
const BLOGS_FILE = path.join(DATA_DIR, 'blogs.json');

// Ensure data directory and blogs file exist
async function ensureDataStructure() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  
  if (!existsSync(BLOGS_FILE)) {
    await writeFile(BLOGS_FILE, '[]', 'utf-8');
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataStructure();
    
    const blog: Blog = await request.json();
    
    // Read existing blogs
    let blogs: Blog[] = [];
    try {
      const data = await readFile(BLOGS_FILE, 'utf-8');
      blogs = JSON.parse(data);
    } catch (error) {
      console.error('Error reading blogs file:', error);
      blogs = [];
    }

    // Validate blog data
    if (!blog.title || !blog.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Add new blog with metadata
    const newBlog: Blog = {
      ...blog,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    blogs.push(newBlog);

    // Save to file
    await writeFile(BLOGS_FILE, JSON.stringify(blogs, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      blog: newBlog 
    });
    
  } catch (error) {
    console.error('Error saving blog:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save blog',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
