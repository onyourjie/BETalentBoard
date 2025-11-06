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

// Public routes
router.get('/', getAllJobs);
router.get('/:jobId', getJobById);

// Protected routes - Job Management
router.post('/', authenticate, authorize(['RECRUITER', 'ADMIN']), createJob);
router.put('/:jobId', authenticate, authorize(['RECRUITER', 'ADMIN']), updateJob);
router.delete('/:jobId', authenticate, authorize(['RECRUITER', 'ADMIN']), deleteJob);

// Protected routes - Job Application
router.post('/:jobId/apply', authenticate, applyJob);
router.get('/:jobId/applicants', authenticate, authorize(['RECRUITER', 'ADMIN']), getJobApplicants);
router.patch('/:jobId/applicants/:applicationId', authenticate, authorize(['RECRUITER', 'ADMIN']), updateApplicationStatus);

export default router;
