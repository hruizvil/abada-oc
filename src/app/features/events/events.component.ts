import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent {
  // Event types for future use
  eventTypes = [
    { name: 'Batizados', description: 'Belt ceremonies and graduations' },
    { name: 'Workshops', description: 'Special training with guest instructors' },
    { name: 'Rodas', description: 'Open capoeira circles' },
    { name: 'Performances', description: 'Community events and shows' }
  ];
}
