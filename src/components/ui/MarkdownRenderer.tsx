

import React from 'react';

interface MarkdownRendererProps {
  text: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  const renderContent = () => {
    if (!text) return null;

    const formatInline = (line: string) => {
      // Converts **text** to <strong>text</strong>
      return line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    // FIX: Use React.ReactNode instead of JSX.Element to avoid "Cannot find namespace 'JSX'" error.
    const elements: React.ReactNode[] = [];
    const lines = text.split('\n');
    // FIX: Use React.ReactNode instead of JSX.Element to avoid "Cannot find namespace 'JSX'" error.
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 pl-2">
            {listItems}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Check for bullet points
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        const content = trimmedLine.substring(2);
        listItems.push(<li key={index} dangerouslySetInnerHTML={{ __html: formatInline(content) }} />);
      } else {
        // If the line is not a list item, the current list (if any) is finished.
        flushList();
        
        if (trimmedLine) {
          // A line that is entirely bold is treated as a title
          const isTitle = trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && (trimmedLine.match(/\*\*/g) || []).length === 2;
          
          if (isTitle) {
            const content = trimmedLine.substring(2, trimmedLine.length - 2);
            elements.push(<h4 key={index} className="font-semibold text-gray-800 mt-4 mb-2">{content}</h4>);
          } else {
            elements.push(<p key={index} dangerouslySetInnerHTML={{ __html: formatInline(trimmedLine) }} />);
          }
        }
      }
    });

    // After the loop, flush any remaining list items
    flushList();

    return elements;
  };

  return <div className="space-y-3">{renderContent()}</div>;
};

export default MarkdownRenderer;