import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { NavigationData, MenuItem } from '../../../core/models/navigation.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  private dataService = inject(DataService);
  private router = inject(Router);

  navigationData = signal<NavigationData | null>(null);
  isMobileMenuOpen = signal(false);
  activeDropdown = signal<string | null>(null);

  ngOnInit() {
    this.dataService.getNavigationData().subscribe(data => {
      this.navigationData.set(data);
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(value => !value);
    if (!this.isMobileMenuOpen()) {
      this.activeDropdown.set(null);
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
    this.activeDropdown.set(null);
  }

  toggleDropdown(itemId: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.activeDropdown() === itemId) {
      this.activeDropdown.set(null);
    } else {
      this.activeDropdown.set(itemId);
    }
  }

  isDropdownOpen(itemId: string): boolean {
    return this.activeDropdown() === itemId;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeMobileMenu();
  }

  onMouseEnter(item: MenuItem) {
    if (item.hasDropdown && window.innerWidth > 768) {
      this.activeDropdown.set(item.id);
    }
  }

  onMouseLeave(item: MenuItem) {
    if (item.hasDropdown && window.innerWidth > 768) {
      this.activeDropdown.set(null);
    }
  }
}
