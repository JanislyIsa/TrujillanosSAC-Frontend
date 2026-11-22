import { Service } from '@angular/core';
import { environment } from '../../../../environments/environment';

/** Parte de la API global de Culqi Checkout v4 que usamos (https://docs.culqi.com/es/documentacion/checkout/v4). */
interface CulqiGlobal {
  publicKey: string;
  settings(config: { title: string; currency: string; amount: number }): void;
  options(opciones: Record<string, unknown>): void;
  open(): void;
  close(): void;
  token?: { id: string };
  error?: { user_message?: string; merchant_message?: string };
}
type VentanaCulqi = Window & { Culqi?: CulqiGlobal; culqi?: () => void };

/**
 * Culqi Checkout: abre el formulario de Culqi (tarjeta o Yape) y entrega el token del pago.
 * Los datos de la tarjeta nunca pasan por nuestro servidor: solo viaja el token al backend.
 */
@Service()
export class CulqiService {
  private carga: Promise<CulqiGlobal> | null = null;

  /** false mientras falte la llave pública de Culqi en environment.ts. */
  readonly configurado = environment.culqiPublicKey.startsWith('pk_');

  /** Abre el Checkout. `alToken` recibe el token si el cliente completa el pago; `alError` si Culqi falla. */
  pedirToken(
    monto: number,
    alToken: (token: string) => void,
    alError: (mensaje: string) => void,
  ): void {
    if (!this.configurado) {
      alError('Falta configurar la llave pública de Culqi (culqiPublicKey en environment.ts).');
      return;
    }
    this.cargarScript()
      .then((culqi) => {
        culqi.publicKey = environment.culqiPublicKey;
        culqi.settings({
          title: environment.nombreComercio,
          currency: environment.moneda,
          amount: Math.round(monto * 100),
        });
        culqi.options({
          lang: 'es',
          installments: false,
          paymentMethods: {
            tarjeta: true,
            yape: true,
            bancaMovil: false,
            agente: false,
            billetera: false,
            cuotealo: false,
          },
          style: { bannerColor: '#182545', buttonBackground: '#445895', buttonText: 'Pagar' },
        });
        // Culqi avisa llamando a window.culqi() cuando termina de tokenizar (o falla).
        (window as VentanaCulqi).culqi = () => {
          if (culqi.token) {
            culqi.close();
            alToken(culqi.token.id);
          } else if (culqi.error) {
            culqi.close();
            alError(
              culqi.error.user_message ??
                culqi.error.merchant_message ??
                'Culqi no pudo procesar el pago.',
            );
          }
        };
        culqi.open();
      })
      .catch((e: unknown) => alError(e instanceof Error ? e.message : 'No se pudo abrir Culqi.'));
  }

  private cargarScript(): Promise<CulqiGlobal> {
    const ventana = window as VentanaCulqi;
    if (ventana.Culqi) return Promise.resolve(ventana.Culqi);
    this.carga ??= new Promise<CulqiGlobal>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = environment.culqiScriptUrl;
      script.async = true;
      script.onload = () =>
        ventana.Culqi
          ? resolve(ventana.Culqi)
          : reject(new Error('Culqi no se inicializó correctamente.'));
      script.onerror = () => {
        this.carga = null;
        reject(new Error('No se pudo cargar Culqi. Revisa tu conexión e inténtalo de nuevo.'));
      };
      document.head.appendChild(script);
    });
    return this.carga;
  }
}
