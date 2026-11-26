import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ComprasApi} from '../compras/compras-api';
import {Icon} from '../../shared/icon';

/** Inicio del portal de proveedores (/proveedor): accesos a solicitudes y cotizaciones. */
@Component({
    imports: [RouterLink, Icon],
    templateUrl: './inicio.html',
})
export class InicioProveedorPage {
    readonly nombre = inject(ComprasApi).nombreUsuario();
}
