const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Task Manager API',
    version: '1.0.0',
  },
  tags: [
    { name: 'Tasks', description: 'Gestión de tareas' },
    { name: 'Users', description: 'Autenticación y registro' },
  ],
  paths: {
    '/task': {
      get: {
        tags: ['Tasks'],
        summary: 'Listar todas las tareas',
        responses: {
          200: {
            description: 'Lista de tareas',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Crear una tarea',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Tarea creada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
        },
      },
    },
    '/task/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Obtener detalle de una tarea',
        parameters: [{ $ref: '#/components/parameters/TaskId' }],
        responses: {
          200: {
            description: 'Tarea encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          404: { description: 'Tarea no encontrada' },
        },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Actualizar una tarea',
        parameters: [{ $ref: '#/components/parameters/TaskId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Tarea actualizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          404: { description: 'Tarea no encontrada' },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Eliminar una tarea',
        parameters: [{ $ref: '#/components/parameters/TaskId' }],
        responses: {
          204: { description: 'Tarea eliminada' },
          404: { description: 'Tarea no encontrada' },
        },
      },
    },
    '/user/register': {
      post: {
        tags: ['Users'],
        summary: 'Registrar un usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserRegisterInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario registrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          409: { description: 'El email ya está en uso' },
        },
      },
    },
    '/user/login': {
      post: {
        tags: ['Users'],
        summary: 'Iniciar sesión',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserLoginInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          401: { description: 'Credenciales inválidas' },
        },
      },
    },
  },
  components: {
    schemas: {
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          title: { type: 'string', example: 'Comprar pan' },
          description: { type: 'string', example: 'En la tienda de la esquina' },
          done: { type: 'boolean', example: false },
          userId: { type: 'string', format: 'uuid', nullable: true, example: null },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      TaskInput: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Comprar pan' },
          description: { type: 'string', example: 'En la tienda de la esquina' },
          done: { type: 'boolean', example: false },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          name: { type: 'string', example: 'Juan' },
          lastname: { type: 'string', example: 'Pérez' },
          email: { type: 'string', format: 'email', example: 'juan@example.com' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      UserRegisterInput: {
        type: 'object',
        required: ['name', 'lastname', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Juan' },
          lastname: { type: 'string', example: 'Pérez' },
          email: { type: 'string', format: 'email', example: 'juan@example.com' },
          password: { type: 'string', example: 'mi_contrasena' },
        },
      },
      UserLoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'juan@example.com' },
          password: { type: 'string', example: 'mi_contrasena' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJpZCI6IjEyMzQiLCJlbWFpbCI6Imp1YW5AZXhhbXBsZS5jb20ifQ==' },
        },
      },
    },
    parameters: {
      TaskId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    },
  },
};

export default spec;
