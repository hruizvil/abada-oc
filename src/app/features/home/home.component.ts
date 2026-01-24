import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../core/services/data.service';
import { HomeContent } from '../../core/models/content.model';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private dataService = inject(DataService);

  content = signal<HomeContent | null>(null);

  ngOnInit() {
    this.dataService.getHomeContent().subscribe(data => {
      this.content.set(data);
    });
  }
}
