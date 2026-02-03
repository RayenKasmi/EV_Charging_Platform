import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { PreloadSelectedModulesStrategy } from './core/utils/preload-selected-modules.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ 
      eventCoalescing: true, // batches dom events into a single change detection cycle
      runCoalescing: true  
      // batches multiple async operations into a single change detection cycle (calls to ngZone.run())
    }),
    provideRouter(routes, withPreloading(PreloadSelectedModulesStrategy)),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};