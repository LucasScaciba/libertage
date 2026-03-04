/**
 * IconMapper Utility
 * 
 * Maps icon_key to Lucide React components with performance optimization.
 * Supports all social media icons and implements component caching.
 * 
 * Requirements: 3.11, 5.8, 7.7, 10.2
 */

import { memo } from 'react';
import {
  Instagram,
  MessageCircle,
  Linkedin,
  Facebook,
  Twitter,
  Youtube,
  Music2,
  Github,
  Link as LinkIcon,
  LucideProps,
} from 'lucide-react';
import type { IconKey } from '@/types';

/**
 * Type for icon component
 */
type IconComponent = React.ComponentType<LucideProps>;

/**
 * Map of icon keys to Lucide React components
 */
const ICON_COMPONENT_MAP: Record<IconKey, IconComponent> = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music2,
  github: Github,
  link: LinkIcon,
};

/**
 * Memoized icon component to prevent unnecessary re-renders
 */
const MemoizedIcon = memo<{ icon: IconComponent; className?: string; size?: number }>(
  ({ icon: Icon, className, size = 20 }) => {
    return <Icon className={className} size={size} />;
  }
);

MemoizedIcon.displayName = 'MemoizedIcon';

/**
 * Get icon component for a given icon key
 * Returns default Link icon for unknown keys
 */
export function getIconComponent(iconKey: IconKey): IconComponent {
  return ICON_COMPONENT_MAP[iconKey] || ICON_COMPONENT_MAP.link;
}

/**
 * Render icon component with memoization
 * Prevents re-renders when props don't change
 */
export function renderIcon(
  iconKey: IconKey,
  props?: { className?: string; size?: number }
): React.ReactElement {
  const IconComponent = getIconComponent(iconKey);
  return <MemoizedIcon icon={IconComponent} {...props} />;
}

/**
 * IconMapper component for rendering icons
 * Uses memo to avoid re-rendering when iconKey doesn't change
 */
export const IconMapper = memo<{
  iconKey: IconKey;
  className?: string;
  size?: number;
}>(({ iconKey, className, size = 20 }) => {
  const IconComponent = getIconComponent(iconKey);
  return <IconComponent className={className} size={size} />;
});

IconMapper.displayName = 'IconMapper';
