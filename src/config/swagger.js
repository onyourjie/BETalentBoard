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
  tags: [
    {
      name: 'Health Check',
      description: 'API health and status endpoints'
    },
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'User Profile',
      description: 'User profile management endpoints'
    },
    {
      name: 'User Management',
      description: 'Admin user management endpoints'
    },
    {
      name: 'Jobs',
      description: 'Job posting and browsing endpoints'
    },
    {
      name: 'Job Applications',
      description: 'Job application management endpoints'
    }
  ],
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
      Job: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Job unique identifier',
            example: 'clxyz123abc'
          },
          title: {
            type: 'string',
            description: 'Job title',
            example: 'Senior Frontend Developer'
          },
          description: {
            type: 'string',
            description: 'Job description',
            example: 'We are looking for a talented frontend developer...'
          },
          company: {
            type: 'string',
            description: 'Company name',
            example: 'Tech Corp'
          },
          location: {
            type: 'string',
            nullable: true,
            description: 'Job location',
            example: 'Jakarta, Indonesia'
          },
          jobType: {
            type: 'string',
            enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'],
            description: 'Type of employment',
            example: 'FULL_TIME'
          },
          salary: {
            type: 'string',
            nullable: true,
            description: 'Salary range',
            example: 'Rp 10.000.000 - 15.000.000'
          },
          requirements: {
            type: 'string',
            nullable: true,
            description: 'Job requirements',
            example: 'Bachelor degree in Computer Science'
          },
          skills: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Required skills',
            example: ['React', 'TypeScript', 'Next.js']
          },
          status: {
            type: 'string',
            enum: ['OPEN', 'CLOSED', 'DRAFT'],
            description: 'Job status',
            example: 'OPEN'
          },
          ownerId: {
            type: 'string',
            description: 'Job owner/recruiter ID',
            example: 'cluser123'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-11-01T15:11:00.448Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-11-01T15:32:18.934Z'
          }
        }
      },
      JobApplication: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Application ID',
            example: 'clapp123'
          },
          jobId: {
            type: 'string',
            description: 'Job ID',
            example: 'cljob123'
          },
          applicantId: {
            type: 'string',
            description: 'Applicant user ID',
            example: 'cluser123'
          },
          coverLetter: {
            type: 'string',
            nullable: true,
            description: 'Cover letter',
            example: 'I am very interested in this position...'
          },
          resume: {
            type: 'string',
            nullable: true,
            description: 'Resume URL',
            example: 'https://example.com/resume.pdf'
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'],
            description: 'Application status',
            example: 'PENDING'
          },
          appliedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-11-02T10:30:00.000Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-11-02T10:30:00.000Z'
          }
        }
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