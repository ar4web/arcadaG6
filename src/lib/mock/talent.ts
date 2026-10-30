import type { Candidate, Goal, JobOpening, PipelineStage, ReviewCycle } from '@/types';
import { EMPLOYEES } from './people';
import { pick, randomInt, seededRandom } from '@/lib/utils';

const rand = seededRandom(40407);
const ACTIVE = EMPLOYEES.filter((e) => e.status !== 'terminated');
const TODAY = new Date('2026-10-31T00:00:00Z');
const iso = (d: Date) => d.toISOString().slice(0, 10);

/* ---------------------------------- Jobs ----------------------------------- */

const JOB_SEEDS: { title: string; dept: string; openings: number; filled: number; stage: JobOpening['stage'] }[] = [
  { title: 'Senior Backend Engineer', dept: 'tech', openings: 3, filled: 1, stage: 'interviewing' },
  { title: 'Staff Platform Engineer', dept: 'tech', openings: 1, filled: 0, stage: 'sourcing' },
  { title: 'QA Automation Engineer', dept: 'tech', openings: 2, filled: 1, stage: 'interviewing' },
  { title: 'Product Designer', dept: 'product', openings: 2, filled: 0, stage: 'interviewing' },
  { title: 'Senior Product Manager', dept: 'product', openings: 1, filled: 0, stage: 'offer' },
  { title: 'Enterprise Account Executive', dept: 'sales', openings: 4, filled: 2, stage: 'interviewing' },
  { title: 'Sales Development Rep — Arabic', dept: 'sales', openings: 3, filled: 1, stage: 'sourcing' },
  { title: 'Growth Marketing Manager', dept: 'marketing', openings: 1, filled: 0, stage: 'sourcing' },
  { title: 'Payroll Specialist', dept: 'finance', openings: 1, filled: 0, stage: 'offer' },
  { title: 'Financial Analyst', dept: 'finance', openings: 2, filled: 1, stage: 'interviewing' },
  { title: 'HR Business Partner', dept: 'people', openings: 1, filled: 0, stage: 'sourcing' },
  { title: 'Procurement Officer', dept: 'operations', openings: 1, filled: 0, stage: 'interviewing' },
  { title: 'Facilities Coordinator', dept: 'operations', openings: 2, filled: 1, stage: 'closing' },
  { title: 'Compliance Officer', dept: 'legal', openings: 1, filled: 0, stage: 'sourcing' },
];

export const JOBS: JobOpening[] = JOB_SEEDS.map((seed, i) => {
  const head = EMPLOYEES.find((e) => e.departmentId === seed.dept && e.managerId !== null && e.grade.startsWith('M'));
  const opened = new Date(TODAY.getTime() - randomInt(rand, 12, 140) * 86_400_000);
  return {
    id: `job_${500 + i}`,
    title: seed.title,
    departmentId: seed.dept,
    locationId: pick(['riyadh', 'riyadh', 'jeddah', 'remote'], rand),
    type: rand() < 0.85 ? 'full_time' : 'contract',
    status: seed.stage === 'closing' ? 'open' : rand() < 0.93 ? 'open' : 'paused',
    openings: seed.openings,
    filled: seed.filled,
    openedAt: iso(opened),
    hiringManagerId: (head ?? ACTIVE[i])!.id,
    salaryRange: [18_000, 32_000],
    stage: seed.stage,
  };
});

/* -------------------------------- Candidates ------------------------------- */

const CANDIDATE_NAMES = [
  'Aisha Bello', 'Marco Rossi', 'Sam Carter', 'Elena Petrova', 'Julia Kim', 'Omar Haddad',
  'Nora Al-Ali', 'Tom Becker', 'Ivy Chen', 'Sara Novak', 'Ben Koch', 'Ana Ruiz',
  'Yusuf Demir', 'Hana Suzuki', 'Ravi Kapoor', 'Lina Farouk', 'Adam Kowalski', 'Maya Cohen',
  'Omar Al-Sabah', 'Grace Mwangi', 'Lucas Ferreira', 'Sofia Rossi', 'Ali Rezaei', 'Nadia Benali',
  'Peter Novak', 'Zainab Haidar', 'Hassan Al-Amin', 'Mira Patel', 'Khalid Bin Salem', 'Ella Johansson',
  'Rami Nasser', 'Talia Aziz', 'Farah Al-Din', 'Hugo Martins', 'Leen Barakat', 'Yara Chidiac',
  'Nasser Al-Qahtani', 'Dana Refai', 'Mustafa Kamal', 'Layla Haddad', 'Tomasz Nowak', 'Amira Saleh',
  'Chen Wei', 'Priya Raman', 'Karim Hobeika', 'Selin Aydin', 'Ruth Gebre', 'Fadi Nassar',
  'Nour Hamdan', 'Ibrahim Toure', 'Maya Seif', 'Ola Karlsson', 'Saif Al-Mansoori', 'Rita Kahale',
  'Jonas Weber', 'Hind Al-Suwaidi', 'Emre Yildiz', 'Lara Khoury', 'Ziad Barakat', 'Anya Volkov',
];

