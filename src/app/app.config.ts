import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { authInterceptor } from './core/auth/auth-interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: los parámetros de la URL (/producto/:id, ?q=) llegan como input() al componente.
    provideRouter(routes, withComponentInputBinding()),
    // Un solo mecanismo de acceso para toda la API: JWT en «Authorization: Bearer».
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
