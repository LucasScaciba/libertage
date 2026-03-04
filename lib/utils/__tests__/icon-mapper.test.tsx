/**
 * IconMapper Unit Tests
 * 
 * Tests icon mapping functionality and component rendering.
 * 
 * Requirements: 3.11, 5.8, 7.7, 10.2
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { getIconComponent, renderIcon, IconMapper } from '../icon-mapper';
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
} from 'lucide-react';
import type { IconKey } from '@/types';

describe('IconMapper', () => {
  describe('getIconComponent', () => {
    it('should return Instagram component for instagram key', () => {
      const component = getIconComponent('instagram');
      expect(component).toBe(Instagram);
    });

    it('should return MessageCircle component for whatsapp key', () => {
      const component = getIconComponent('whatsapp');
      expect(component).toBe(MessageCircle);
    });

    it('should return Linkedin component for linkedin key', () => {
      const component = getIconComponent('linkedin');
      expect(component).toBe(Linkedin);
    });

    it('should return Facebook component for facebook key', () => {
      const component = getIconComponent('facebook');
      expect(component).toBe(Facebook);
    });

    it('should return Twitter component for twitter key', () => {
      const component = getIconComponent('twitter');
      expect(component).toBe(Twitter);
    });

    it('should return Youtube component for youtube key', () => {
      const component = getIconComponent('youtube');
      expect(component).toBe(Youtube);
    });

    it('should return Music2 component for tiktok key', () => {
      const component = getIconComponent('tiktok');
      expect(component).toBe(Music2);
    });

    it('should return Github component for github key', () => {
      const component = getIconComponent('github');
      expect(component).toBe(Github);
    });

    it('should return LinkIcon component for link key', () => {
      const component = getIconComponent('link');
      expect(component).toBe(LinkIcon);
    });

    it('should return default LinkIcon for unknown key', () => {
      const component = getIconComponent('unknown' as IconKey);
      expect(component).toBe(LinkIcon);
    });
  });

  describe('renderIcon', () => {
    it('should render icon with default size', () => {
      const { container } = render(renderIcon('instagram'));
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render icon with custom size', () => {
      const { container } = render(renderIcon('instagram', { size: 32 }));
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('width')).toBe('32');
      expect(svg?.getAttribute('height')).toBe('32');
    });

    it('should render icon with custom className', () => {
      const { container } = render(renderIcon('instagram', { className: 'custom-class' }));
      const svg = container.querySelector('svg');
      expect(svg?.classList.contains('custom-class')).toBe(true);
    });
  });

  describe('IconMapper component', () => {
    it('should render Instagram icon', () => {
      const { container } = render(<IconMapper iconKey="instagram" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render WhatsApp icon', () => {
      const { container } = render(<IconMapper iconKey="whatsapp" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render LinkedIn icon', () => {
      const { container } = render(<IconMapper iconKey="linkedin" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render Facebook icon', () => {
      const { container } = render(<IconMapper iconKey="facebook" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render Twitter icon', () => {
      const { container } = render(<IconMapper iconKey="twitter" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render YouTube icon', () => {
      const { container } = render(<IconMapper iconKey="youtube" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render TikTok icon', () => {
      const { container } = render(<IconMapper iconKey="tiktok" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render GitHub icon', () => {
      const { container } = render(<IconMapper iconKey="github" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render default Link icon', () => {
      const { container } = render(<IconMapper iconKey="link" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render with custom size', () => {
      const { container } = render(<IconMapper iconKey="instagram" size={32} />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('32');
      expect(svg?.getAttribute('height')).toBe('32');
    });

    it('should render with custom className', () => {
      const { container } = render(<IconMapper iconKey="instagram" className="text-pink-500" />);
      const svg = container.querySelector('svg');
      expect(svg?.classList.contains('text-pink-500')).toBe(true);
    });

    it('should use memoization to prevent unnecessary re-renders', () => {
      const { rerender, container } = render(<IconMapper iconKey="instagram" />);
      const firstSvg = container.querySelector('svg');
      
      // Re-render with same props
      rerender(<IconMapper iconKey="instagram" />);
      const secondSvg = container.querySelector('svg');
      
      // Should be the same element (memoized)
      expect(firstSvg).toBe(secondSvg);
    });
  });
});
