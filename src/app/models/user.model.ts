export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'seller';
  createdAt: Date;
  updatedAt: Date;
}
