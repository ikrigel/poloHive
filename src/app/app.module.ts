import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { StoreModule } from '@ngrx/store';

import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoginComponent } from './components/login/login.component';

const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'login', component: LoginComponent }
];

@NgModule({
  declarations: [AppComponent, NavbarComponent, LoginComponent],
  imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(routes), StoreModule.forRoot({})],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
