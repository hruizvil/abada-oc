export interface HomeContent {
  hero: HeroSection;
  whatIsCapoeira: WhatIsCapoeira;
  benefits: Benefit[];
  classes: Classes;
  whyAbada: WhyAbada;
  callToAction: CallToAction;
}

export interface HeroSection {
  announcement?: string;
  title: string;
  subtitle?: string;
  description: string;
  ctaButtons: CtaButton[];
}

export interface CtaButton {
  text: string;
  route: string;
  type: 'primary' | 'secondary';
}

export interface WhatIsCapoeira {
  title: string;
  description: string;
  highlights: string[];
}

export interface Benefit {
  id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

export interface Classes {
  title: string;
  description: string;
  ageGroups: AgeGroup[];
}

export interface AgeGroup {
  name: string;
  description: string;
  icon: string;
}

export interface WhyAbada {
  title: string;
  subtitle: string;
  description: string;
  stats: Stat[];
}

export interface Stat {
  value: string;
  label: string;
}

export interface CallToAction {
  title: string;
  description: string;
  buttonText: string;
  buttonRoute: string;
  secondaryText: string;
}
