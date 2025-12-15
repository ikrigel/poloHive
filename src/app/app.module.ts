import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoginComponent } from './components/login/login.component';
import { SettingsComponent } from './components/settings/settings.component';
import { LogsComponent } from './components/logs/logs.component';

const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'login', component: LoginComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'logs', component: LogsComponent }
];

@NgModule({
  declarations: [AppComponent, NavbarComponent, LoginComponent, SettingsComponent, LogsComponent],
  imports: [BrowserModule, HttpClientModule, FormsModule, RouterModule.forRoot(routes), StoreModule.forRoot({})],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
