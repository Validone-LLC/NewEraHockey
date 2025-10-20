import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';
import { getSeoData } from '@data/seoConfig';

/**
 * SEO Component - Manages meta tags, Open Graph, and Twitter Card data
 * Uses react-helmet-async to dynamically update page metadata
 *
 * @param {string} pageKey - Key from seoConfig (e.g., 'home', 'coaches')
 * @param {object} customMeta - Optional custom metadata to override defaults
 */
const SEO = ({ pageKey = 'default', customMeta = {} }) => {
  const defaultMeta = getSeoData(pageKey);
  const meta = { ...defaultMeta, ...customMeta };

  const {
    title,
    description,
    keywords,
    image = defaultMeta.image,
    url = defaultMeta.url,
    type = 'website',
  } = meta;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="New Era Hockey" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional Meta */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="New Era Hockey" />
    </Helmet>
  );
};

SEO.propTypes = {
  pageKey: PropTypes.string,
  customMeta: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    keywords: PropTypes.string,
    image: PropTypes.string,
    url: PropTypes.string,
    type: PropTypes.string,
  }),
};

export default SEO;
