import { beforeEach, describe, expect, it, vi } from 'bun:test';

describe('proyectosApi', () => {
  // We'll spy on the real client methods
  let mockGet: ReturnType<typeof vi.fn>;
  let mockPost: ReturnType<typeof vi.fn>;
  let mockPut: ReturnType<typeof vi.fn>;
  let mockDelete: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the real client and spy on its methods
    const { default: client } = await import('../../services/api/client');
    mockGet = vi.spyOn(client, 'get').mockResolvedValue({ data: { data: [] } });
    mockPost = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: {} } });
    mockPut = vi.spyOn(client, 'put').mockResolvedValue({ data: { data: {} } });
    mockDelete = vi.spyOn(client, 'delete').mockResolvedValue({});
  });

  it('should list projects with query params', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    mockGet.mockResolvedValue({ data: { data: [{ id: '1' }] } });

    const result = await proyectosApi.list({ nombre: 'test', page: 1 });

    expect(mockGet).toHaveBeenCalledWith('/proyectos', { params: { nombre: 'test', page: 1 } });
    expect(result.data).toHaveLength(1);
  });

  it('should get project by id', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    mockGet.mockResolvedValue({ data: { data: { id: '1', codigo: 'PRO-001' } } });

    const result = await proyectosApi.getById('1');

    expect(mockGet).toHaveBeenCalledWith('/proyectos/1');
    expect(result.data.codigo).toBe('PRO-001');
  });

  it('should create a project', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const payload = { codigo: 'PRO-001', nombre: 'Test', descripcion: 'Desc' };
    mockPost.mockResolvedValue({ data: { data: { id: '1', ...payload, estado: 'ACTIVO' } } });

    const result = await proyectosApi.create(payload);

    expect(mockPost).toHaveBeenCalledWith('/proyectos', payload);
    expect(result.data.id).toBe('1');
    expect(result.data.codigo).toBe('PRO-001');
  });

  it('should update a project', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const payload = { nombre: 'Updated Name' };
    mockPut.mockResolvedValue({
      data: { data: { id: '1', codigo: 'PRO-001', nombre: 'Updated Name' } },
    });

    const result = await proyectosApi.update('1', payload);

    expect(mockPut).toHaveBeenCalledWith('/proyectos/1', payload);
    expect(result.data.nombre).toBe('Updated Name');
  });

  it('should delete a project', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');

    await proyectosApi.delete('1');

    expect(mockDelete).toHaveBeenCalledWith('/proyectos/1');
  });
});
