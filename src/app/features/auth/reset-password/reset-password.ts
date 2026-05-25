import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

// Constants for validation (SonarQube: no magic strings)
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
})
export class ResetPassword {
  private readonly authService = inject(AuthService);

  // Using signals for reactive state (SonarQube: no direct property mutation)
  protected readonly email = signal<string>('');
  protected readonly errorMessage = signal<string>('');
  protected readonly successMessage = signal<string>('');
  protected readonly isLoading = signal<boolean>(false);

  /**
   * Validates email format
   * @returns true if email format is valid
   */
  private isValidEmail(email: string): boolean {
    if (!email || email.trim().length === 0) {
      return false;
    }
    return EMAIL_PATTERN.test(email);
  }

  /**
   * Handles password reset form submission
   */
  protected async onSubmit(): Promise<void> {
    // Reset previous messages
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validate email
    if (!this.isValidEmail(this.email())) {
      this.errorMessage.set('Please enter a valid email address');
      return;
    }

    this.isLoading.set(true);

    try {
      const result = await this.authService.resetPassword(this.email());

      if (result.success) {
        this.successMessage.set('Password reset email sent! Check your inbox.');
        this.email.set(''); // Clear email field on success
      } else {
        this.errorMessage.set(result.error ?? 'Failed to send reset email');
      }
    } catch (error) {
      this.errorMessage.set('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
