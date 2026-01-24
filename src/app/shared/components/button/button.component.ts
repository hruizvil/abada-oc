import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (link()) {
      <a
        [routerLink]="link()"
        [class]="'btn btn-' + variant() + ' btn-' + size()"
        [class.btn-full-width]="fullWidth()">
        {{ text() }}
      </a>
    } @else {
      <button
        [type]="type()"
        [class]="'btn btn-' + variant() + ' btn-' + size()"
        [class.btn-full-width]="fullWidth()"
        [disabled]="disabled()"
        (click)="clicked.emit()">
        {{ text() }}
      </button>
    }
  `,
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  text = input<string>('');
  variant = input<'primary' | 'secondary' | 'outline'>('primary');
  size = input<'small' | 'medium' | 'large'>('medium');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input(false);
  fullWidth = input(false);
  link = input<string>();

  clicked = output<void>();
}
