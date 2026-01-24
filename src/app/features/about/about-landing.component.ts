import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="about-landing">
      <section class="about-hero">
        <div class="container">
          <h1>ABOUT US</h1>
          <p>Learn about the art of Capoeira and our community</p>
        </div>
      </section>

      <section class="about-nav-section">
        <div class="container">
          <nav class="about-nav">
            @for (item of aboutLinks; track item.id) {
              <a [routerLink]="item.route" class="about-nav-card">
                <h2>{{ item.label }}</h2>
                <p>{{ item.description }}</p>
                <span class="arrow">→</span>
              </a>
            }
          </nav>
        </div>
      </section>
    </div>
  `,
  styles: [`
    @import '../../../assets/styles/variables';

    .about-landing {
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .about-hero {
      background: linear-gradient(135deg, #0066cc 0%, #004d99 100%);
      color: white;
      padding: 3rem 0;
      text-align: center;

      h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }

      p {
        font-size: 1.125rem;
        opacity: 0.9;
      }
    }

    .about-nav-section {
      padding: 3rem 0;
      background: #f8f9fa;
    }

    .about-nav {
      display: grid;
      gap: 1rem;

      @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .about-nav-card {
      display: block;
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      transition: all 0.2s ease;
      position: relative;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);

        .arrow {
          transform: translateX(4px);
        }
      }

      h2 {
        font-size: 1.25rem;
        color: #1a1a2e;
        margin: 0 0 0.5rem;
      }

      p {
        font-size: 0.9375rem;
        color: #666;
        margin: 0;
        line-height: 1.5;
      }

      .arrow {
        position: absolute;
        top: 1.5rem;
        right: 1.5rem;
        color: #0066cc;
        font-size: 1.25rem;
        transition: transform 0.2s ease;
      }
    }
  `]
})
export class AboutLandingComponent {
  aboutLinks = [
    {
      id: 'capoeira',
      label: 'CAPOEIRA',
      description: 'Learn about the history and art of Capoeira',
      route: '/about/capoeira'
    },
    {
      id: 'mestre-camisa',
      label: 'MESTRE CAMISA',
      description: 'Founder of ABADÁ-Capoeira',
      route: '/about/mestre-camisa'
    },
    {
      id: 'mestra-cigarra',
      label: 'MESTRA MARCIA CIGARRA',
      description: 'Founder of ABADÁ-Capoeira San Francisco',
      route: '/about/mestra-cigarra'
    },
    {
      id: 'professor-mosquito',
      label: 'PROFESSOR MOSQUITO',
      description: 'Lead Instructor at ABADÁ-Capoeira OC',
      route: '/about/professor-mosquito'
    },
    {
      id: 'cord-system',
      label: 'CORD SYSTEM',
      description: 'The graduation system in Capoeira',
      route: '/about/cord-system'
    },
    {
      id: 'maculele',
      label: 'MACULELÊ',
      description: 'Traditional Afro-Brazilian cultural dance',
      route: '/about/maculele'
    },
    {
      id: 'samba-de-roda',
      label: 'SAMBA DE RODA',
      description: 'The original form of samba',
      route: '/about/samba-de-roda'
    }
  ];
}
