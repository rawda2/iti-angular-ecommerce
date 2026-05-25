import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Navbar } from "./shared/components/navbar/navbar";
import { Footer } from "./shared/components/footer/footer";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  private auth = inject(Auth);
  projectId: string = '';
  isProduction: boolean = false;

  ngOnInit() {
    this.projectId = this.auth.app.options.projectId || 'Connected!';
    this.isProduction = this.auth.app.options.projectId === 'iti-angular-ecommerce';
  
  }
}