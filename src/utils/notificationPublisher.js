import redisClient from '../config/redis.js';

/**
 * Notification Publisher
 * Publish events ke Redis untuk notifikasi real-time
 */

/**
 * Publish event ke Redis channel
 * @param {string} channel - Redis channel name
 * @param {object} payload - Data yang akan dikirim
 */
export const publishEvent = async (channel, payload) => {
  try {
    if (!redisClient.isOpen) {
      console.warn(`Redis not connected. Event not published to channel: ${channel}`);
      return false;
    }

    const message = JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString()
    });

    await redisClient.publish(channel, message);
    console.log(`Event published to ${channel}:`, payload);
    return true;
  } catch (error) {
    console.error(`Error publishing to ${channel}:`, error.message);
    return false;
  }
};

/**
 * Event Types & Channels
 */
export const EVENTS = {
  JOB_CREATED: 'job.created',
  JOB_UPDATED: 'job.updated',
  JOB_DELETED: 'job.deleted',
  JOB_APPLIED: 'job.applied',
  APPLICATION_STATUS_CHANGED: 'application.status.changed'
};

/**
 * Publish JOB_CREATED event
 */
export const publishJobCreated = async (job, owner) => {
  return await publishEvent(EVENTS.JOB_CREATED, {
    event: 'JOB_CREATED',
    jobId: job.id,
    title: job.title,
    company: job.company,
    ownerId: owner.id,
    ownerName: owner.name || owner.email,
    jobData: {
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      salary: job.salary
    }
  });
};

/**
 * Publish JOB_APPLIED event
 * 
 */
export const publishJobApplied = async (application, job, applicant) => {
  return await publishEvent(EVENTS.JOB_APPLIED, {
    event: 'JOB_APPLIED',
    applicationId: application.id,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    applicantId: applicant.id,
    applicantName: applicant.name || applicant.email,
    applicantEmail: applicant.email,
    recruiterId: job.ownerId,
    notification: {
      type: 'JOB_APPLICATION',
      title: 'New Job Application',
      message: `${applicant.name || applicant.email} applied for ${job.title} at ${job.company}`,
      recipientId: job.ownerId, // Send notification to job owner
      metadata: {
        jobId: job.id,
        applicationId: application.id,
        applicantId: applicant.id
      }
    }
  });
};

/**
 * Publish APPLICATION_STATUS_CHANGED event
 */
export const publishApplicationStatusChanged = async (application, job, applicant, newStatus) => {
  return await publishEvent(EVENTS.APPLICATION_STATUS_CHANGED, {
    event: 'APPLICATION_STATUS_CHANGED',
    applicationId: application.id,
    jobId: job.id,
    jobTitle: job.title,
    applicantId: applicant.id,
    applicantName: applicant.name || applicant.email,
    oldStatus: application.status,
    newStatus: newStatus,
    notification: {
      type: 'APPLICATION_STATUS',
      title: 'Application Status Update',
      message: `Your application for ${job.title} has been ${newStatus.toLowerCase()}`,
      recipientId: applicant.id, // Send notification to applicant
      metadata: {
        jobId: job.id,
        applicationId: application.id,
        status: newStatus
      }
    }
  });
};

export default {
  publishEvent,
  publishJobCreated,
  publishJobApplied,
  publishApplicationStatusChanged,
  EVENTS
};
