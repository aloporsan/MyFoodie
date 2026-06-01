import { apiClient } from '@/services/apiClient';
import { authService } from '@/services/authService';

jest.mock('@/services/apiClient', () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
  setTokenGetter: jest.fn(),
}));

const mockPost = apiClient.post as jest.Mock;

const mockAuthResponse = {
  token: 'jwt-token',
  userId: 'user-1',
  email: 'test@test.com',
  nombreUsuario: 'testuser',
  nombre: 'Test User',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// login — positivos
// -------------------------------------------------------------------------

it('login_devuelve_token_y_usuario', async () => {
  mockPost.mockResolvedValue({ data: mockAuthResponse });
  const result = await authService.login('test@test.com', 'password123');
  expect(result.token).toBe('jwt-token');
  expect(result.email).toBe('test@test.com');
  expect(result.userId).toBe('user-1');
});

// -------------------------------------------------------------------------
// register — positivos
// -------------------------------------------------------------------------

it('register_devuelve_token_y_usuario', async () => {
  mockPost.mockResolvedValue({ data: mockAuthResponse });
  const result = await authService.register({
    nombre: 'Test User',
    nombreUsuario: 'testuser',
    email: 'test@test.com',
    password: 'password123',
  });
  expect(result.token).toBe('jwt-token');
  expect(result.nombreUsuario).toBe('testuser');
});

// -------------------------------------------------------------------------
// forgotPassword — positivo
// -------------------------------------------------------------------------

it('forgotPassword_devuelve_mensaje_confirmacion', async () => {
  mockPost.mockResolvedValue({ data: {} });
  await expect(authService.forgotPassword('test@test.com')).resolves.not.toThrow();
});

// -------------------------------------------------------------------------
// login — negativos
// -------------------------------------------------------------------------

it('login_lanza_error_si_respuesta_401', async () => {
  mockPost.mockRejectedValue(new Error('Credenciales incorrectas'));
  await expect(authService.login('test@test.com', 'wrongpass')).rejects.toThrow('Credenciales incorrectas');
});

it('login_lanza_error_si_falla_red', async () => {
  mockPost.mockRejectedValue(new Error('Network Error'));
  await expect(authService.login('test@test.com', 'password123')).rejects.toThrow('Network Error');
});

// -------------------------------------------------------------------------
// register — negativo
// -------------------------------------------------------------------------

it('register_lanza_error_si_email_duplicado', async () => {
  mockPost.mockRejectedValue(new Error('El email ya está registrado'));
  await expect(
    authService.register({
      nombre: 'Test',
      nombreUsuario: 'user',
      email: 'existing@test.com',
      password: 'pass123',
    })
  ).rejects.toThrow('El email ya está registrado');
});
