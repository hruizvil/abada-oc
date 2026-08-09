import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Song {
  id: string;
  title: string;
  type: 'ladainha' | 'corrido' | 'quadra' | 'toque';
  group: string;
  youtubeId: string;
  lyrics: string;
  description: string;
  tags: string[];
}

@Component({
  selector: 'app-musica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './musica.component.html',
  styleUrls: ['./musica.component.scss']
})
export class MusicaComponent implements OnInit {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  songs = signal<Song[]>([]);
  filteredSongs = signal<Song[]>([]);
  activeFilter = signal('all');
  selectedSong = signal<Song | null>(null);
  modalOpen = signal(false);
  safeEmbedUrl = signal<SafeResourceUrl | null>(null);

  readonly filters = [
    { label: 'All', value: 'all' },
    { label: 'Ladainha', value: 'ladainha' },
    { label: 'Corrido', value: 'corrido' },
    { label: 'Quadra', value: 'quadra' },
    { label: 'Toque', value: 'toque' }
  ];

  readonly typeLabels: Record<string, string> = {
    ladainha: 'Ladainha',
    corrido: 'Corrido',
    quadra: 'Quadra',
    toque: 'Toque'
  };

  ngOnInit() {
    this.http.get<Song[]>('assets/data/songs.json').subscribe(data => {
      this.songs.set(data);
      this.filteredSongs.set(data);
    });
  }

  filterBy(type: string) {
    this.activeFilter.set(type);
    this.filteredSongs.set(
      type === 'all' ? this.songs() : this.songs().filter(s => s.type === type)
    );
  }

  thumbnailUrl(youtubeId: string): string {
    return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
  }

  openModal(song: Song) {
    this.safeEmbedUrl.set(
      this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${song.youtubeId}?rel=0`
      )
    );
    this.selectedSong.set(song);
    this.modalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modalOpen.set(false);
    this.selectedSong.set(null);
    document.body.style.overflow = '';
  }
}
