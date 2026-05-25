import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  user,
  User as FirebaseUser,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { User, RegistrationData } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);

  // Modern Angular signals for reactive state
  readonly currentUser = signal<FirebaseUser | null>(null);
  readonly userData = signal<User | null>(null);
  readonly loading = signal<boolean>(false);

  // Pending verification email
  private readonly pendingVerificationEmail = signal<string | null>(null);

  constructor() {
    // Listen to auth state changes
    user(this.auth).subscribe(async (firebaseUser) => {
      this.currentUser.set(firebaseUser);

      if (firebaseUser) {
        await this.loadUserData(firebaseUser.uid);
      } else {
        this.userData.set(null);
      }
    });
  }

  /**
   * Loads user data from Firestore
   * @param uid - User ID
   */
  async loadUserData(uid: string): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      this.userData.set(userDoc.data() as User);
    }
  }

  /**
   * Sets email for pending verification
   * @param email - Email address to verify
   */
  setPendingVerificationEmail(email: string): void {
    this.pendingVerificationEmail.set(email);
  }

  /**
   * Gets pending verification email
   * @returns Email address or null
   */
  getPendingVerificationEmail(): string | null {
    return this.pendingVerificationEmail();
  }

  /**
   * Clears pending verification email
   */
  clearPendingVerificationEmail(): void {
    this.pendingVerificationEmail.set(null);
  }

  /**
   * Registers a new user
   * @param userData - Registration data
   * @returns Result with success flag and optional error
   */
  async register(userData: RegistrationData): Promise<{ success: boolean; error?: string }> {
    this.loading.set(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password,
      );

      const user = userCredential.user;
      await updateProfile(user, { displayName: userData.displayName });

      const userDoc: User = {
        uid: user.uid,
        email: user.email!,
        displayName: userData.displayName,
        role: 'user',
        createdAt: new Date(),
        emailVerified: user.emailVerified,
      };

      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, userDoc);

      // Send email verification
      await sendEmailVerification(user);

      // Store email for pending verification
      this.setPendingVerificationEmail(userData.email);

      this.loading.set(false);
      return { success: true };
    } catch (error: any) {
      this.loading.set(false);
      let errorMessage = 'Registration failed';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already registered';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password too weak (minimum 6 characters)';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Logs in user with email and password
   * @param email - User email
   * @param password - User password
   * @returns Result with success flag and optional error
   */
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.loading.set(true);

    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);

      const userDocRef = doc(this.firestore, `users/${userCredential.user.uid}`);
      await updateDoc(userDocRef, { lastLogin: serverTimestamp() });

      this.loading.set(false);
      return { success: true };
    } catch (error: any) {
      this.loading.set(false);
      let errorMessage = 'Login failed';

      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Account disabled';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Try again later';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Signs in with Google popup
   * @returns Result with success flag and optional error
   */
  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    this.loading.set(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      // Check if user document exists, create if not
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const userData: User = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'User',
          photoURL: user.photoURL || undefined,
          role: 'user',
          createdAt: new Date(),
          emailVerified: user.emailVerified,
        };
        await setDoc(userDocRef, userData);
      }

      this.loading.set(false);
      return { success: true };
    } catch (error: any) {
      this.loading.set(false);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sends password reset email
   * @param email - User email
   * @returns Result with success flag and optional error
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    this.loading.set(true);

    try {
      await sendPasswordResetEmail(this.auth, email);
      this.loading.set(false);
      return { success: true };
    } catch (error: any) {
      this.loading.set(false);
      let errorMessage = 'Failed to send reset email';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Resends verification email to current user
   * @returns Result with success flag and optional error
   */
  async resendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
    this.loading.set(true);

    try {
      const currentUser = this.currentUser();

      if (!currentUser) {
        return { success: false, error: 'No user logged in' };
      }

      if (currentUser.emailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      await sendEmailVerification(currentUser);
      this.loading.set(false);
      return { success: true };
    } catch (error: any) {
      this.loading.set(false);
      let errorMessage = 'Failed to send verification email';

      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Resends verification email to specific email address
   * @param email - Email address to send verification to
   * @returns Result with success flag and optional error
   */
  async resendVerificationToEmail(email: string): Promise<{ success: boolean; error?: string }> {
    this.loading.set(true);

    try {
      const currentUser = this.currentUser();

      if (currentUser && currentUser.email === email) {
        if (currentUser.emailVerified) {
          return { success: false, error: 'Email already verified' };
        }
        await sendEmailVerification(currentUser);
        this.loading.set(false);
        return { success: true };
      } else {
        // Store email for pending verification
        this.setPendingVerificationEmail(email);

        // Try to sign in briefly to send verification (requires password)
        // Alternative: Show message to login first
        return {
          success: false,
          error: 'Please login first to resend verification email',
        };
      }
    } catch (error: any) {
      this.loading.set(false);
      let errorMessage = 'Failed to send verification email';

      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Logs out current user
   */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.clearPendingVerificationEmail();
    this.router.navigate(['/login']);
  }

  /**
   * Checks if user is logged in
   * @returns True if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  /**
   * Gets current user role
   * @returns User role or 'user' as default
   */
  getUserRole(): string {
    return this.userData()?.role ?? 'user';
  }

  /**
   * Checks if user is admin
   * @returns True if user has admin role
   */
  isAdmin(): boolean {
    return this.userData()?.role === 'admin';
  }

  /**
   * Checks if email is verified
   * @returns True if current user's email is verified
   */
  isEmailVerified(): boolean {
    return this.currentUser()?.emailVerified ?? false;
  }

  /**
   * Refreshes current user data from Firebase
   */
  async refreshCurrentUser(): Promise<void> {
    const currentUser = this.currentUser();
    if (currentUser) {
      await currentUser.reload();
      this.currentUser.set(currentUser);
      await this.loadUserData(currentUser.uid);
    }
  }
}
