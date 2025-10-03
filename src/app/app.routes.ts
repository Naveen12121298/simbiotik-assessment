// app.routes.ts
import { Routes } from '@angular/router';

import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TodoListComponent } from './components/todo-list/todo-list.component';
import { TodoFormComponent } from './components/todo-form/todo-form.component';
import { TodoDetailComponent } from './components/todo-detail/todo-detail.component';

import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';
import { WeatherComponent } from './components/weather/weather.component';
import { MapComponent } from './components/map/map.component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
     { path: '', redirectTo: 'todos', pathMatch: 'full' },
      { path: 'todos', component: TodoListComponent },
      { path: 'todos/new', component: TodoFormComponent },
      { path: 'todos/edit/:id', component: TodoFormComponent },
      { path: 'todos/:id', component: TodoDetailComponent },
        // Weather page route
      { path: 'weather', component: WeatherComponent },
        // Map Routing
      { path: 'map', component: MapComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
