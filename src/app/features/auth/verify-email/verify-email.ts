import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

// Constants (SonarQube: no magic numbers/strings)
const RESEND_COOLDOWN_SECONDS = 60;
const VERIFICATION_CHECK_INTERVAL_MS = 3000;
const MAX_VERIFICATION_ATTEMPTS = 10;

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.html',
  styleUrls: ['./verify-email.css'],
})
export class VerifyEmail implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private verificationIntervalId: number | null = null;

  // Signals for reactive state
  protected readonly email = signal<string>('');
  protected readonly isVerified = signal<boolean>(false);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly isCheckingStatus = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly successMessage = signal<string>('');
  protected readonly cooldownSeconds = signal<number>(0);
  protected readonly isCooldownActive = signal<boolean>(false);
  private cooldownIntervalId: number | null = null;

  public ngOnInit(): void {
    this.loadUserEmail();
    this.startVerificationCheck();
  }

  public ngOnDestroy(): void {
    this.clearIntervals();
  }

  /**
   * Loads the current user's email from auth service
   */
  private loadUserEmail(): void {
    const currentUser = this.authService.currentUser();

    if (currentUser?.email) {
      this.email.set(currentUser.email);
      this.isVerified.set(currentUser.emailVerified);

      // If already verified, set success message
      if (currentUser.emailVerified) {
        this.successMessage.set('Your email is already verified!');
      }
    } else {
      this.errorMessage.set('No user found. Please login again.');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    }
  }

  /**
   * Starts periodic check for email verification
   */
  private startVerificationCheck(): void {
    let attempts = 0;

    this.verificationIntervalId = window.setInterval(async () => {
      attempts++;

      if (attempts > MAX_VERIFICATION_ATTEMPTS) {
        this.clearVerificationInterval();
        return;
      }

      await this.refreshVerificationStatus();

      if (this.isVerified()) {
        this.clearVerificationInterval();
        this.successMessage.set('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    }, VERIFICATION_CHECK_INTERVAL_MS);
  }

  /**
   * Refreshes the user's email verification status from Firebase
   */
  private async refreshVerificationStatus(): Promise<void> {
    try {
      const currentUser = this.authService.currentUser();
      if (currentUser) {
        await currentUser.reload();
        this.isVerified.set(currentUser.emailVerified);
      }
    } catch (error) {
      console.error('Failed to refresh verification status:', error);
    }
  }

  /**
   * Manually checks verification status
   */
  protected async checkVerificationStatus(): Promise<void> {
    this.isCheckingStatus.set(true);
    this.errorMessage.set('');

    try {
      await this.refreshVerificationStatus();

      if (this.isVerified()) {
        this.successMessage.set('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      } else {
        this.errorMessage.set(
          'Email not verified yet. Please check your inbox or resend the verification email (check spam)',
        );
      }
    } catch (error) {
      this.errorMessage.set('Failed to check verification status. Please try again.');
      console.error('Verification check error:', error);
    } finally {
      this.isCheckingStatus.set(false);
    }
  }

  /**
   * Resends verification email with cooldown
   */
  protected async resendVerificationEmail(): Promise<void> {
    if (this.isCooldownActive()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const currentUser = this.authService.currentUser();

      if (!currentUser) {
        this.errorMessage.set('No user found. Please login again.');
        this.router.navigate(['/login']);
        return;
      }

      await this.authService.resendVerificationEmail();
      this.successMessage.set('Verification email sent! Please check your inbox (check the spam )');
      this.startCooldown();
    } catch (error) {
      this.errorMessage.set('Failed to send verification email. Please try again.');
      console.error('Resend verification error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Starts cooldown timer for resend button
   */
  private startCooldown(): void {
    this.isCooldownActive.set(true);
    this.cooldownSeconds.set(RESEND_COOLDOWN_SECONDS);

    this.cooldownIntervalId = window.setInterval(() => {
      const currentSeconds = this.cooldownSeconds();

      if (currentSeconds <= 1) {
        this.clearCooldownInterval();
        this.isCooldownActive.set(false);
        this.cooldownSeconds.set(0);
      } else {
        this.cooldownSeconds.set(currentSeconds - 1);
      }
    }, 1000);
  }

  /**
   * Navigates to login page
   */
  protected navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Clears all intervals
   */
  private clearIntervals(): void {
    this.clearVerificationInterval();
    this.clearCooldownInterval();
  }

  /**
   * Clears verification check interval
   */
  private clearVerificationInterval(): void {
    if (this.verificationIntervalId !== null) {
      clearInterval(this.verificationIntervalId);
      this.verificationIntervalId = null;
    }
  }

  /**
   * Clears cooldown interval
   */
  private clearCooldownInterval(): void {
    if (this.cooldownIntervalId !== null) {
      clearInterval(this.cooldownIntervalId);
      this.cooldownIntervalId = null;
    }
  }
}
