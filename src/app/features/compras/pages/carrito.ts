import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventarioApi, mensajeError } from '../../../core/api';
import { Item, Opcion, Solicitud } from '../../../core/models';
import { Icon } from '../../../shared/icon';
import { NumeroPipe } from '../../../shared/format';

interface LineaCarrito { id: number; nombre: string; unidad: string; stock: number; cantidad: number }
const STORAGE_KEY = 'trujillanos-compras-carrito';

@Component({ imports: [FormsModule, Icon, NumeroPipe], templateUrl: './carrito.html' })
export class CarritoPage {
  private readonly api = inject(InventarioApi);
  readonly insumos = signal<Item[]>([]);
  readonly proveedores = signal<Opcion[]>([]);
  readonly carrito = signal<LineaCarrito[]>(this.leerCarrito());
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly buscar = signal('');
  proveedor = 0;
  readonly filtrados = computed(() => this.insumos().filter(i => (i.nombre+' '+i.unidad).toLowerCase().includes(this.buscar().trim().toLowerCase())));
  readonly totalUnidades = computed(() => this.carrito().reduce((sum, l) => sum + l.cantidad, 0));

  constructor() { void this.cargar(); }
  private leerCarrito(): LineaCarrito[] {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') as LineaCarrito[]; } catch { return []; }
  }
  private persistir() { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.carrito())); }
  async cargar() {
    this.loading.set(true); this.error.set('');
    try {
      const [insumos, proveedores] = await Promise.all([
        this.api.todos<Item>('/stock', { tipoItem: 'INSUMO' }),
        this.api.get<Opcion[]>('/proveedores')
      ]);
      this.insumos.set(insumos.filter(i => i.activo)); this.proveedores.set(proveedores);
    } catch (e) { this.error.set(mensajeError(e)); } finally { this.loading.set(false); }
  }
  agregar(item: Item) {
    const exists = this.carrito().some(l => l.id === item.id);
    this.carrito.update(lines => exists ? lines.map(l => l.id === item.id ? { ...l, cantidad: l.cantidad + 1 } : l) : [...lines, { id: item.id, nombre: item.nombre, unidad: item.unidad, stock: item.stock, cantidad: 1 }]);
    this.persistir(); this.success.set(`${item.nombre} agregado al carrito.`); this.error.set('');
  }
  cantidad(id: number, raw: string) {
    const value = Number(raw);
    this.carrito.update(lines => lines.map(l => l.id === id ? { ...l, cantidad: value } : l)); this.persistir();
  }
  quitar(id: number) { this.carrito.update(lines => lines.filter(l => l.id !== id)); this.persistir(); }
  async registrar() {
    const lines = this.carrito();
    if (!this.proveedor) { this.error.set('Selecciona un proveedor para enviar la solicitud.'); return; }
    if (!lines.length || lines.some(l => !Number.isInteger(l.cantidad) || l.cantidad <= 0)) { this.error.set('Agrega insumos e indica cantidades enteras mayores que cero.'); return; }
    this.busy.set(true); this.error.set(''); this.success.set('');
    try {
      const solicitud = await this.api.post<Solicitud>('/solicitudes-compra', { idProveedor: Number(this.proveedor), detalles: lines.map(l => ({ idInsumo: l.id, cantidad: l.cantidad })) });
      this.carrito.set([]); this.persistir(); this.success.set(`Solicitud ${solicitud.codigo} registrada y enviada a compras.`);
    } catch (e) { this.error.set(mensajeError(e)); } finally { this.busy.set(false); }
  }
}
