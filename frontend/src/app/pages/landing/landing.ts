import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing implements OnInit {

  fonctionnalites = [
    {
      image: '/images/contribuable.jpg',
      titre: 'Gestion des Contribuables',
      description: 'Enregistrez et gérez facilement tous vos contribuables, particuliers et entreprises.'
    },
    {
      image: '/images/notification.jpg',
      titre: 'Notifications Automatiques',
      description: 'Recevez des alertes en temps réel pour vos échéances et mises à jour fiscales.'
    },
    {
      image: '/images/declaration.jpg',
      titre: 'Déclarations Fiscales',
      description: 'Gérez les déclarations fiscales de chaque contribuable efficacement avec une notification.'
    },
    {
      image: '/images/money.jpg',
      titre: 'Paiements',
      description: 'Enregistrez les paiements et mettez à jour automatiquement les statuts des impôts.'
    },
    {
      image: '/images/penalite.jpg',
      titre: 'Pénalités',
      description: 'Gérez les pénalités de retard et suivez leur statut de paiement.'
    },
    {
      image: '/images/statistique et rapport.jpg',
      titre: 'Rapports & Statistiques',
      description: 'Visualisez les revenus fiscaux mensuels avec des graphiques interactifs.'
    }
  ];

  statistiques = [
    { valeur: '1,450+', label: 'Contributions' },
    { valeur: '12M+', label: 'FCFA Collectés' },
    { valeur: '98%', label: 'Taux de Satisfaction' },
    { valeur: '24/7', label: 'Disponibilité' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    setTimeout(() => {
      const laptopContainer = document.getElementById('laptop-container');
      if (laptopContainer) laptopContainer.classList.add('assembled');
    }, 300);

    window.addEventListener('scroll', () => {
      const nav = document.getElementById('main-nav');
      if (nav) {
        if (window.scrollY > 50) {
          nav.style.background = 'rgba(255,255,255,0.9)';
          nav.style.boxShadow = '0 1px 10px rgba(0,0,0,0.1)';
        } else {
          nav.style.background = 'rgba(255,255,255,0.8)';
          nav.style.boxShadow = 'none';
        }
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}