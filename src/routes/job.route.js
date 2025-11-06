import express from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyJob,
  getJobApplicants,
  updateApplicationStatus
} from '../controllers/jobController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs with search and filter
 *     description: Browse all available jobs with pagination, search, and filtering options
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title, description, or company
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *           enum: [FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE]
 *         description: Filter by job type
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Filter by company name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, DRAFT]
 *           default: OPEN
 *         description: Filter by job status
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Jobs retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Job'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 */
router.get('/', getAllJobs);

/**
 * @swagger
 * /api/jobs/{jobId}:
 *   get:
 *     summary: Get job details by ID
 *     description: Retrieve detailed information about a specific job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Job retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:jobId', getJobById);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job posting
 *     description: Create a new job (Recruiter or Admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - company
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Senior Frontend Developer"
 *               description:
 *                 type: string
 *                 example: "Join our amazing team as a frontend developer..."
 *               company:
 *                 type: string
 *                 example: "Tech Corp"
 *               location:
 *                 type: string
 *                 example: "Jakarta, Indonesia"
 *               jobType:
 *                 type: string
 *                 enum: [FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE]
 *                 default: FULL_TIME
 *               salary:
 *                 type: string
 *                 example: "Rp 10.000.000 - 15.000.000"
 *               requirements:
 *                 type: string
 *                 example: "Bachelor degree in Computer Science, 3+ years experience"
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["React", "TypeScript", "Next.js"]
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Job created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Job'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Recruiter role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticate, authorize(['RECRUITER', 'ADMIN']), createJob);

/**
 * @swagger
 * /api/jobs/{jobId}:
 *   put:
 *     summary: Update job posting
 *     description: Update an existing job (Owner or Admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               company:
 *                 type: string
 *               location:
 *                 type: string
 *               jobType:
 *                 type: string
 *                 enum: [FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE]
 *               salary:
 *                 type: string
 *               requirements:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [OPEN, CLOSED, DRAFT]
 *     responses:
 *       200:
 *         description: Job updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Job updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Job'
 *       403:
 *         description: Forbidden - Not authorized to update this job
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:jobId', authenticate, authorize(['RECRUITER', 'ADMIN']), updateJob);

/**
 * @swagger
 * /api/jobs/{jobId}:
 *   delete:
 *     summary: Delete job posting
 *     description: Delete a job posting (Owner or Admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Forbidden - Not authorized to delete this job
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:jobId', authenticate, authorize(['RECRUITER', 'ADMIN']), deleteJob);

/**
 * @swagger
 * /api/jobs/{jobId}/apply:
 *   post:
 *     summary: Apply for a job
 *     description: Submit an application for a job posting. Publishes JOB_APPLIED event to Redis.
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *                 example: "I am very interested in this position because..."
 *               resume:
 *                 type: string
 *                 example: "https://example.com/resume.pdf"
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Application submitted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/JobApplication'
 *       400:
 *         description: Bad request - Already applied or job closed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               alreadyApplied:
 *                 summary: Already applied
 *                 value:
 *                   success: false
 *                   message: "You have already applied for this job"
 *               jobClosed:
 *                 summary: Job closed
 *                 value:
 *                   success: false
 *                   message: "This job is no longer accepting applications"
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:jobId/apply', authenticate, applyJob);

/**
 * @swagger
 * /api/jobs/{jobId}/applicants:
 *   get:
 *     summary: Get job applicants
 *     description: Get list of applicants for a job (Job owner or Admin only)
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, REVIEWED, ACCEPTED, REJECTED]
 *         description: Filter by application status
 *     responses:
 *       200:
 *         description: Applicants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Applicants retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     job:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         company:
 *                           type: string
 *                     applications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/JobApplication'
 *                     totalApplicants:
 *                       type: integer
 *                       example: 25
 *       403:
 *         description: Forbidden - Not authorized to view applicants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:jobId/applicants', authenticate, authorize(['RECRUITER', 'ADMIN']), getJobApplicants);

/**
 * @swagger
 * /api/jobs/{jobId}/applicants/{applicationId}:
 *   patch:
 *     summary: Update application status
 *     description: Update the status of a job application (Job owner or Admin only). Publishes APPLICATION_STATUS_CHANGED event to Redis.
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, REVIEWED, ACCEPTED, REJECTED]
 *                 example: "REVIEWED"
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Application status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/JobApplication'
 *       400:
 *         description: Bad request - Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Not authorized to update this application
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:jobId/applicants/:applicationId', authenticate, authorize(['RECRUITER', 'ADMIN']), updateApplicationStatus);

export default router;
