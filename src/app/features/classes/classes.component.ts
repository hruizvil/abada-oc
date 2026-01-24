import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.scss']
})
export class ClassesComponent implements OnInit {
  private dataService = inject(DataService);
  kidsProgram = signal<any>(null);
  schedule = signal<any>(null);

  ngOnInit() {
    this.dataService.getKidsProgram().subscribe(data => {
      this.kidsProgram.set(data);
    });
    this.dataService.getSchedule().subscribe(data => {
      this.schedule.set(data);
    });
  }
}
