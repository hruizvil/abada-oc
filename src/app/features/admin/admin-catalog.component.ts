import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from './admin.service';
import { AdminDirectoryService } from './admin-directory.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { CardProduct } from '../member/member.model';

type Mode = 'none' | 'add' | 'edit';

/** Catalog: the class cards members can buy, as pricing cards; create / edit / delete (admin writes). */
@Component({
  selector: 'app-admin-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './admin-catalog.component.html',
  styleUrls: ['./admin-catalog.component.scss']
})
export class AdminCatalogComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly dir = inject(AdminDirectoryService);

  protected readonly products = signal<CardProduct[] | null>(null);
  protected readonly mode = signal<Mode>('none');
  protected readonly editId = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Mutable draft bound to the form via ngModel. */
  protected model: CardProduct = this.blank();

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.products.set(await this.admin.listCatalog());
  }

  private blank(): CardProduct {
    return {
      id: '', label: '', kind: 'classes', credits: 4, validityMonths: 2,
      priceUsd: 0, visibility: 'public', active: true, sortOrder: 0
    };
  }

  startAdd(): void {
    this.error.set(null);
    this.model = this.blank();
    this.editId.set(null);
    this.mode.set('add');
  }

  startEdit(p: CardProduct): void {
    this.error.set(null);
    this.model = { ...this.blank(), ...p };
    this.editId.set(p.id);
    this.mode.set('edit');
  }

  cancel(): void {
    this.mode.set('none');
    this.editId.set(null);
  }

  /** "$28 / class" for a classes pack, "gift" for a gift credit. */
  perClass(p: CardProduct): string {
    if (p.kind === 'gift') return 'gift';
    if (!p.credits) return '';
    return '$' + (p.priceUsd / p.credits).toFixed(2).replace(/\.00$/, '') + ' / class';
  }

  /** The corner tag: the one thing most worth knowing about this product. */
  tag(p: CardProduct): { text: string; cls: string } | null {
    if (!p.active) return { text: 'Inactive', cls: 'grey' };
    if (!p.stripePriceId) return { text: 'Not on sale yet', cls: 'warn' };
    if (p.highlight) return { text: 'Best value', cls: '' };
    if (p.visibility === 'private') return { text: 'Private link', cls: 'grey' };
    if (p.oncePerAccount) return { text: 'Once per account', cls: 'grey' };
    return null;
  }

  features(p: CardProduct): string[] {
    const months = `Valid ${p.validityMonths} ${p.validityMonths === 1 ? 'month' : 'months'}`;
    if (p.kind === 'gift') {
      return [`$${p.valueUsd ?? p.priceUsd} toward any card`, months, p.visibility === 'private' ? 'Shared by link, not in the store' : 'Shown in the store'];
    }
    const out = [`${p.credits ?? 0} classes`, months];
    if (p.shared) out.push('Shared by a family');
    if (p.oncePerAccount) out.push('One per account');
    if (p.visibility === 'private') out.push('Sold by link, not in the store');
    return out;
  }

  /** Members holding an active card of this product. */
  holders(p: CardProduct): number {
    const now = Date.now();
    const uids = new Set(
      this.dir
        .cards()
        .filter((c) => c.model === p.id && (c.creditsRemaining ?? 0) > 0 && (c.expiresAt?.toDate?.().getTime() ?? Infinity) > now)
        .map((c) => c.memberUid)
    );
    return uids.size;
  }

  async save(): Promise<void> {
    const m = this.model;
    if (!m.id.trim() || !m.label.trim()) {
      this.error.set('ID and label are required.');
      return;
    }
    const product: CardProduct = { ...m, id: m.id.trim() };
    // Keep each kind's fields clean.
    if (product.kind === 'gift') {
      delete product.credits;
      delete product.oncePerAccount;
      delete product.shared;
    } else {
      delete product.valueUsd;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.admin.saveProduct(product);
      await this.load();
      this.cancel();
    } catch {
      this.error.set('Could not save. Check your connection and try again.');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(p: CardProduct): Promise<void> {
    if (!confirm(`Delete "${p.label}" (${p.id})? This can't be undone.`)) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.admin.deleteProduct(p.id);
      await this.load();
      if (this.editId() === p.id) this.cancel();
    } catch {
      this.error.set('Could not delete. Try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
