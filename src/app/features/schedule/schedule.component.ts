import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
  private dataService = inject(DataService);
  scheduleData = signal<any>(null);

  ngOnInit() {
    this.dataService.getSchedule().subscribe(data => {
      this.scheduleData.set(data);
    });
  }
}
