// ---------------------------------------------------------------------------
// QuestionEditor.tsx - Rich text editor for questions
// Provides a rich text editing interface for question content
// ---------------------------------------------------------------------------

import React, { useState, useRef, useEffect } from 'react';

interface QuestionEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  content,
  onChange,
  placeholder = 'Enter your question here...',
  className = '',
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertText = (text: string) => {
    document.execCommand('insertText', false, text);
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const clearFormatting = () => {
    execCommand('removeFormat');
  };

  return (
    <div className={`border border-theme-border-primary rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-theme-border-primary bg-theme-bg-secondary">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50"
          disabled={disabled}
          title="Bold"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M12.6 18.6c-1.2 0-2.3-.4-3.2-1.2-.9-.8-1.4-1.9-1.4-3.1V6.7c0-1.2.5-2.3 1.4-3.1.9-.8 2-1.2 3.2-1.2h3.4c1.2 0 2.3.4 3.2 1.2.9.8 1.4 1.9 1.4 3.1v7.6c0 1.2-.5 2.3-1.4 3.1-.9.8-2 1.2-3.2 1.2h-3.4z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50"
          disabled={disabled}
          title="Italic"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50"
          disabled={disabled}
          title="Underline"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M16 9A6 6 0 1 1 4 9V1a1 1 0 1 1 2 0v8a4 4 0 1 0 8 0V1a1 1 0 1 1 2 0v8zM2 17h16v2H2v-2z"/>
          </svg>
        </button>

        <div className="w-px h-6 bg-theme-bg-tertiary mx-1"></div>

        {/* Lists */}
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50"
          disabled={disabled}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50"
          disabled={disabled}
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM11 13a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 01-1 1h-4a1 1 0 01-1-1v-1z"/>
          </svg>
        </button>

        <div className="w-px h-6 bg-theme-bg-tertiary mx-1"></div>

        {/* Insert Options */}
        <button
          type="button"
          onClick={insertLink}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50"
          disabled={disabled}
          title="Insert Link"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          type="button"
          onClick={insertImage}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50"
          disabled={disabled}
          title="Insert Image"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="w-px h-6 bg-theme-bg-tertiary mx-1"></div>

        {/* Special Characters */}
        <button
          type="button"
          onClick={() => insertText('×')}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50 text-sm font-bold"
          disabled={disabled}
          title="Multiplication"
        >
          ×
        </button>

        <button
          type="button"
          onClick={() => insertText('÷')}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50 text-sm font-bold"
          disabled={disabled}
          title="Division"
        >
          ÷
        </button>

        <button
          type="button"
          onClick={() => insertText('±')}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50 text-sm font-bold"
          disabled={disabled}
          title="Plus/Minus"
        >
          ±
        </button>

        <button
          type="button"
          onClick={() => insertText('≤')}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50 text-sm font-bold"
          disabled={disabled}
          title="Less than or equal"
        >
          ≤
        </button>

        <button
          type="button"
          onClick={() => insertText('≥')}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50 text-sm font-bold"
          disabled={disabled}
          title="Greater than or equal"
        >
          ≥
        </button>

        <div className="w-px h-6 bg-theme-bg-tertiary mx-1"></div>

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={clearFormatting}
          className="p-1 rounded hover:bg-theme-bg-tertiary disabled:opacity-50"
          disabled={disabled}
          title="Clear Formatting"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`min-h-[200px] p-4 focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-inset ${
          disabled ? 'bg-theme-bg-secondary cursor-not-allowed' : 'bg-theme-bg-primary'
        } ${isFocused ? 'ring-2 ring-theme-interactive-primary ring-inset' : ''}`}
        style={{ 
          minHeight: '200px',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default QuestionEditor; 