import React from 'react';
import { IconBrandInstagram, IconBrandLinkedin, IconBrandX } from '@tabler/icons-react';

interface Props {
  links: {
    Twitter: string;
    Instagram: string;
    LinkedIn: string;
  };
  className?: string;
}

export const SocialLinks: React.FC<Props> = ({ links, className = '' }) => {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      <a
        href={links.Twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-white transition-colors"
        title="X (formerly Twitter)"
      >
        <IconBrandX size={24} />
      </a>
      <a
        href={links.Instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-white transition-colors"
        title="Instagram"
      >
        <IconBrandInstagram size={24} />
      </a>
      <a
        href={links.LinkedIn}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-white transition-colors"
        title="LinkedIn"
      >
        <IconBrandLinkedin size={24} />
      </a>
    </div>
  );
};