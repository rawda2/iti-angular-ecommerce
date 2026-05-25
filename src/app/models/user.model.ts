export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin' | 'seller';
  createdAt: Date;
  emailVerified: boolean;
  phoneNumber?: string;
  address?: Address[];
}

export interface Address {
  id: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  displayName: string;
}