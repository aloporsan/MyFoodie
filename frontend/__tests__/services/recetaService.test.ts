import { apiClient } from '@/services/apiClient';
import { recetaService } from '@/services/recetaService';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  setTokenGetter: jest.fn(),
}));

const mockGet    = apiClient.get    as jest.Mock;
const mockPost   = apiClient.post   as jest.Mock;
const mockPut    = apiClient.put    as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const mockReceta = {
  id: 'r1',
  autorId: 'u1',
  titulo: 'Paella valenciana',
  descripcion: 'Receta tradicional',
  tiempoEstimado: 60,
  dificultad: 'Difícil',
  categoria: 'Arroces',
  etiquetas: [],
  estado: 'borrador' as const,
  ingredientes: [],
  pasos: [],
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

beforeEach(() => jest.clearAllMocks());

// -------------------------------------------------------------------------
// crearReceta
// -------------------------------------------------------------------------

it('crearReceta_hace_POST_y_devuelve_receta', async () => {
  mockPost.mockResolvedValue({ data: mockReceta });
  const input = { titulo: 'Paella', descripcion: 'Desc', tiempoEstimado: 60, dificultad: 'Difícil', categoria: 'Arroces', etiquetas: [] };
  const result = await recetaService.crearReceta(input);
  expect(result.titulo).toBe('Paella valenciana');
  expect(mockPost).toHaveBeenCalledWith('/recetas', input);
});

// -------------------------------------------------------------------------
// obtenerReceta
// -------------------------------------------------------------------------

it('obtenerReceta_hace_GET_por_id', async () => {
  mockGet.mockResolvedValue({ data: mockReceta });
  const result = await recetaService.obtenerReceta('r1');
  expect(result.id).toBe('r1');
  expect(mockGet).toHaveBeenCalledWith('/recetas/r1');
});

// -------------------------------------------------------------------------
// editarReceta
// -------------------------------------------------------------------------

it('editarReceta_hace_PUT_y_devuelve_receta_actualizada', async () => {
  const actualizada = { ...mockReceta, titulo: 'Paella mejorada' };
  mockPut.mockResolvedValue({ data: actualizada });
  const result = await recetaService.editarReceta('r1', { titulo: 'Paella mejorada', descripcion: 'Desc', tiempoEstimado: 60, dificultad: 'Difícil', categoria: 'Arroces', etiquetas: [] });
  expect(result.titulo).toBe('Paella mejorada');
  expect(mockPut).toHaveBeenCalledWith('/recetas/r1', expect.any(Object));
});

// -------------------------------------------------------------------------
// eliminarReceta
// -------------------------------------------------------------------------

it('eliminarReceta_hace_DELETE_y_resuelve', async () => {
  mockDelete.mockResolvedValue({});
  await expect(recetaService.eliminarReceta('r1')).resolves.not.toThrow();
  expect(mockDelete).toHaveBeenCalledWith('/recetas/r1');
});

// -------------------------------------------------------------------------
// publicarReceta / guardarComoBorrador
// -------------------------------------------------------------------------

it('publicarReceta_hace_POST_a_publicar', async () => {
  mockPost.mockResolvedValue({ data: { ...mockReceta, estado: 'publicada' } });
  const result = await recetaService.publicarReceta('r1');
  expect(result.estado).toBe('publicada');
  expect(mockPost).toHaveBeenCalledWith('/recetas/r1/publicar');
});

it('guardarComoBorrador_hace_POST_a_borrador', async () => {
  mockPost.mockResolvedValue({ data: { ...mockReceta, estado: 'borrador' } });
  const result = await recetaService.guardarComoBorrador('r1');
  expect(result.estado).toBe('borrador');
  expect(mockPost).toHaveBeenCalledWith('/recetas/r1/borrador');
});

// -------------------------------------------------------------------------
// actualizarImagen / actualizarEtiquetas
// -------------------------------------------------------------------------

it('actualizarImagen_hace_PUT_a_imagen', async () => {
  mockPut.mockResolvedValue({ data: { ...mockReceta, imagenUrl: 'https://img.com/foto.jpg' } });
  const result = await recetaService.actualizarImagen('r1', 'https://img.com/foto.jpg');
  expect(result.imagenUrl).toBe('https://img.com/foto.jpg');
  expect(mockPut).toHaveBeenCalledWith('/recetas/r1/imagen', { imagenUrl: 'https://img.com/foto.jpg' });
});

it('actualizarEtiquetas_hace_PUT_a_etiquetas', async () => {
  mockPut.mockResolvedValue({ data: { ...mockReceta, etiquetas: ['vegano'] } });
  const result = await recetaService.actualizarEtiquetas('r1', ['vegano']);
  expect(result.etiquetas).toEqual(['vegano']);
  expect(mockPut).toHaveBeenCalledWith('/recetas/r1/etiquetas', ['vegano']);
});

// -------------------------------------------------------------------------
// ingredientes
// -------------------------------------------------------------------------

it('añadirIngrediente_hace_POST_a_ingredientes', async () => {
  const recetaConIng = { ...mockReceta, ingredientes: [{ id: 'ing-1', nombre: 'Arroz', cantidad: 200, unidad: 'g' }] };
  mockPost.mockResolvedValue({ data: recetaConIng });
  const result = await recetaService.añadirIngrediente('r1', { nombre: 'Arroz', cantidad: 200, unidad: 'g' });
  expect(result.ingredientes).toHaveLength(1);
  expect(mockPost).toHaveBeenCalledWith('/recetas/r1/ingredientes', expect.any(Object));
});

it('eliminarIngrediente_hace_DELETE_a_ingredientes', async () => {
  mockDelete.mockResolvedValue({});
  await expect(recetaService.eliminarIngrediente('r1', 'ing-1')).resolves.not.toThrow();
  expect(mockDelete).toHaveBeenCalledWith('/recetas/r1/ingredientes/ing-1');
});

// -------------------------------------------------------------------------
// pasos
// -------------------------------------------------------------------------

it('añadirPaso_hace_POST_a_pasos', async () => {
  const recetaConPaso = { ...mockReceta, pasos: [{ id: 'p1', orden: 1, descripcion: 'Calentar agua' }] };
  mockPost.mockResolvedValue({ data: recetaConPaso });
  const result = await recetaService.añadirPaso('r1', { descripcion: 'Calentar agua' });
  expect(result.pasos).toHaveLength(1);
  expect(mockPost).toHaveBeenCalledWith('/recetas/r1/pasos', expect.any(Object));
});

it('eliminarPaso_hace_DELETE_a_pasos', async () => {
  mockDelete.mockResolvedValue({});
  await expect(recetaService.eliminarPaso('r1', 'p1')).resolves.not.toThrow();
  expect(mockDelete).toHaveBeenCalledWith('/recetas/r1/pasos/p1');
});

it('reordenarPasos_hace_PUT_a_reordenar', async () => {
  mockPut.mockResolvedValue({ data: mockReceta });
  await recetaService.reordenarPasos('r1', ['p2', 'p1']);
  expect(mockPut).toHaveBeenCalledWith('/recetas/r1/pasos/reordenar', ['p2', 'p1']);
});

// -------------------------------------------------------------------------
// misRecetas / misBorradores
// -------------------------------------------------------------------------

it('misRecetas_hace_GET_a_mis_recetas', async () => {
  const resumen = { id: 'r1', titulo: 'Paella', autorId: 'u1', descripcion: '', tiempoEstimado: 60, dificultad: 'Difícil', categoria: 'Arroces', etiquetas: [], estado: 'publicada' as const, createdAt: '', updatedAt: '' };
  mockGet.mockResolvedValue({ data: [resumen] });
  const result = await recetaService.misRecetas();
  expect(result).toHaveLength(1);
  expect(mockGet).toHaveBeenCalledWith('/recetas/mis-recetas');
});

it('misBorradores_hace_GET_a_mis_borradores', async () => {
  mockGet.mockResolvedValue({ data: [] });
  const result = await recetaService.misBorradores();
  expect(result).toHaveLength(0);
  expect(mockGet).toHaveBeenCalledWith('/recetas/mis-borradores');
});

// -------------------------------------------------------------------------
// negativos
// -------------------------------------------------------------------------

it('crearReceta_lanza_error_si_400', async () => {
  mockPost.mockRejectedValue(new Error('El título es obligatorio'));
  await expect(recetaService.crearReceta({ titulo: '', descripcion: '', tiempoEstimado: 0, dificultad: '', categoria: '', etiquetas: [] }))
    .rejects.toThrow('El título es obligatorio');
});

it('obtenerReceta_lanza_error_si_404', async () => {
  mockGet.mockRejectedValue(new Error('Receta no encontrada'));
  await expect(recetaService.obtenerReceta('no-existe'))
    .rejects.toThrow('Receta no encontrada');
});
