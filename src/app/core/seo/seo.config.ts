import { PageSeo } from './seo.model';

/**
 * All page copy that search engines and social previews see, in one file.
 *
 * This is marketing copy, not code — edit it freely. Two rules of thumb:
 *   - titles under ~60 characters, descriptions 140-160
 *   - name the city, because local search ranks by proximity. The studio is in
 *     Fountain Valley; "Orange County" is branding, not a search target.
 */

export const SITE_URL = 'https://abadaoc.com';
export const SITE_NAME = 'ABADÁ-Capoeira OC';
export const SITE_LOCALE = 'en_US';

/**
 * TODO: replace with a purpose-made 1200x630 action shot (Step 6 in SEO-PLAN.md).
 * A square logo crops badly in link previews.
 */
export const DEFAULT_OG_IMAGE = '/assets/images/abadaoc-logo.png';

export const DEFAULT_SEO: PageSeo = {
  title: 'Capoeira Classes in Fountain Valley, CA | ABADÁ-Capoeira OC',
  description:
    'Afro-Brazilian martial art classes for kids and adults in Fountain Valley, CA. ' +
    'Music, acrobatics, and self-defense. Book a free trial class today.',
  path: '/'
};

/** Keyed by the `seo` string in each route's `data`. */
export const PAGE_SEO: Record<string, PageSeo> = {
  home: DEFAULT_SEO,

  about: {
    title: 'About ABADÁ-Capoeira OC | Fountain Valley, CA',
    description:
      'Meet Professor Mosquito and learn about ABADÁ-Capoeira, the cord system, and the ' +
      'Afro-Brazilian traditions behind our Fountain Valley school.',
    path: '/about'
  },

  // /classes redirects to /classes/kids, so it needs no metadata of its own.
  // These two are real, indexable pages that double as the ad landing pages.
  classesKids: {
    title: 'Kids Martial Arts & Capoeira | Fountain Valley, CA',
    description:
      'Fun kids martial arts in Fountain Valley: capoeira builds focus, confidence and fitness ' +
      'through movement, music and Brazilian culture. Ages 5-12, all levels. First class free.',
    path: '/classes/kids'
  },

  classesAdults: {
    title: 'Adult Martial Arts & Capoeira | Fountain Valley, CA',
    description:
      'Brazilian capoeira for teens and adults in Fountain Valley — a martial art blending ' +
      'movement, music, culture and fitness. All levels, no experience needed. First class free.',
    path: '/classes/adults'
  },

  schedule: {
    title: 'Class Schedule | ABADÁ-Capoeira OC Fountain Valley',
    description:
      'Capoeira class times in Fountain Valley, CA: Monday through Thursday evenings and ' +
      'Saturday mornings. See the full weekly schedule and book a free trial.',
    path: '/schedule'
  },

  gallery: {
    title: 'Photo & Video Gallery | ABADÁ-Capoeira OC',
    description:
      'Photos and video from classes, rodas, batizados, and performances at ABADÁ-Capoeira ' +
      'OC in Fountain Valley, California.',
    path: '/gallery'
  },

  events: {
    title: 'Events, Batizado & Performances | ABADÁ-Capoeira OC',
    description:
      'Upcoming batizados, workshops, and rodas at ABADÁ-Capoeira OC, plus Brazilian cultural ' +
      'performances for schools and events across Orange County.',
    path: '/events'
  },

  rental: {
    title: 'Event & Studio Space Rental | Fountain Valley, CA',
    description:
      'Rent our Fountain Valley studio for classes, workshops, rehearsals, and private events. ' +
      'Open floor space on Warner Ave. Contact us for rates and availability.',
    path: '/rental'
  },

  book: {
    title: 'Book a Free Trial Capoeira Class | Fountain Valley, CA',
    description:
      'Try capoeira free. Book a no-obligation trial class for kids or adults at ABADÁ-Capoeira ' +
      'OC in Fountain Valley, CA. No experience or equipment required.',
    path: '/book'
  },

  contact: {
    title: 'Contact & Location | ABADÁ-Capoeira OC',
    description:
      'ABADÁ-Capoeira OC is at 8552 Warner Ave, Fountain Valley, CA 92708. ' +
      'Call (562) 340-9801 or email capoeiraoc@gmail.com with any questions.',
    path: '/contact'
  },

  waiver: {
    title: 'Liability Waiver | ABADÁ-Capoeira OC',
    description: 'Participation waiver for ABADÁ-Capoeira OC students.',
    path: '/waiver',
    noIndex: true
  },

  privacy: {
    title: 'Privacy Policy | ABADÁ-Capoeira OC',
    description: 'What ABADÁ-Capoeira OC collects through this website, why, and who else sees it.',
    path: '/privacy'
  }
};

/**
 * `/about/:page` is one route serving several topics, so its metadata is resolved
 * at runtime from the URL parameter rather than from route config.
 */
export const ABOUT_SEO: Record<string, PageSeo> = {
  capoeira: {
    title: 'What is Capoeira? | ABADÁ-Capoeira OC',
    description:
      'Capoeira is an Afro-Brazilian martial art blending self-defense, acrobatics, dance, and ' +
      'live music, developed in Brazil over 500 years ago. Learn how the game works.',
    path: '/about/capoeira'
  },
  'cord-system': {
    title: 'The ABADÁ-Capoeira Cord System | Ranks Explained',
    description:
      'How ranking works in ABADÁ-Capoeira: what each cord color means, how students advance, ' +
      'and what happens at a batizado ceremony.',
    path: '/about/cord-system'
  },
  maculele: {
    title: 'Maculelê | Afro-Brazilian Stick Dance',
    description:
      'Maculelê is an Afro-Brazilian dance performed with sticks to percussion and song. ' +
      'Learn its history and how we teach it at ABADÁ-Capoeira OC.',
    path: '/about/maculele'
  },
  'samba-de-roda': {
    title: 'Samba de Roda | Traditional Brazilian Circle Dance',
    description:
      'Samba de Roda is a traditional Brazilian circle dance from Bahia, closely tied to ' +
      'capoeira. Learn its history and rhythms at ABADÁ-Capoeira OC.',
    path: '/about/samba-de-roda'
  },
  'professor-mosquito': {
    title: 'Professor Mosquito | Head Instructor, ABADÁ-Capoeira OC',
    description:
      'Meet Professor Mosquito, head instructor at ABADÁ-Capoeira OC in Fountain Valley, ' +
      'California, and learn about his training and teaching.',
    path: '/about/professor-mosquito'
  },
  'mestre-camisa': {
    title: 'Mestre Camisa | Founder of ABADÁ-Capoeira',
    description:
      'Mestre Camisa founded ABADÁ-Capoeira in 1988, now one of the largest capoeira ' +
      'organizations in the world. Learn about his life and legacy.',
    path: '/about/mestre-camisa'
  },
  'mestra-cigarra': {
    title: 'Mestra Cigarra | ABADÁ-Capoeira',
    description:
      'Learn about Mestra Cigarra and her contributions to ABADÁ-Capoeira and to women ' +
      'in capoeira worldwide.',
    path: '/about/mestra-cigarra'
  }
};
