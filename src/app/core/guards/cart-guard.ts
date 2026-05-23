import { CanActivateFn } from '@angular/router';

export const cartGuard: CanActivateFn = (route, state) => {
  return true;
};
