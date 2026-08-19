import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ItemCarrito, ListaCompra } from '@/services/carritoService';
import { Receta } from '@/services/recetaService';
import { resolveImagenUrl } from '@/utils/media';

const COLOR_PRIMARY = '#7FC62A';
const COLOR_PRIMARY_DARK = '#5CA61E';
const COLOR_TEXT_PRIMARY = '#1A1A1A';
const COLOR_TEXT_SECONDARY = '#757575';
const COLOR_GRAY_LIGHT = '#F2F2F2';

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatCantidad(cantidad: number): string {
  return cantidad % 1 === 0 ? String(cantidad) : cantidad.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function baseStyles(): string {
  return `
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: ${COLOR_TEXT_PRIMARY}; padding: 24px; font-size: 13px; }
    .logo { color: ${COLOR_PRIMARY_DARK}; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px; }
    .titulo { font-size: 22px; font-weight: 700; margin: 0 0 10px 0; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid ${COLOR_GRAY_LIGHT};
              color: ${COLOR_TEXT_SECONDARY}; font-size: 11px; text-align: center; }
    h2 { font-size: 15px; color: ${COLOR_PRIMARY_DARK}; border-bottom: 2px solid ${COLOR_GRAY_LIGHT};
         padding-bottom: 4px; margin: 16px 0 8px 0; }
  `;
}

function pieDePagina(): string {
  return `<div class="footer">Generado con MyFoodie</div>`;
}

// -------------------------------------------------------------------------
// Receta
// -------------------------------------------------------------------------

function htmlReceta(receta: Receta): string {
  const datos = [
    `${receta.tiempoEstimado} min`,
    receta.dificultad,
    `${receta.numPersonas} persona${receta.numPersonas !== 1 ? 's' : ''}`,
    receta.categoria,
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' &middot; ');

  const etiquetas = (receta.etiquetas ?? [])
    .map((e) => `<span class="chip">${escapeHtml(e)}</span>`)
    .join('');

  const imagenPortada = resolveImagenUrl(receta.imagenUrl);

  const ingredientes = receta.ingredientes
    .map(
      (i) =>
        `<li>${formatCantidad(i.cantidad)} ${escapeHtml(i.unidad)} de ${escapeHtml(i.nombre)}${
          i.observacion ? ` <span class="obs">(${escapeHtml(i.observacion)})</span>` : ''
        }</li>`
    )
    .join('');

  const pasos = [...receta.pasos]
    .sort((a, b) => a.orden - b.orden)
    .map((p) => {
      const imagenPaso = resolveImagenUrl(p.imagenUrl);
      return `
        <li>
          <span class="paso-texto">${escapeHtml(p.descripcion)}</span>
          ${imagenPaso ? `<img class="paso-imagen" src="${imagenPaso}" />` : ''}
        </li>`;
    })
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          ${baseStyles()}
          .datos { color: ${COLOR_TEXT_SECONDARY}; font-size: 12px; margin-bottom: 10px; }
          .chip { display: inline-block; background: #E8F5D0; color: ${COLOR_PRIMARY_DARK};
                  border-radius: 999px; padding: 3px 10px; margin: 0 5px 5px 0; font-size: 11px; }
          .imagen-portada { width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 12px; }
          ol.dos-columnas { display: grid; grid-template-columns: 1fr 1fr; column-gap: 20px; padding-left: 18px; margin: 0; }
          ol.pasos { padding-left: 18px; margin: 0; }
          li { margin-bottom: 6px; line-height: 1.4; }
          .obs { color: ${COLOR_TEXT_SECONDARY}; font-size: 11px; }
          .paso-texto { display: block; }
          .paso-imagen { display: block; width: 100%; max-height: 150px; object-fit: cover;
                         border-radius: 8px; margin: 6px 0 10px 0; }
        </style>
      </head>
      <body>
        <div class="logo">MyFoodie</div>
        ${imagenPortada ? `<img class="imagen-portada" src="${imagenPortada}" />` : ''}
        <div class="titulo">${escapeHtml(receta.titulo)}</div>
        <div class="datos">${datos}</div>
        <div>${etiquetas}</div>

        <h2>Ingredientes</h2>
        <ol class="dos-columnas">${ingredientes}</ol>

        <h2>Pasos</h2>
        <ol class="pasos">${pasos}</ol>

        ${pieDePagina()}
      </body>
    </html>
  `;
}

// -------------------------------------------------------------------------
// Lista de la compra
// -------------------------------------------------------------------------

function agruparPorCategoria(items: ItemCarrito[]): [string, ItemCarrito[]][] {
  const grupos = new Map<string, ItemCarrito[]>();
  for (const item of items) {
    const categoria = item.categoria || 'Sin categoría';
    if (!grupos.has(categoria)) grupos.set(categoria, []);
    grupos.get(categoria)!.push(item);
  }
  return Array.from(grupos.entries());
}

function htmlListaCompra(lista: ListaCompra): string {
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const grupos = agruparPorCategoria(lista.items)
    .map(
      ([categoria, items]) => `
        <h2>${escapeHtml(categoria)}</h2>
        <div class="items">
          ${items
            .map(
              (i) => `
                <div class="item">
                  <span class="checkbox"></span>
                  <span class="nombre">${escapeHtml(i.nombre)}</span>
                  <span class="cantidad">${formatCantidad(i.cantidad)} ${escapeHtml(i.unidad)}</span>
                </div>`
            )
            .join('')}
        </div>`
    )
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          ${baseStyles()}
          .fecha { color: ${COLOR_TEXT_SECONDARY}; font-size: 12px; margin-bottom: 10px; }
          .items { display: grid; grid-template-columns: 1fr 1fr; column-gap: 20px; }
          .item { display: flex; align-items: center; padding: 5px 0; border-bottom: 1px solid ${COLOR_GRAY_LIGHT}; }
          .checkbox { width: 13px; height: 13px; border: 2px solid ${COLOR_TEXT_SECONDARY};
                      border-radius: 3px; margin-right: 8px; flex-shrink: 0; }
          .nombre { flex: 1; font-size: 13px; }
          .cantidad { color: ${COLOR_TEXT_SECONDARY}; font-size: 12px; }
          .total { margin-top: 14px; font-weight: 700; color: ${COLOR_PRIMARY_DARK}; }
        </style>
      </head>
      <body>
        <div class="logo">MyFoodie</div>
        <div class="titulo">${escapeHtml(lista.nombre)}</div>
        <div class="fecha">Generado el ${fecha}</div>

        ${grupos}

        <div class="total">Total: ${lista.items.length} producto${lista.items.length !== 1 ? 's' : ''}</div>

        ${pieDePagina()}
      </body>
    </html>
  `;
}

// -------------------------------------------------------------------------
// API pública
// -------------------------------------------------------------------------

export const pdfService = {
  generarPDFReceta: async (receta: Receta): Promise<string> => {
    const { uri } = await Print.printToFileAsync({ html: htmlReceta(receta), base64: false });
    return uri;
  },

  generarPDFListaCompra: async (lista: ListaCompra): Promise<string> => {
    const { uri } = await Print.printToFileAsync({ html: htmlListaCompra(lista), base64: false });
    return uri;
  },

  compartirPDF: async (uri: string, nombreArchivo: string): Promise<void> => {
    const disponible = await Sharing.isAvailableAsync();
    if (!disponible) return;
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: nombreArchivo,
      UTI: 'com.adobe.pdf',
    });
  },
};
