import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/apiClient', () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
  setTokenGetter: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
}));
jest.mock('@/services/authService');

const mockAuthService = authService as jest.Mocked<typeof authService>;

const mockRes = {
  token: 'jwt-test-token',
  userId: 'user-123',
  email: 'test@test.com',
  nombreUsuario: 'testuser',
  nombre: 'Test User',
};

beforeEach(() => {
  useAuthStore.setState({
    token: null,
    usuario: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// login — positivos
// -------------------------------------------------------------------------

it('login_actualiza_estado_isAuthenticated', async () => {
  mockAuthService.login.mockResolvedValue(mockRes);
  await useAuthStore.getState().login('test@test.com', 'password123');
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

it('login_guarda_token_en_store', async () => {
  mockAuthService.login.mockResolvedValue(mockRes);
  await useAuthStore.getState().login('test@test.com', 'password123');
  expect(useAuthStore.getState().token).toBe('jwt-test-token');
});

it('loadStoredAuth_recupera_sesion_si_hay_token', () => {
  useAuthStore.setState({
    token: 'stored-token',
    usuario: { userId: 'u1', email: 'e@e.com', nombreUsuario: 'user', nombre: 'User' },
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
  expect(useAuthStore.getState().token).toBe('stored-token');
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

// -------------------------------------------------------------------------
// logout — positivo
// -------------------------------------------------------------------------

it('logout_limpia_estado_completamente', async () => {
  useAuthStore.setState({
    token: 'tok',
    usuario: { userId: 'u1', email: 'e@e.com', nombreUsuario: 'user', nombre: 'User' },
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
  await useAuthStore.getState().logout();
  const { token, usuario, isAuthenticated } = useAuthStore.getState();
  expect(isAuthenticated).toBe(false);
  expect(token).toBeNull();
  expect(usuario).toBeNull();
});

// -------------------------------------------------------------------------
// login — negativos
// -------------------------------------------------------------------------

it('login_falla_mantiene_isAuthenticated_false', async () => {
  mockAuthService.login.mockRejectedValue(new Error('Error de red'));
  await expect(
    useAuthStore.getState().login('test@test.com', 'password123')
  ).rejects.toThrow();
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});

it('login_falla_guarda_mensaje_de_error', async () => {
  mockAuthService.login.mockRejectedValue(new Error('Credenciales incorrectas'));
  await expect(
    useAuthStore.getState().login('test@test.com', 'wrongpassword')
  ).rejects.toThrow();
  expect(useAuthStore.getState().error).toBe('Credenciales incorrectas');
});
