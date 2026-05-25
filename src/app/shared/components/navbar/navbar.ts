import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl:'./navbar.html' ,
  styleUrls:['./navbar.css'] ,
  
})
export class Navbar {
  authService = inject(AuthService);
  private router = inject(Router);
  cartCount = 0; 

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }
}
