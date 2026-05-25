import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class login {
  authService = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  rememberMe = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);

  protected async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.isLoading.set(true);

    const result = await this.authService.login(this.email(), this.password());

    if (result.success) {
      const currentUser = this.authService.currentUser();

      // Check if email is verified
      if (currentUser && !currentUser.emailVerified) {
        this.authService.logout();
        this.authService.setPendingVerificationEmail(this.email());
        this.router.navigate(['/verify-email']);
        return;
      }

      this.successMessage.set('Login successful! Redirecting...');
      setTimeout(() => {
        this.router.navigate(['/products']);
      }, 1500);
    } else {
      this.errorMessage.set(result.error ?? 'Login failed');
    }

    this.isLoading.set(false);
  }

  async googleSignIn(): Promise<void> {
    const result = await this.authService.signInWithGoogle();

    if (result.success) {
      this.successMessage.set('Google sign in successful!');
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1500);
    } else {
      this.errorMessage.set(result.error || 'Google sign in failed');
    }
  }
}
