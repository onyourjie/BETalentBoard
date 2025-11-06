import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import { publishJobCreated, publishJobApplied, publishApplicationStatusChanged } from '../utils/notificationPublisher.js';

/**
 * @desc    Create new job
 * @route   POST /api/jobs
 * @access  Private (Recruiter only)
 */
export const createJob = async (req, res) => {
  try {
    const { title, description, company, location, jobType, salary, requirements, skills } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !description || !company) {
      return errorResponse(res, 'Title, description, and company are required', 400);
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        title,
        description,
        company,
        location,
        jobType: jobType || 'FULL_TIME',
        salary,
        requirements,
        skills: skills || [],
        ownerId: userId,
        status: 'OPEN'
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Publish event ke Redis
    await publishJobCreated(job, req.user);

    return successResponse(res, 'Job created successfully', job, 201);
  } catch (error) {
    console.error('Error creating job:', error);
    return errorResponse(res, 'Failed to create job', 500);
  }
};

/**
 * @desc    Get all jobs with search, filter, pagination
 * @route   GET /api/jobs
 * @access  Public
 */
export const getAllJobs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      jobType, 
      location, 
      company,
      status = 'OPEN'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter
    const where = {
      status: status,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(jobType && { jobType }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(company && { company: { contains: company, mode: 'insensitive' } })
    };

    // Get jobs with pagination
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.job.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    return successResponse(res, 'Jobs retrieved successfully', {
      jobs,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    return errorResponse(res, 'Failed to get jobs', 500);
  }
};

/**
 * @desc    Get job by ID
 * @route   GET /api/jobs/:jobId
 * @access  Public
 */
export const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }

    return successResponse(res, 'Job retrieved successfully', job);
  } catch (error) {
    console.error('Error getting job:', error);
    return errorResponse(res, 'Failed to get job', 500);
  }
};

/**
 * @desc    Update job
 * @route   PUT /api/jobs/:jobId
 * @access  Private (Owner only)
 */
export const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const { title, description, company, location, jobType, salary, requirements, skills, status } = req.body;

    // Check if job exists and user is owner
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!existingJob) {
      return errorResponse(res, 'Job not found', 404);
    }

    if (existingJob.ownerId !== userId && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'You are not authorized to update this job', 403);
    }

    // Update job
    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(company && { company }),
        ...(location !== undefined && { location }),
        ...(jobType && { jobType }),
        ...(salary !== undefined && { salary }),
        ...(requirements !== undefined && { requirements }),
        ...(skills && { skills }),
        ...(status && { status })
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return successResponse(res, 'Job updated successfully', job);
  } catch (error) {
    console.error('Error updating job:', error);
    return errorResponse(res, 'Failed to update job', 500);
  }
};

/**
 * @desc    Delete job
 * @route   DELETE /api/jobs/:jobId
 * @access  Private (Owner only)
 */
export const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Check if job exists and user is owner
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }

    if (job.ownerId !== userId && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'You are not authorized to delete this job', 403);
    }

    // Delete job (akan cascade delete applications juga)
    await prisma.job.delete({
      where: { id: jobId }
    });

    return successResponse(res, 'Job deleted successfully', null);
  } catch (error) {
    console.error('Error deleting job:', error);
    return errorResponse(res, 'Failed to delete job', 500);
  }
};

/**
 * @desc    Apply for a job
 * @route   POST /api/jobs/:jobId/apply
 * @access  Private
 */
export const applyJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const { coverLetter, resume } = req.body;

    // Check if job exists and is open
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        owner: true
      }
    });

    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }

    if (job.status !== 'OPEN') {
      return errorResponse(res, 'This job is no longer accepting applications', 400);
    }

    // Check if user is not the job owner
    if (job.ownerId === userId) {
      return errorResponse(res, 'You cannot apply for your own job', 400);
    }

    // Check if already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_applicantId: {
          jobId,
          applicantId: userId
        }
      }
    });

    if (existingApplication) {
      return errorResponse(res, 'You have already applied for this job', 400);
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        applicantId: userId,
        coverLetter,
        resume,
        status: 'PENDING'
      },
      include: {
        job: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // ✅ Publish event ke Redis (sesuai diagram!)
    await publishJobApplied(application, job, req.user);

    return successResponse(res, 'Application submitted successfully', application, 201);
  } catch (error) {
    console.error('Error applying for job:', error);
    return errorResponse(res, 'Failed to apply for job', 500);
  }
};

/**
 * @desc    Get applicants for a job
 * @route   GET /api/jobs/:jobId/applicants
 * @access  Private (Job owner only)
 */
export const getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const { status } = req.query;

    // Check if job exists and user is owner
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }

    if (job.ownerId !== userId && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'You are not authorized to view applicants for this job', 403);
    }

    // Get applications
    const where = {
      jobId,
      ...(status && { status })
    };

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            username: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    return successResponse(res, 'Applicants retrieved successfully', {
      job: {
        id: job.id,
        title: job.title,
        company: job.company
      },
      applications,
      totalApplicants: applications.length
    });
  } catch (error) {
    console.error('Error getting applicants:', error);
    return errorResponse(res, 'Failed to get applicants', 500);
  }
};

/**
 * @desc    Update application status
 * @route   PATCH /api/jobs/:jobId/applicants/:applicationId
 * @access  Private (Job owner only)
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Validate status
    const validStatuses = ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    // Check if application exists
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        applicant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    if (application.jobId !== jobId) {
      return errorResponse(res, 'Application does not belong to this job', 400);
    }

    // Check authorization
    if (application.job.ownerId !== userId && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'You are not authorized to update this application', 403);
    }

    // Update status
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true
          }
        }
      }
    });

    // Publish event ke Redis
    await publishApplicationStatusChanged(
      application,
      application.job,
      application.applicant,
      status
    );

    return successResponse(res, 'Application status updated successfully', updatedApplication);
  } catch (error) {
    console.error('Error updating application status:', error);
    return errorResponse(res, 'Failed to update application status', 500);
  }
};
