import { memo, useState } from 'react';
import { Instagram, ExternalLink } from 'lucide-react';

/**
 * Extract post ID from Instagram URL
 */
function extractPostId(url) {
  if (!url) return null;
  const match = url.match(/instagram\.com\/(p|reel|tv)\/([\w-]+)/);
  return match ? match[2] : null;
}

/**
 * InstagramEmbed - Renders Instagram content via iframe
 */
const InstagramEmbed = memo(function InstagramEmbed({ url, className = '' }) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const postId = extractPostId(url);
  const cleanUrl = url ? url.split('?')[0].replace(/\/$/, '') + '/' : '';

  // Instagram iframe embed URL
  const embedUrl = postId ? `https://www.instagram.com/p/${postId}/embed/` : null;

  if (!postId) {
    return <FallbackCard url={cleanUrl} message="Invalid Instagram URL" />;
  }

  if (hasError) {
    return <FallbackCard url={cleanUrl} message="Unable to load embed" />;
  }

  return (
    <div
      className={`instagram-embed-container ${className}`}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '500px',
        position: 'relative',
      }}
    >
      {/* Loading state */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1a1a2e',
            borderRadius: '12px',
          }}
        >
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #333',
                borderTopColor: '#833AB4',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            Loading...
          </div>
        </div>
      )}

      <iframe
        src={embedUrl}
        title="Instagram Post"
        style={{
          width: '100%',
          maxWidth: '540px',
          minHeight: '500px',
          border: 'none',
          borderRadius: '12px',
          background: '#fff',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
        loading="lazy"
        allowFullScreen
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

/**
 * Fallback card with link to Instagram
 */
function FallbackCard({ url, message }) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '400px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCAF45 100%)',
          borderRadius: '12px',
          padding: '3px',
          maxWidth: '540px',
          width: '100%',
        }}
      >
        <div
          style={{
            background: '#1a1a2e',
            borderRadius: '10px',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '350px',
            gap: '16px',
          }}
        >
          <Instagram
            style={{
              width: '48px',
              height: '48px',
              color: '#E1306C',
            }}
          />

          <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>{message}</p>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #833AB4, #FD1D1D)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            <Instagram style={{ width: '18px', height: '18px' }} />
            View on Instagram
            <ExternalLink style={{ width: '14px', height: '14px' }} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default InstagramEmbed;
