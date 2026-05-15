import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TitleCasePipe],
  template: `
    <nav class="fixed left-0 top-0 h-screen w-20 lg:w-64 bg-gradient-to-b from-[#00B8D4] to-[#3F51B5] flex flex-col z-50 transition-all duration-300 shadow-2xl overflow-hidden">
      <!-- Profile Section (Top) -->
      <div class="p-6 border-b border-white/10">
        <div class="flex flex-col items-center gap-4 text-center">
          <div class="h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 p-1 shadow-xl">
             <div class="h-full w-full rounded-full bg-white flex items-center justify-center text-[#00B8D4] text-2xl font-black shadow-inner">
                {{ (authService.getUserData()?.nombre?.charAt(0) || 'U') | titlecase }}
             </div>
          </div>
          <div class="hidden lg:block">
            <p class="text-lg font-black text-white leading-tight">{{ authService.getUserData()?.nombre }}</p>
            <p class="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">FichApp</p>
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 py-6 space-y-1 px-3 lg:px-4">
        <a routerLink="/dashboard" routerLinkActive="bg-white/20 text-white shadow-lg" class="group cursor-pointer flex items-center justify-center lg:justify-start gap-4 p-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200">
          <div class="h-10 w-10 flex items-center justify-center rounded-lg transition-transform group-hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span class="hidden lg:block font-bold text-sm">Inicio</span>
        </a>


        <a routerLink="/solicitudes" routerLinkActive="bg-white/20 text-white shadow-lg" class="group cursor-pointer flex items-center justify-center lg:justify-start gap-4 p-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200">
          <div class="h-10 w-10 flex items-center justify-center rounded-lg transition-transform group-hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
          </div>
          <span class="hidden lg:block font-bold text-sm">Solicitudes</span>
        </a>

        @if (authService.getRole()?.includes('admin')) {
          <a routerLink="/admin" routerLinkActive="bg-white/20 text-white shadow-lg" class="group cursor-pointer flex items-center justify-center lg:justify-start gap-4 p-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200">
            <div class="h-10 w-10 flex items-center justify-center rounded-lg transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <span class="hidden lg:block font-bold text-sm">Acceso Admin</span>
          </a>
        }
      </div>

      <!-- Footer / Logout -->
      <div class="p-4 bg-black/10 backdrop-blur-sm">
        <button (click)="logout()" class="group cursor-pointer flex w-full items-center justify-center lg:justify-start gap-4 p-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200">
          <div class="h-10 w-10 flex items-center justify-center transition-transform group-hover:rotate-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-power"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg>
          </div>
          <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Desconectar</span>
        </button>
        <p class="hidden lg:block text-center text-[8px] text-white/30 mt-2">v 3.0.9 | P. Privacidad</p>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class Sidebar {
  authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
