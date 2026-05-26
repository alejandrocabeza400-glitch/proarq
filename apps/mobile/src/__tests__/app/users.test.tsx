import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { resetMocks } from '../setup';

vi.module('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSegments: () => ['(tabs)', 'users'],
  useLocalSearchParams: () => ({}),
}));

describe('User Management Screen', () => {
  beforeEach(async () => {
    resetMocks();
    vi.restoreAllMocks();

    // Set auth store as ADMIN
    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });
  });

  describe('User Directory', () => {
    const renderUserDirectory = async () => {
      const UsersScreen = (await import('../../app/(tabs)/users')).default;
      return render(<UsersScreen />);
    };

    it('should render the user directory header', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      vi.spyOn(usersApi, 'list').mockResolvedValue({ data: [] });
      await renderUserDirectory();
      await waitFor(() => {
        const header = screen.getByText(/usuarios|users|directorio/i);
        expect(header).toBeDefined();
      });
    });

    it('should fetch and display users from API', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      const mockUsers = [
        { id: 'u1', name: 'Admin User', email: 'admin@proarq.com', role: 'ADMIN' },
        { id: 'u2', name: 'Gerente Obra', email: 'gerente@proarq.com', role: 'GERENTE_OBRA' },
        { id: 'u3', name: 'Cliente Test', email: 'cliente@proarq.com', role: 'CLIENTE' },
      ];
      vi.spyOn(usersApi, 'list').mockResolvedValue({ data: mockUsers });

      await renderUserDirectory();

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeDefined();
        expect(screen.getByText('Gerente Obra')).toBeDefined();
        expect(screen.getByText('Cliente Test')).toBeDefined();
      });
    });

    it('should display role badges for each user', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      vi.spyOn(usersApi, 'list').mockResolvedValue({
        data: [
          { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
          { id: 'u2', name: 'Cliente', email: 'client@test.com', role: 'CLIENTE' },
        ],
      });

      await renderUserDirectory();

      await waitFor(() => {
        // Use getAllByText for multiples, then filter
        const adminBadge = screen.getAllByText(/ADMIN/i);
        expect(adminBadge.length).toBeGreaterThanOrEqual(1);
        const clienteBadge = screen.getAllByText(/CLIENTE/i);
        expect(clienteBadge.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should render a search bar for user filtering', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      vi.spyOn(usersApi, 'list').mockResolvedValue({ data: [] });
      await renderUserDirectory();
      await waitFor(() => {
        const searchBar = screen.getByPlaceholderText(/buscar|search|nombre|email/i);
        expect(searchBar).toBeDefined();
      });
    });

    it('should filter users by name search', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      const listSpy = vi.spyOn(usersApi, 'list').mockResolvedValue({ data: [] });

      await renderUserDirectory();
      await waitFor(() => {
        const searchBar = screen.getByPlaceholderText(/buscar|search|nombre|email/i);
        fireEvent.change(searchBar, { target: { value: 'Admin' } });
      });

      await waitFor(() => {
        expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Admin' }));
      });
    });

    it('should render FAB button labeled "Nuevo Usuario"', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      vi.spyOn(usersApi, 'list').mockResolvedValue({ data: [] });
      await renderUserDirectory();
      await waitFor(() => {
        const fabButton = screen.getByRole('button', { name: /nuevo usuario|crear usuario/i });
        expect(fabButton).toBeDefined();
      });
    });

    it('should navigate to create user on FAB press', async () => {
      const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
      vi.spyOn(await import('expo-router'), 'useRouter').mockReturnValue(mockRouter as any);

      const { usersApi } = await import('../../services/api/users.api');
      vi.spyOn(usersApi, 'list').mockResolvedValue({ data: [] });
      await renderUserDirectory();

      await waitFor(() => {
        const fabButton = screen.getByRole('button', { name: /nuevo usuario|crear usuario/i });
        fireEvent.click(fabButton);
        expect(mockRouter.push).toHaveBeenCalledWith('/users/create');
      });
    });

    it('should support pull-to-refresh', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      const listSpy = vi.spyOn(usersApi, 'list').mockResolvedValue({ data: [] });

      await renderUserDirectory();
      await waitFor(() => {
        const refreshControl = screen.getByTestId('refresh-control');
        fireEvent.click(refreshControl);
        expect(listSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Create/Edit User', () => {
    const renderCreateUser = async () => {
      const CreateUserScreen = (await import('../../app/users/create')).default;
      return render(<CreateUserScreen />);
    };

    it('should render form fields: name, email, password, role', async () => {
      await renderCreateUser();

      expect(screen.getByPlaceholderText(/nombre|name/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/correo|email/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/contraseña|password/i)).toBeDefined();
      expect(screen.getByTestId('role-select')).toBeDefined();
    });

    it('should include all 5 roles in the role dropdown', async () => {
      await renderCreateUser();

      const roleSelect = screen.getByTestId('role-select');
      const options = roleSelect.querySelectorAll('option');

      const roles = Array.from(options).map((o) => o.textContent?.trim());
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('GERENTE_OBRA');
      expect(roles).toContain('DIRECTOR_OBRA');
      expect(roles).toContain('CLIENTE');
      expect(roles).toContain('REPRESENTANTE');
    });

    it('should create user via POST /users on form submit', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      const createSpy = vi.spyOn(usersApi, 'create').mockResolvedValue({
        data: { id: 'new-user', name: 'New User', email: 'new@test.com', role: 'CLIENTE' },
      });

      await renderCreateUser();

      fireEvent.change(screen.getByPlaceholderText(/nombre|name/i), {
        target: { value: 'New User' },
      });
      fireEvent.change(screen.getByPlaceholderText(/correo|email/i), {
        target: { value: 'new@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/contraseña|password/i), {
        target: { value: 'password123' },
      });

      const roleSelect = screen.getByTestId('role-select');
      fireEvent.change(roleSelect, { target: { value: 'CLIENTE' } });

      const saveButton = screen.getByRole('button', { name: /guardar|crear/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith({
          name: 'New User',
          email: 'new@test.com',
          password: 'password123',
          role: 'CLIENTE',
        });
      });
    });

    it('should validate email format before submitting', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      vi.spyOn(usersApi, 'create');
      await renderCreateUser();

      fireEvent.change(screen.getByPlaceholderText(/nombre|name/i), { target: { value: 'User' } });
      fireEvent.change(screen.getByPlaceholderText(/correo|email/i), {
        target: { value: 'not-an-email' },
      });

      const saveButton = screen.getByRole('button', { name: /guardar|crear/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(usersApi.create).not.toHaveBeenCalled();
      });
    });

    it('should validate password minimum length of 8 characters', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      vi.spyOn(usersApi, 'create');
      await renderCreateUser();

      fireEvent.change(screen.getByPlaceholderText(/nombre|name/i), { target: { value: 'User' } });
      fireEvent.change(screen.getByPlaceholderText(/correo|email/i), {
        target: { value: 'user@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/contraseña|password/i), {
        target: { value: '123' },
      });

      const saveButton = screen.getByRole('button', { name: /guardar|crear/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(usersApi.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('Delete User', () => {
    const renderUserDirectory = async () => {
      const UsersScreen = (await import('../../app/(tabs)/users')).default;
      return render(<UsersScreen />);
    };

    it('should show confirmation dialog before deleting a user', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      vi.spyOn(usersApi, 'list').mockResolvedValue({
        data: [{ id: 'u1', name: 'Test User', email: 'test@test.com', role: 'CLIENTE' }],
      });

      await renderUserDirectory();

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /eliminar|borrar|delete/i });
        fireEvent.click(deleteButton);
      });

      const confirmDialog = screen.getByTestId('confirm-dialog');
      expect(confirmDialog).toBeDefined();
    });

    it('should call DELETE /users/:id after confirmation', async () => {
      const { usersApi } = await import('../../services/api/users.api');
      vi.spyOn(usersApi, 'list').mockResolvedValue({
        data: [{ id: 'u1', name: 'Test User', email: 'test@test.com', role: 'CLIENTE' }],
      });
      const deleteSpy = vi.spyOn(usersApi, 'delete').mockResolvedValue(undefined);

      await renderUserDirectory();

      // Wait for the user list to render
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeDefined();
      });

      // Click delete to show confirmation
      const deleteButton = screen.getByRole('button', { name: /eliminar|borrar|delete/i });
      fireEvent.click(deleteButton);

      // Confirm dialog should be visible
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeDefined();
      });

      // Click confirm
      const confirmButton = screen
        .getAllByRole('button')
        .find((b) => b.getAttribute('aria-label') === 'Confirmar');
      if (confirmButton) fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('u1');
      });
    });
  });
});
