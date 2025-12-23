import { Helmet } from 'react-helmet-async';

/**
 * Organization Schema for New Era Hockey
 * Provides high-level organization information to search engines
 * Use on About/Home pages
 */
const OrganizationSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'New Era Hockey',
    alternateName: 'NEH',
    url: 'https://newerahockeytraining.com',
    logo: 'https://newerahockeytraining.com/assets/images/logo/neh-logo.png',
    description:
      'New Era Hockey provides premier hockey training and development programs in the DMV area, led by experienced coach Will Pasko.',
    email: 'coachwill@newerahockeytraining.com',
    telephone: '+1-571-274-4691',
    sameAs: ['https://www.instagram.com/NewEraHockeyDMV'],
    foundingDate: '2021',
    founders: [
      {
        '@type': 'Person',
        name: 'Will Pasko',
      },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-571-274-4691',
      contactType: 'Customer Service',
      email: 'coachwill@newerahockeytraining.com',
      areaServed: ['VA', 'MD', 'DC'],
      availableLanguage: 'English',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default OrganizationSchema;
