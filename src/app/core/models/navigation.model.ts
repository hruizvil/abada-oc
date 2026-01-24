export interface NavigationData {
  brand: Brand;
  mainMenu: MenuItem[];
  contactInfo?: ContactInfo;
  socialLinks?: SocialLink[];
}

export interface Brand {
  name: string;
  tagline: string;
  logo?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
  order: number;
  hasDropdown?: boolean;
  children?: MenuChild[];
}

export interface MenuChild {
  id: string;
  label: string;
  route: string;
  order: number;
}

export interface ContactInfo {
  phone: string;
  email: string;
  hours: string;
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  icon: string;
}
