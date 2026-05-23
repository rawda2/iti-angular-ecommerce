import { Routes } from '@angular/router';
import { authGuard } from '../app/core/guards/auth-guard';
import { adminGuard } from '../app/core/guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../app/features/products/product-list/product-list').then((m) => m.ProductList),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/products/product-detail/product-detail').then((m) => m.ProductDetail),
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart-page/cart-page').then((m) => m.CartPage),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout-page/checkout-page').then((m) => m.CheckoutPage),
    canActivate: [authGuard],
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/order-list/order-list').then((m) => m.OrderList),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile-info/profile-info').then((m) => m.ProfileInfo),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [adminGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: '**',
    redirectTo: '',
      pathMatch: 'full', 
  },
];
