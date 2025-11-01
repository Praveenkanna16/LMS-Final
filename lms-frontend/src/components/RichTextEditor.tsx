import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Image as ImageIcon,
  Heading1, Heading2, Heading3, Quote, Code, Undo, Redo
} from 'lucide-react';

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  editable = true
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Link.configure({
        openOnClick: false
      }),
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Color,
      TextStyle
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    }
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <Card className='w-full'>
      <CardContent className='p-4'>
        {editable && (
          <div className='flex flex-wrap gap-1 mb-4 pb-4 border-b'>
            {/* Text Formatting */}
            <Button
              variant={editor.isActive('bold') ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className='h-4 w-4' />
            </Button>
            
            <Button
              variant={editor.isActive('italic') ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className='h-4 w-4' />
            </Button>

            <Button
              variant={editor.isActive('strike') ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className='h-4 w-4' />
            </Button>

            <div className='w-px h-8 bg-border mx-1' />

            {/* Headings */}
            <Button
              variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className='h-4 w-4' />
            </Button>

            <Button
              variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className='h-4 w-4' />
            </Button>

            <Button
              variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className='h-4 w-4' />
            </Button>

            <div className='w-px h-8 bg-border mx-1' />

            {/* Lists */}
            <Button
              variant={editor.isActive('bulletList') ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className='h-4 w-4' />
            </Button>

            <Button
              variant={editor.isActive('orderedList') ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className='h-4 w-4' />
            </Button>

            <div className='w-px h-8 bg-border mx-1' />

            {/* Alignment */}
            <Button
              variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <AlignLeft className='h-4 w-4' />
            </Button>

            <Button
              variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            >
              <AlignCenter className='h-4 w-4' />
            </Button>

            <Button
              variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            >
              <AlignRight className='h-4 w-4' />
            </Button>

            <div className='w-px h-8 bg-border mx-1' />

            {/* Quote & Code */}
            <Button
              variant={editor.isActive('blockquote') ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className='h-4 w-4' />
            </Button>

            <Button
              variant={editor.isActive('code') ? 'default' : 'outline'}
              size='sm'
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code className='h-4 w-4' />
            </Button>

            <div className='w-px h-8 bg-border mx-1' />

            {/* Link & Image */}
            <Button
              variant={editor.isActive('link') ? 'default' : 'outline'}
              size='sm'
              onClick={setLink}
            >
              <LinkIcon className='h-4 w-4' />
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={addImage}
            >
              <ImageIcon className='h-4 w-4' />
            </Button>

            <div className='w-px h-8 bg-border mx-1' />

            {/* Undo/Redo */}
            <Button
              variant='outline'
              size='sm'
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className='h-4 w-4' />
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className='h-4 w-4' />
            </Button>
          </div>
        )}

        <EditorContent
          editor={editor}
          className='prose prose-sm max-w-none min-h-[200px] focus:outline-none'
        />
      </CardContent>
    </Card>
  );
};
