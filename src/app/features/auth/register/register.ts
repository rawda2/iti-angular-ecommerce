import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals for reactive state
  protected readonly displayName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly acceptTerms = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly isLoading = signal(false);

  /**
   * Handles registration form submission
   */
  protected async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validation checks
    if (!this.validateForm()) {
      return;
    }

    this.isLoading.set(true);

    const result = await this.authService.register({
      email: this.email(),
      password: this.password(),
      displayName: this.displayName(),
    });

    if (result.success) {
      // Store email for confirm page
      this.authService.setPendingVerificationEmail(this.email());

      // Navigate to confirm email page
      this.router.navigate(['/verify-email'], {
        state: { email: this.email() },
      });
    } else {
      this.errorMessage.set(result.error ?? 'Registration failed');
    }

    this.isLoading.set(false);
  }

  /**
   * Validates all form fields
   * @returns true if form is valid
   */
  private validateForm(): boolean {
    if (!this.displayName()) {
      this.errorMessage.set('Please enter your full name');
      return false;
    }

    if (!this.email()) {
      this.errorMessage.set('Please enter your email address');
      return false;
    }

    if (this.password().length < 6) {
      this.errorMessage.set('Password must be at least 6 characters');
      return false;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match');
      return false;
    }

    if (!this.acceptTerms()) {
      this.errorMessage.set('You must accept the terms and conditions');
      return false;
    }

    return true;
  }

  /**
   * Google Sign In
   */
  protected async googleSignIn(): Promise<void> {
    this.isLoading.set(true);
    const result = await this.authService.signInWithGoogle();

    if (result.success) {
      this.router.navigate(['/products']);
    } else {
      this.errorMessage.set(result.error ?? 'Google sign in failed');
    }
    this.isLoading.set(false);
  }
}