const STAGES: PipelineStage[] = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const SOURCES: Candidate['source'][] = ['linkedin', 'referral', 'website', 'agency', 'job_board'];
const CANDIDATE_NATIONALITIES = ['Saudi', 'Egyptian', 'Indian', 'Jordanian', 'Lebanese', 'British', 'Filipino', 'Pakistani', 'Turkish'];

export const CANDIDATES: Candidate[] = CANDIDATE_NAMES.map((name, i) => {
  const job = JOBS[i % JOBS.length]!;
  const stage = STAGES[i % 6] === 'rejected' && i % 11 !== 0 ? 'rejected' : (['applied', 'screening', 'interview', 'interview', 'offer', 'hired'] as PipelineStage[])[i % 6]!;
  return {
    id: `cand_${700 + i}`,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    jobId: job.id,
    stage,
    source: pick(SOURCES, rand),
    appliedAt: iso(new Date(TODAY.getTime() - randomInt(rand, 1, 48) * 86_400_000)),
    rating: randomInt(rand, 2, 5),
    avatarHue: Math.floor(rand() * 360),
    nationality: pick(CANDIDATE_NATIONALITIES, rand),
    notes: pick(
      [
        'Strong technical depth, clear communicator.',
        'Exceeds the bar on system design. Salary expectation above band.',
        'Good culture fit. Needs a second technical round.',
        'Referred by the engineering team. Excellent references.',
        'Solid portfolio, limited enterprise experience.',
        'Available from next month. Visa transfer required.',
      ],
      rand,
    ),
  };
});

/* -------------------------------- Performance ------------------------------ */

export const REVIEW_CYCLES: ReviewCycle[] = [
  { id: 'cyc_2026_h2', name: 'H2 2026 performance review', period: '2026-H2', status: 'active', participants: 194, completed: 118, dueDate: '2026-11-30' },
  { id: 'cyc_2026_h1', name: 'H1 2026 performance review', period: '2026-H1', status: 'closed', participants: 188, completed: 188, dueDate: '2026-06-30' },
  { id: 'cyc_2026_q4', name: 'Q4 2026 calibration', period: '2026-Q4', status: 'calibration', participants: 42, completed: 42, dueDate: '2026-12-15' },
  { id: 'cyc_2027_h1', name: 'H1 2027 goal setting', period: '2027-H1', status: 'draft', participants: 0, completed: 0, dueDate: '2027-01-31' },
];

const GOAL_TITLES = [
  'Ship the payroll API v2',
  'Reduce cloud spend by 15%',
  'Grow Saudi enterprise pipeline to SAR 12M',
  'Launch the Arabic self-service portal',
  'Cut time-to-hire under 32 days',
  'Increase engagement score to 8.4',
  'Automate GOSI filing end-to-end',
  'Certify 12 engineers on secure coding',
  'Deliver Q4 board reporting pack',
  'Consolidate vendors from 40 to 25',
];

export const GOALS: Goal[] = [];
ACTIVE.slice(0, 90).forEach((employee, i) => {
  const count = randomInt(rand, 2, 4);
  for (let j = 0; j < count; j++) {
    const progress = randomInt(rand, 0, 100);
    GOALS.push({
      id: `goal_${900 + GOALS.length}`,
      employeeId: employee.id,
      title: GOAL_TITLES[(i + j * 3) % GOAL_TITLES.length]!,
      weight: [40, 30, 20, 10][j % 4]!,
      progress,
      status: progress >= 100 ? 'done' : progress === 0 ? 'not_started' : progress < 45 ? 'at_risk' : 'on_track',
      dueDate: '2026-12-31',
      category: j === 3 ? 'development' : j === 2 ? 'people' : 'business',
    });
  }
});
