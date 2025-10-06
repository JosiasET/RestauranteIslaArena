import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit, OnDestroy {
  images = [
    'img/img1.jpg',
    'img/img2.jpg',
    'img/img3.jpg',
    'img/img4.jpg'
  ];

  texts = [
    'Lo mejor de la isla en un solo lugar para disfrutar',
    'Ven y disfruta de nuestras deliciosas comidas',
    'El mejor ambiente para compartir con amigos',
    'Sabores que te transportan al paraíso'
  ];

  currentIndex = 0;
  private intervalId: any;

  ngOnInit() {
    // Iniciar el carrusel inmediatamente
    this.startCarousel();
<<<<<<< HEAD

    // Asegurar que la primera imagen sea visible al inicio
    setTimeout(() => {
      this.showCurrentImage();
    }, 100);
=======
    
    // Asegurar que la primera imagen sea visible al inicio
    setTimeout(() => {
      this.showCurrentImage();
    }, 4000);
>>>>>>> 1c9e0904ed322a08b83be5fe7f2f322423d65076
  }

  ngOnDestroy() {
    this.stopCarousel();
  }

  private startCarousel() {
    this.stopCarousel();
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 2000);
  }

  private stopCarousel() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private showCurrentImage() {
    // Forzar la visualización de la imagen actual
    const images = document.querySelectorAll('.carousel-image');
    images.forEach((img, index) => {
      if (index === this.currentIndex) {
        img.classList.add('active');
      } else {
        img.classList.remove('active');
      }
    });
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.showCurrentImage();
    this.restartCarousel();
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.showCurrentImage();
    this.restartCarousel();
  }

  goToSlide(index: number) {
    this.currentIndex = index;
    this.showCurrentImage();
    this.restartCarousel();
  }

  private restartCarousel() {
    this.stopCarousel();
    this.startCarousel();
  }
}
