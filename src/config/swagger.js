import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'BETalentBoard API',
    version: '1.0.0',
    description: 'User Authentication & Management API for BETalentBoard platform',
    contact: {
      name: 'API Support',
      email: 'support@betalentboard.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'https://betalentboard-production-f63e.up.railway.app',
      description: 'Production server (Railway)'
    },
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User unique identifier',
            example: 'cmhgf6dls0000r9qzgcq6yge7'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com'
          },
          username: {
            type: 'string',
            description: 'User username',
            example: 'johndoe'
          },
          name: {
            type: 'string',
            description: 'User full name',
            example: 'John Doe'
          },
          role: {
            type: 'string',
            enum: ['USER', 'ADMIN'],
            description: 'User role',
            example: 'USER'
          },
          isActive: {
            type: 'boolean',
            description: 'User active status',
            example: true
          },
          avatar: {
            type: 'string',
            nullable: true,
            description: 'User avatar URL',
            example: '/uploads/avatars/avatar.jpg'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation date',
            example: '2025-11-01T15:11:00.448Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'User last update date',
            example: '2025-11-01T15:32:18.934Z'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Login successful'
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              },
              accessToken: {
                type: 'string',
                description: 'JWT access token (expires in 15 minutes)',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              refreshToken: {
                type: 'string',
                description: 'JWT refresh token (expires in 7 days)',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              }
            }
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation successful'
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          errors: {
            type: 'object',
            nullable: true,
            example: null,
          },
        },
        required: ['success', 'message'],
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation successful',
          },
          data: {
            type: 'object',
            nullable: true,
            example: null,
          },
        },
        required: ['success', 'message'],
      },
      PaginationResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Users retrieved successfully'
          },
          data: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/User'
                }
              },
              pagination: {
                type: 'object',
                properties: {
                  currentPage: {
                    type: 'integer',
                    example: 1
                  },
                  totalPages: {
                    type: 'integer',
                    example: 5
                  },
                  totalUsers: {
                    type: 'integer',
                    example: 50
                  },
                  hasNextPage: {
                    type: 'boolean',
                    example: true
                  },
                  hasPrevPage: {
                    type: 'boolean',
                    example: false
                  }
                }
              }
            }
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Access token required',
              errors: null
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions to access this resource',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Insufficient permissions',
              errors: null
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'User not found',
              errors: null
            }
          }
        }
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Email and password are required',
              errors: null
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'User Management',
      description: 'User profile and management endpoints'
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/server.js']
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;