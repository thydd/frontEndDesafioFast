import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage)
	},
	{
		path: 'workshops',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/workshops/workshops.page').then((m) => m.WorkshopsPage)
	},
	{
		path: 'colaboradores',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./pages/colaboradores/colaboradores.page').then((m) => m.ColaboradoresPage)
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'workshops'
	},
	{
		path: '**',
		redirectTo: 'workshops'
	}
];
