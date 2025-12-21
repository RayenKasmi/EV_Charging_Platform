import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
//import { AuthService } from '../services/auth.service';
/*
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
*/

/*
TODO:
The person tasked with configuring auth has to create the authservice in order for the interceptor to work
*/