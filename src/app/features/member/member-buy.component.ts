import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberStore } from './member-store.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { CardProduct } from './member.model';

/** Buy classes: class cards (Stripe checkout) and monthly memberships (set up in person). */
@Component({
  selector: 'app-member-buy',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './member-buy.component.html',
  styleUrls: ['./member-buy.component.scss']
})
export class MemberBuyComponent {
  protected readonly s = inject(MemberStore);
  protected readonly tab = signal<'cards' | 'memberships'>('cards');

  protected readonly memberships = [
    { name: '1× a week', price: 120 },
    { name: '2× a week', price: 160, popular: true },
    { name: 'Unlimited', price: 180 }
  ];

  protected tag(p: CardProduct): string {
    if (p.highlight) return 'Best value';
    if (p.oncePerAccount) return 'New students';
    if (p.shared) return 'Family';
    if (p.kind === 'gift') return 'Gift';
    return '';
  }

  protected perClass(p: CardProduct): string {
    if (p.kind === 'gift') return `$${p.valueUsd ?? p.priceUsd} of classes`;
    if (!p.credits) return '';
    return '$' + (p.priceUsd / p.credits).toFixed(2).replace(/\.00$/, '') + ' / class';
  }

  protected features(p: CardProduct): string[] {
    const months = `Valid ${p.validityMonths} ${p.validityMonths === 1 ? 'month' : 'months'}`;
    if (p.kind === 'gift') return [`$${p.valueUsd ?? p.priceUsd} toward any card`, months];
    const out = [`${p.credits ?? 0} classes`, months];
    if (p.oncePerAccount) out.push('One per account');
    if (p.shared) out.push('Shared by your family');
    out.push('Check in from your phone');
    return out;
  }
}
