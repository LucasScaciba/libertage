/**
 * IconMapper Usage Examples
 * 
 * This file demonstrates how to use the IconMapper utility
 * in different scenarios.
 */

import { IconMapper, getIconComponent, renderIcon } from './icon-mapper';
import type { IconKey } from '@/types';

// Example 1: Using IconMapper component directly
export function ExampleIconMapperComponent() {
  return (
    <div className="flex gap-4">
      <IconMapper iconKey="instagram" size={24} className="text-pink-500" />
      <IconMapper iconKey="whatsapp" size={24} className="text-green-500" />
      <IconMapper iconKey="linkedin" size={24} className="text-blue-500" />
    </div>
  );
}

// Example 2: Using getIconComponent for dynamic rendering
export function ExampleDynamicIcon({ iconKey }: { iconKey: IconKey }) {
  const IconComponent = getIconComponent(iconKey);
  
  return (
    <div className="p-4 border rounded">
      <IconComponent size={32} className="text-gray-700" />
    </div>
  );
}

// Example 3: Using renderIcon helper
export function ExampleRenderIcon({ iconKey }: { iconKey: IconKey }) {
  return (
    <div className="flex items-center gap-2">
      {renderIcon(iconKey, { size: 20, className: 'text-gray-600' })}
      <span>Social Link</span>
    </div>
  );
}

// Example 4: Rendering a list of external links with icons
interface ExternalLink {
  id: string;
  title: string;
  url: string;
  icon_key: IconKey;
}

export function ExampleExternalLinksList({ links }: { links: ExternalLink[] }) {
  return (
    <div className="space-y-2">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 transition-colors"
        >
          <IconMapper iconKey={link.icon_key} size={20} className="text-gray-700" />
          <span className="font-medium">{link.title}</span>
        </a>
      ))}
    </div>
  );
}

// Example 5: Using with conditional rendering
export function ExampleConditionalIcon({ 
  iconKey, 
  showIcon = true 
}: { 
  iconKey: IconKey; 
  showIcon?: boolean;
}) {
  if (!showIcon) return null;
  
  return <IconMapper iconKey={iconKey} size={24} />;
}

// Example 6: Using in a card component
export function ExampleLinkCard({ 
  title, 
  url, 
  iconKey 
}: { 
  title: string; 
  url: string; 
  iconKey: IconKey;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-full">
          <IconMapper iconKey={iconKey} size={24} className="text-gray-700" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Visit Link
          </a>
        </div>
      </div>
    </div>
  );
}
