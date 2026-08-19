import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { pdfService } from '@/services/pdfService';
import { Receta } from '@/services/recetaService';
import { ListaCompra } from '@/services/carritoService';

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

const mockPrint = Print as jest.Mocked<typeof Print>;
const mockSharing = Sharing as jest.Mocked<typeof Sharing>;

const mockReceta: Receta = {
  id: 'r1',
  autorId: 'u1',
  titulo: 'Paella valenciana',
  descripcion: 'Receta tradicional',
  tiempoEstimado: 60,
  dificultad: 'Difícil',
  categoria: 'Arroces',
  numPersonas: 4,
  etiquetas: ['tradicional', 'arroz'],
  estado: 'publicada',
  ingredientes: [
    { id: 'ing1', nombre: 'Arroz', cantidad: 200, unidad: 'g' },
    { id: 'ing2', nombre: 'Azafrán', cantidad: 1, unidad: 'pizca' },
  ],
  pasos: [
    { id: 'p1', orden: 1, descripcion: 'Sofreír el pollo' },
    { id: 'p2', orden: 2, descripcion: 'Añadir el arroz' },
  ],
  createdAt: '',
  updatedAt: '',
};

const mockLista: ListaCompra = {
  id: 'l1',
  nombre: 'Compra semanal',
  estado: 'activa',
  items: [
    {
      id: 'i1', usuarioId: 'u1', nombre: 'Leche', cantidad: 2, unidad: 'l',
      categoria: 'lacteos', prioridad: 'alta', motivo: null, estado: 'aceptado',
      noVolver: false, recetaId: null, recetaTitulo: null, productoEnDespensa: false,
      createdAt: '', updatedAt: '',
    },
    {
      id: 'i2', usuarioId: 'u1', nombre: 'Tomate', cantidad: 3, unidad: 'unidades',
      categoria: 'verduras', prioridad: 'media', motivo: null, estado: 'aceptado',
      noVolver: false, recetaId: null, recetaTitulo: null, productoEnDespensa: false,
      createdAt: '', updatedAt: '',
    },
  ],
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrint.printToFileAsync.mockResolvedValue({ uri: 'file:///receta.pdf' } as any);
  mockSharing.isAvailableAsync.mockResolvedValue(true);
  mockSharing.shareAsync.mockResolvedValue(undefined as any);
});

describe('generarPDFReceta', () => {
  it('genera_el_pdf_con_el_titulo_ingredientes_y_pasos_de_la_receta', async () => {
    const uri = await pdfService.generarPDFReceta(mockReceta);

    expect(uri).toBe('file:///receta.pdf');
    const html = mockPrint.printToFileAsync.mock.calls[0]?.[0]?.html ?? '';
    expect(html).toContain('Paella valenciana');
    expect(html).toContain('Arroz');
    expect(html).toContain('Sofreír el pollo');
    expect(html).toContain('Añadir el arroz');
  });

  it('muestra_los_ingredientes_en_disposicion_de_dos_columnas', async () => {
    await pdfService.generarPDFReceta(mockReceta);

    const html = mockPrint.printToFileAsync.mock.calls[0]?.[0]?.html ?? '';
    expect(html).toContain('dos-columnas');
    expect(html).toMatch(/grid-template-columns:\s*1fr 1fr/);
  });

  it('incluye_la_imagen_de_portada_y_de_los_pasos_cuando_la_receta_las_tiene', async () => {
    const recetaConImagenes: Receta = {
      ...mockReceta,
      imagenUrl: 'https://cdn.myfoodie.test/paella.jpg',
      pasos: [
        { id: 'p1', orden: 1, descripcion: 'Sofreír el pollo', imagenUrl: 'https://cdn.myfoodie.test/paso1.jpg' },
        { id: 'p2', orden: 2, descripcion: 'Añadir el arroz' },
      ],
    };

    await pdfService.generarPDFReceta(recetaConImagenes);

    const html = mockPrint.printToFileAsync.mock.calls[0]?.[0]?.html ?? '';
    expect(html).toContain('<img class="imagen-portada" src="https://cdn.myfoodie.test/paella.jpg"');
    expect(html).toContain('<img class="paso-imagen" src="https://cdn.myfoodie.test/paso1.jpg"');
  });

  it('no_incluye_imagenes_si_la_receta_no_las_tiene', async () => {
    await pdfService.generarPDFReceta(mockReceta);

    const html = mockPrint.printToFileAsync.mock.calls[0]?.[0]?.html ?? '';
    expect(html).not.toContain('<img');
  });
});

describe('generarPDFListaCompra', () => {
  it('incluye_los_items_agrupados_por_categoria', async () => {
    mockPrint.printToFileAsync.mockResolvedValue({ uri: 'file:///lista.pdf' } as any);

    const uri = await pdfService.generarPDFListaCompra(mockLista);

    expect(uri).toBe('file:///lista.pdf');
    const html = mockPrint.printToFileAsync.mock.calls[0]?.[0]?.html ?? '';
    expect(html).toContain('Compra semanal');
    expect(html).toContain('lacteos');
    expect(html).toContain('Leche');
    expect(html).toContain('verduras');
    expect(html).toContain('Tomate');
    expect(html).toContain('Total: 2 productos');
  });

  it('muestra_los_productos_en_disposicion_de_dos_columnas', async () => {
    mockPrint.printToFileAsync.mockResolvedValue({ uri: 'file:///lista.pdf' } as any);

    await pdfService.generarPDFListaCompra(mockLista);

    const html = mockPrint.printToFileAsync.mock.calls[0]?.[0]?.html ?? '';
    expect(html).toMatch(/\.items\s*\{[^}]*grid-template-columns:\s*1fr 1fr/);
  });
});

describe('compartirPDF', () => {
  it('llama_a_expo_sharing_con_la_uri_y_el_nombre_correctos', async () => {
    await pdfService.compartirPDF('file:///receta.pdf', 'Paella.pdf');

    expect(mockSharing.isAvailableAsync).toHaveBeenCalled();
    expect(mockSharing.shareAsync).toHaveBeenCalledWith('file:///receta.pdf', {
      mimeType: 'application/pdf',
      dialogTitle: 'Paella.pdf',
      UTI: 'com.adobe.pdf',
    });
  });

  it('no_comparte_si_no_hay_metodo_de_compartir_disponible', async () => {
    mockSharing.isAvailableAsync.mockResolvedValue(false);

    await pdfService.compartirPDF('file:///receta.pdf', 'Paella.pdf');

    expect(mockSharing.shareAsync).not.toHaveBeenCalled();
  });
});
