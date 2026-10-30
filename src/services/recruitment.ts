import type { Candidate, JobOpening, PipelineStage } from '@/types';
import { db } from '@/lib/mock/db';
import { request, write } from './api';

export async function listJobs(): Promise<JobOpening[]> {
  return request(() => [...db.jobs]);
}

export async function listCandidates(jobId?: string): Promise<Candidate[]> {
  return request(() => (jobId ? db.candidates.filter((c) => c.jobId === jobId) : [...db.candidates]));
}

export async function pipeline() {
  return request(() => {
    const stages: PipelineStage[] = ['applied', 'screening', 'interview', 'offer', 'hired'];
    return stages.map((stage) => ({
      stage,
      candidates: db.candidates.filter((c) => c.stage === stage),
    }));
  });
}

export async function moveCandidate(id: string, stage: PipelineStage): Promise<Candidate> {
  return write(() => {
    const candidate = db.candidates.find((c) => c.id === id);
    if (!candidate) throw new Error('Candidate not found');
    candidate.stage = stage;
    return candidate;
  });
}

export async function recruitmentFunnel() {
  return request(() => {
    const stages: PipelineStage[] = ['applied', 'screening', 'interview', 'offer', 'hired'];
    const counts = stages.map((stage) => ({ stage, value: db.candidates.filter((c) => c.stage === stage).length }));
    return counts;
  });
}

export async function sourceEffectiveness() {
  return request(() =>
    ['linkedin', 'referral', 'website', 'agency', 'job_board'].map((source) => ({
      label: source,
      value: db.candidates.filter((c) => c.source === source && (c.stage === 'hired' || c.stage === 'offer')).length,
      total: db.candidates.filter((c) => c.source === source).length,
    })),
  );
}
