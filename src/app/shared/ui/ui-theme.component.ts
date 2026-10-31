import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Loads the shared signed-in page styles once per shell (admin or member) instead of a copy in
 * every page. Unencapsulated on purpose; every rule is scoped under .app-ui, the shell's content area.
 */
@Component({
  selector: 'app-ui-theme',
  standalone: true,
  template: '',
  styleUrls: ['./ui-sections.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiThemeComponent {}
