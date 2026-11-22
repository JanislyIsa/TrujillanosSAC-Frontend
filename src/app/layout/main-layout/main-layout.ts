import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Header } from '../header/header';

/**
 * Marco de la tienda (cabecera, contenido y pie).
 *
 * Los estilos globales de la tienda (variables, botones, avisos…) están en estilos-tienda.css y se cargan
 * con ViewEncapsulation.None: Angular los agrega al entrar a la tienda y los quita al salir, así no
 * chocan con los de la intranet (inventario), que usa otro diseño con clases parecidas.
 */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, Header],
  templateUrl: './main-layout.html',
  styleUrls: ['./estilos-tienda.css', './main-layout.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MainLayout {}
