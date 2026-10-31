import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'search' | 'tick' | 'info' | 'phone' | 'ext' | 'chevL' | 'chevR'
  | 'cal' | 'doc' | 'star' | 'sheet' | 'folder' | 'card' | 'db' | 'globe'
  | 'home' | 'clock' | 'user' | 'pin';

/** Line icons for the signed-in app (inherits size from CSS, colour from currentColor). */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:inline-flex;flex:0 0 auto;width:16px;height:16px}svg{width:100%;height:100%;display:block}'],
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (name()) {
        @case ('search') { <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/> }
        @case ('tick') { <path d="M5 12.5 10 17 19 7"/> }
        @case ('info') { <circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/> }
        @case ('phone') { <rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17h2"/> }
        @case ('ext') { <path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/> }
        @case ('chevL') { <path d="m15 6-6 6 6 6"/> }
        @case ('chevR') { <path d="m9 6 6 6-6 6"/> }
        @case ('cal') { <rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/> }
        @case ('doc') { <rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6"/> }
        @case ('star') { <path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/> }
        @case ('sheet') { <rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/> }
        @case ('folder') { <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/> }
        @case ('card') { <rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18"/> }
        @case ('db') { <ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/> }
        @case ('home') { <path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/> }
        @case ('clock') { <circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/> }
        @case ('user') { <circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/> }
        @case ('pin') { <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/> }
        @case ('globe') { <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/> }
      }
    </svg>
  `
})
export class IconComponent {
  readonly name = input.required<IconName>();
}
