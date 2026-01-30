import { useEffect, useRef, memo, useState } from 'react';
import { Instagram, ExternalLink, Play } from 'lucide-react';

// Check if running on localhost
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'));

/**
 * InstagramEmbed - Renders an Instagram embed using the official embed format
 * Shows a preview card on localhost (Instagram blocks local embeds)
 */
const InstagramEmbed = memo(function InstagramEmbed({ url, className = '' }) {
  const containerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Clean the URL (remove query params, ensure trailing slash)
  const cleanUrl = url ? url.split('?')[0].replace(/\/$/, '') + '/' : '';

  useEffect(() => {
    if (!url || isLocalhost) return;

    // Load Instagram embed script if not already loaded
    const loadScript = () => {
      if (window.instgrm) {
        setScriptLoaded(true);
        window.instgrm.Embeds.process();
        return;
      }

      const existingScript = document.querySelector('script[src*="instagram.com/embed.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          setScriptLoaded(true);
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      };
      document.body.appendChild(script);
    };

    const timer = setTimeout(loadScript, 100);
    return () => clearTimeout(timer);
  }, [url]);

  useEffect(() => {
    if (scriptLoaded && window.instgrm && !isLocalhost) {
      window.instgrm.Embeds.process();
    }
  }, [scriptLoaded]);

  if (!url) return null;

  // Show preview card on localhost (Instagram blocks local embeds)
  if (isLocalhost) {
    return (
      <div
        className={`instagram-preview ${className}`}
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
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #FCAF45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Play
                style={{
                  width: '36px',
                  height: '36px',
                  color: 'white',
                  marginLeft: '4px',
                }}
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  color: '#9ca3af',
                  fontSize: '14px',
                  marginBottom: '8px',
                }}
              >
                Instagram embeds don't load on localhost
              </p>
              <p
                style={{
                  color: '#6b7280',
                  fontSize: '12px',
                }}
              >
                Will work when deployed
              </p>
            </div>

            <a
              href={cleanUrl}
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
                marginTop: '8px',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(131, 58, 180, 0.4)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onFocus={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(131, 58, 180, 0.4)';
              }}
              onBlur={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
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

  // Production: render actual Instagram embed
  return (
    <div
      ref={containerRef}
      className={`instagram-embed-container ${className}`}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '450px',
      }}
    >
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={cleanUrl}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: '540px',
          minWidth: '326px',
          padding: 0,
          width: 'calc(100% - 2px)',
        }}
      >
        <div style={{ padding: '16px' }}>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#3897f0',
              textDecoration: 'none',
            }}
          >
            View this post on Instagram
          </a>
        </div>
      </blockquote>
    </div>
  );
});

export default InstagramEmbed;
