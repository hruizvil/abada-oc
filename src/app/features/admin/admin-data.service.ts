import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AdminData } from './admin-data.model';
import { environment } from '../../../environments/environment';

type FetchResult = { ok: boolean; data?: AdminData; error?: string };

/**
 * Loads the aggregated admin dashboard payload from the Command Center web app. Apps Script
 * can't do CORS, so — like checkout/check-in — we POST the Firebase ID token into a hidden
 * iframe and the script postMessages the data back. Fetched once and cached; sections read
 * slices of the same payload.
 */
@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private readonly auth = inject(AuthService);

  private readonly _data = signal<AdminData | null>(null);
  private readonly _error = signal<string | null>(null);
  private readonly _loading = signal(false);
  readonly data = this._data.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loading = this._loading.asReadonly();

  private loaded = false;

  /** Load the payload (once). Pass force to refetch. No-op on the server / when signed out. */
  async load(force = false): Promise<void> {
    if (typeof document === 'undefined') return;
    if (this._loading() || (this.loaded && !force)) return;
    const user = this.auth.user();
    if (!user) return;

    this._loading.set(true);
    this._error.set(null);
    try {
      const token = await user.getIdToken();
      const res = await this.fetch(token);
      if (res.ok && res.data) {
        this._data.set(res.data);
        this.loaded = true;
      } else if (res.error === 'auth') {
        this._error.set('Admin data isn’t connected yet — it needs a one-time authorization (see setup).');
      } else if (res.error === 'forbidden') {
        this._error.set('This account isn’t on the admin allow-list.');
      } else {
        this._error.set('Could not load admin data. Please try again.');
      }
    } catch {
      this._error.set('Could not load admin data. Please try again.');
    } finally {
      this._loading.set(false);
    }
  }

  private fetch(token: string): Promise<FetchResult> {
    return new Promise((resolve) => {
      const frame = document.createElement('iframe');
      frame.name = 'abada-admin-' + Date.now();
      frame.style.display = 'none';
      document.body.appendChild(frame);

      let settled = false;
      const cleanup = () => {
        window.removeEventListener('message', onMessage);
        clearTimeout(timer);
        frame.remove();
      };
      const onMessage = (ev: MessageEvent) => {
        const d = ev.data as { type?: string; ok?: boolean; data?: AdminData; error?: string } | null;
        if (!d || d.type !== 'abada-admin') return;
        settled = true;
        cleanup();
        resolve({ ok: !!d.ok, data: d.data, error: d.error });
      };
      const timer = setTimeout(() => {
        if (settled) return;
        cleanup();
        resolve({ ok: false, error: 'timeout' });
      }, 25000);
      window.addEventListener('message', onMessage);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = environment.adminDataUrl;
      form.target = frame.name;
      form.style.display = 'none';
      const field = (name: string, value: string) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };
      field('action', 'data');
      field('idToken', token);
      document.body.appendChild(form);
      form.submit();
      form.remove();
    });
  }
}
