import type { Employee, EmploymentType, EmployeeStatus, Gender } from '@/types';
import { BANKS, DEPARTMENTS, GRADE_BANDS, GRADES, LOCATIONS, NATIONALITIES } from './master';
import { pick, randomInt, seededRandom } from '@/lib/utils';

interface NameSeed {
  en: string;
  ar: string;
}

const FAMILY: (NameSeed & { region: 'saudi' | 'expat' })[] = [
  { en: 'Al-Qahtani', ar: 'القحطاني', region: 'saudi' },
  { en: 'Al-Otaibi', ar: 'العتيبي', region: 'saudi' },
  { en: 'Al-Harbi', ar: 'الحربي', region: 'saudi' },
  { en: 'Al-Dossari', ar: 'الدوسري', region: 'saudi' },
  { en: 'Al-Shehri', ar: 'الشهري', region: 'saudi' },
  { en: 'Al-Zahrani', ar: 'الزهراني', region: 'saudi' },
  { en: 'Al-Ghamdi', ar: 'الغامدي', region: 'saudi' },
  { en: 'Al-Mutairi', ar: 'المطيري', region: 'saudi' },
  { en: 'Al-Anzi', ar: 'العنزي', region: 'saudi' },
  { en: 'Al-Shammari', ar: 'الشمري', region: 'saudi' },
  { en: 'Al-Amri', ar: 'العمري', region: 'saudi' },
  { en: 'Al-Rashid', ar: 'الراشد', region: 'saudi' },
  { en: 'Al-Juhani', ar: 'الجهني', region: 'saudi' },
  { en: 'Al-Subaie', ar: 'السبيعي', region: 'saudi' },
  { en: 'Al-Yami', ar: 'اليامي', region: 'saudi' },
  { en: 'Al-Sulaiman', ar: 'السليمان', region: 'saudi' },
  { en: 'Al-Balawi', ar: 'البلوي', region: 'saudi' },
  { en: 'Al-Qurashi', ar: 'القُرشي', region: 'saudi' },
  { en: 'Al-Farsi', ar: 'الفارسي', region: 'saudi' },
  { en: 'Mansour', ar: 'منصور', region: 'expat' },
  { en: 'Haddad', ar: 'حداد', region: 'expat' },
  { en: 'Nair', ar: 'ناير', region: 'expat' },
  { en: 'Menon', ar: 'مينون', region: 'expat' },
  { en: 'Santos', ar: 'سانتوس', region: 'expat' },
  { en: 'Reyes', ar: 'رييس', region: 'expat' },
  { en: 'Raza', ar: 'رضا', region: 'expat' },
  { en: 'Khalil', ar: 'خليل', region: 'expat' },
  { en: 'Chehade', ar: 'شحادة', region: 'expat' },
  { en: 'Whitfield', ar: 'ويتفيلد', region: 'expat' },
  { en: 'Obi', ar: 'أوبي', region: 'expat' },
  { en: 'Rahmawati', ar: 'رحماواتي', region: 'expat' },
  { en: 'Zhang', ar: 'تشانغ', region: 'expat' },
  { en: 'Barakat', ar: 'بركات', region: 'expat' },
  { en: 'Siddiqui', ar: 'صديقي', region: 'expat' },
  { en: 'Aziz', ar: 'عزيز', region: 'expat' },
  { en: 'Bello', ar: 'بيلو', region: 'expat' },
  { en: 'Nassar', ar: 'نصار', region: 'expat' },
  { en: 'Fares', ar: 'فارس', region: 'expat' },
];

const MALE_FIRST: NameSeed[] = [
  { en: 'Abdullah', ar: 'عبدالله' },
  { en: 'Mohammed', ar: 'محمد' },
  { en: 'Faisal', ar: 'فيصل' },
  { en: 'Khalid', ar: 'خالد' },
  { en: 'Sultan', ar: 'سلطان' },
  { en: 'Turki', ar: 'تركي' },
  { en: 'Yazeed', ar: 'يزيد' },
  { en: 'Bandar', ar: 'بندر' },
  { en: 'Fahad', ar: 'فهد' },
  { en: 'Saleh', ar: 'صالح' },
  { en: 'Omar', ar: 'عمر' },
  { en: 'Ahmed', ar: 'أحمد' },
  { en: 'Youssef', ar: 'يوسف' },
  { en: 'Tareq', ar: 'طارق' },
  { en: 'Karim', ar: 'كريم' },
  { en: 'Bilal', ar: 'بلال' },
  { en: 'Hamza', ar: 'حمزة' },
  { en: 'Ziyad', ar: 'زياد' },
  { en: 'Rakan', ar: 'راكان' },
  { en: 'Nawaf', ar: 'نواف' },
  { en: 'Saad', ar: 'سعد' },
  { en: 'Majed', ar: 'ماجد' },
  { en: 'Anas', ar: 'أنس' },
  { en: 'Ibrahim', ar: 'إبراهيم' },
  { en: 'Ali', ar: 'علي' },
  { en: 'Hassan', ar: 'حسن' },
  { en: 'Ammar', ar: 'عمار' },
  { en: 'Waleed', ar: 'وليد' },
  { en: 'Mishaal', ar: 'مشعل' },
  { en: 'Vikram', ar: 'فيكرام' },
  { en: 'Adeel', ar: 'عادل' },
  { en: 'Jomar', ar: 'جومار' },
  { en: 'Daniel', ar: 'دانيال' },
  { en: 'Emeka', ar: 'إيميكا' },
  { en: 'Wei', ar: 'وي' },
];

const FEMALE_FIRST: NameSeed[] = [
  { en: 'Noura', ar: 'نورة' },
  { en: 'Reem', ar: 'ريم' },
  { en: 'Sara', ar: 'سارة' },
  { en: 'Lama', ar: 'لمى' },
  { en: 'Hessa', ar: 'حصة' },
  { en: 'Ghada', ar: 'غادة' },
  { en: 'Maha', ar: 'مها' },
  { en: 'Amal', ar: 'أمل' },
  { en: 'Fatima', ar: 'فاطمة' },
  { en: 'Aisha', ar: 'عائشة' },
  { en: 'Hala', ar: 'هالة' },
  { en: 'Leila', ar: 'ليلى' },
  { en: 'Rania', ar: 'رانيا' },
  { en: 'Noor', ar: 'نور' },
  { en: 'Dina', ar: 'دينا' },
  { en: 'Huda', ar: 'هدى' },
  { en: 'Layan', ar: 'ليان' },
  { en: 'Shahad', ar: 'شهد' },
  { en: 'Jawaher', ar: 'جواهر' },
  { en: 'Moudi', ar: 'مودي' },
  { en: 'Dalal', ar: 'دلال' },
  { en: 'Rana', ar: 'رنا' },
  { en: 'Yara', ar: 'يارا' },
  { en: 'Salma', ar: 'سلمى' },
  { en: 'Haya', ar: 'هيا' },
  { en: 'Nada', ar: 'ندى' },
  { en: 'Maria', ar: 'ماريا' },
  { en: 'Priya', ar: 'بريا' },
  { en: 'Siti', ar: 'سيتي' },
  { en: 'Aylin', ar: 'آيلين' },
];

interface TitleSeed {
  en: string;
  ar: string;
  grade: string;
  level: 'head' | 'senior' | 'mid' | 'junior';
}

const TITLES: Record<string, TitleSeed[]> = {
  tech: [
    { en: 'Chief Technology Officer', ar: 'الرئيس التنفيذي للتقنية', grade: 'M2', level: 'head' },
    { en: 'Engineering Manager', ar: 'مدير هندسة', grade: 'M1', level: 'senior' },
    { en: 'Staff Software Engineer', ar: 'مهندس برمجيات رئيسي', grade: 'G6', level: 'senior' },
    { en: 'Senior Backend Engineer', ar: 'مهندس أنظمة خلفية أول', grade: 'G5', level: 'senior' },
    { en: 'Senior Frontend Engineer', ar: 'مهندس واجهات أول', grade: 'G5', level: 'senior' },
    { en: 'DevOps Engineer', ar: 'مهندس عمليات وتشغيل', grade: 'G4', level: 'mid' },
    { en: 'Data Engineer', ar: 'مهندس بيانات', grade: 'G4', level: 'mid' },
    { en: 'QA Engineer', ar: 'مهندس جودة', grade: 'G3', level: 'mid' },
    { en: 'Software Engineer', ar: 'مهندس برمجيات', grade: 'G3', level: 'mid' },
    { en: 'Associate Engineer', ar: 'مهندس مساعد', grade: 'G1', level: 'junior' },
  ],
  product: [
    { en: 'VP of Product', ar: 'نائب الرئيس للمنتجات', grade: 'M1', level: 'head' },
    { en: 'Design Lead', ar: 'قائد التصميم', grade: 'G6', level: 'senior' },
    { en: 'Senior Product Manager', ar: 'مدير منتج أول', grade: 'G5', level: 'senior' },
    { en: 'Product Designer', ar: 'مصمم منتجات', grade: 'G4', level: 'mid' },
    { en: 'UX Researcher', ar: 'باحث تجربة المستخدم', grade: 'G4', level: 'mid' },
    { en: 'Product Manager', ar: 'مدير منتج', grade: 'G4', level: 'mid' },
    { en: 'Product Analyst', ar: 'محلل منتجات', grade: 'G3', level: 'mid' },
    { en: 'Design Intern', ar: 'متدرب تصميم', grade: 'G1', level: 'junior' },
  ],
  sales: [
    { en: 'Chief Revenue Officer', ar: 'الرئيس التنفيذي للإيرادات', grade: 'M2', level: 'head' },
    { en: 'Head of Enterprise Sales', ar: 'رئيس مبيعات المؤسسات', grade: 'M1', level: 'senior' },
    { en: 'Key Account Manager', ar: 'مدير حسابات رئيسية', grade: 'G5', level: 'senior' },
    { en: 'Senior Account Executive', ar: 'مدير حسابات أول', grade: 'G4', level: 'mid' },
    { en: 'Account Executive', ar: 'مدير حسابات', grade: 'G3', level: 'mid' },
    { en: 'Sales Development Rep', ar: 'ممثل تطوير مبيعات', grade: 'G2', level: 'junior' },
    { en: 'Sales Operations Analyst', ar: 'محلل عمليات مبيعات', grade: 'G3', level: 'mid' },
  ],
  marketing: [
    { en: 'Head of Marketing', ar: 'رئيس التسويق', grade: 'M1', level: 'head' },
    { en: 'Brand Manager', ar: 'مدير العلامة التجارية', grade: 'G5', level: 'senior' },
    { en: 'Growth Marketer', ar: 'مسوق النمو', grade: 'G4', level: 'mid' },
    { en: 'Content Strategist', ar: 'استراتيجي المحتوى', grade: 'G3', level: 'mid' },
    { en: 'Performance Marketing Analyst', ar: 'محلل تسويق أداء', grade: 'G3', level: 'mid' },
    { en: 'Marketing Coordinator', ar: 'منسق تسويق', grade: 'G2', level: 'junior' },
  ],
  finance: [
    { en: 'Chief Financial Officer', ar: 'الرئيس التنفيذي للمالية', grade: 'M2', level: 'head' },
    { en: 'Finance Manager', ar: 'مدير مالية', grade: 'M1', level: 'senior' },
    { en: 'Financial Controller', ar: 'مراقب مالي', grade: 'G6', level: 'senior' },
    { en: 'Senior Financial Analyst', ar: 'محلل مالي أول', grade: 'G5', level: 'senior' },
    { en: 'Payroll Specialist', ar: 'أخصائي رواتب', grade: 'G3', level: 'mid' },
    { en: 'Accounts Payable Specialist', ar: 'أخصائي حسابات دائنة', grade: 'G3', level: 'mid' },
    { en: 'Accountant', ar: 'محاسب', grade: 'G3', level: 'mid' },
    { en: 'Finance Intern', ar: 'متدرب مالية', grade: 'G1', level: 'junior' },
  ],
  people: [
    { en: 'Chief People Officer', ar: 'الرئيس التنفيذي للموارد البشرية', grade: 'M1', level: 'head' },
    { en: 'Senior HR Business Partner', ar: 'شريك موارد بشرية أول', grade: 'G6', level: 'senior' },
    { en: 'Talent Acquisition Lead', ar: 'قائد استقطاب المواهب', grade: 'G5', level: 'senior' },
    { en: 'People Operations Specialist', ar: 'أخصائي عمليات موارد بشرية', grade: 'G3', level: 'mid' },
    { en: 'Total Rewards Analyst', ar: 'محلل المزايا والتعويضات', grade: 'G4', level: 'mid' },
    { en: 'Recruitment Coordinator', ar: 'منسق توظيف', grade: 'G2', level: 'junior' },
  ],
  operations: [
    { en: 'Head of Operations', ar: 'رئيس العمليات', grade: 'M1', level: 'head' },
    { en: 'Operations Manager', ar: 'مدير عمليات', grade: 'G6', level: 'senior' },
    { en: 'Procurement Officer', ar: 'مسؤول مشتريات', grade: 'G4', level: 'mid' },
    { en: 'Facilities Coordinator', ar: 'منسق مرافق', grade: 'G3', level: 'mid' },
    { en: 'Office Manager', ar: 'مدير مكتب', grade: 'G3', level: 'mid' },
    { en: 'Operations Associate', ar: 'مساعد عمليات', grade: 'G1', level: 'junior' },
  ],
  legal: [
    { en: 'General Counsel', ar: 'المستشار القانوني العام', grade: 'M1', level: 'head' },
    { en: 'Senior Legal Counsel', ar: 'مستشار قانوني أول', grade: 'G6', level: 'senior' },
    { en: 'Compliance Officer', ar: 'مسؤول الامتثال', grade: 'G5', level: 'senior' },
    { en: 'Paralegal', ar: 'مساعد قانوني', grade: 'G3', level: 'mid' },
  ],
};

const DEPT_HEADCOUNT: Record<string, number> = {
  tech: 58,
  product: 24,
  sales: 38,
  marketing: 18,
  finance: 16,
  people: 12,
  operations: 20,
  legal: 8,
};

const SKILLS: Record<string, string[]> = {
  tech: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Kubernetes', 'AWS', 'Terraform', 'GraphQL', 'Python'],
  product: ['Figma', 'Design systems', 'User research', 'Roadmapping', 'Prototyping', 'Analytics'],
  sales: ['Enterprise sales', 'Salesforce', 'Negotiation', 'Pipeline management', 'Arabic', 'English'],
  marketing: ['SEO', 'Content', 'Paid media', 'Brand', 'HubSpot', 'Copywriting'],
  finance: ['IFRS', 'ZATCA', 'Excel', 'SAP', 'Payroll', 'VAT', 'Forecasting'],
  people: ['Saudi Labor Law', 'GOSI', 'QIWA', 'Recruiting', 'HRIS', 'Total rewards'],
  operations: ['Procurement', 'Vendor management', 'Facilities', 'Logistics', 'Health & safety'],
  legal: ['Corporate law', 'Contracts', 'PDPL', 'Compliance', 'Governance'],
};

function pickByLevel(titles: TitleSeed[], rand: () => number) {
  const roll = rand();
  const pool =
    roll < 0.28
      ? titles.filter((t) => t.level === 'senior')
      : roll < 0.8
        ? titles.filter((t) => t.level === 'mid')
        : titles.filter((t) => t.level === 'junior' || t.level === 'mid');
  return pick(pool.length ? pool : titles, rand);
}

function weightedNationality(rand: () => number) {
  const total = NATIONALITIES.reduce((a, n) => a + n.weight, 0);
  let roll = rand() * total;
  for (const n of NATIONALITIES) {
    roll -= n.weight;
    if (roll <= 0) return n;
  }
  return NATIONALITIES[0]!;
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function ibanFor(bankCode: string, rand: () => number) {
  const digits = Array.from({ length: 18 }, () => Math.floor(rand() * 10)).join('');
  return `SA${Math.floor(rand() * 90 + 10)}${bankCode}${digits}`;
}

const TODAY = new Date('2026-10-31T00:00:00Z');

export function buildEmployees(): Employee[] {
  const rand = seededRandom(20261031);
  const employees: Employee[] = [];
  let sequence = 1000;
  let femaleRoll = 0;

  for (const dept of DEPARTMENTS) {
    const headcount = DEPT_HEADCOUNT[dept.id] ?? 10;
    const titles = TITLES[dept.id] ?? TITLES.tech!;

    for (let i = 0; i < headcount; i++) {
      sequence += 1;
      femaleRoll += 0.37;
      const gender: Gender = femaleRoll % 1 < 0.31 ? 'female' : 'male';

      const nationality = i === 0 ? NATIONALITIES[0]! : weightedNationality(rand);
      const familyPool = FAMILY.filter((f) => (nationality.saudi ? f.region === 'saudi' : f.region === 'expat'));
      const family = pick(familyPool.length ? familyPool : FAMILY, rand);
      const first = pick(gender === 'female' ? FEMALE_FIRST : MALE_FIRST, rand);

      const title = i === 0 ? titles[0]! : pickByLevel(titles, rand);

      const grade = title.grade;
      const [min, max] = GRADE_BANDS[grade] ?? [10_000, 20_000];
      const basic = Math.round((min + (max - min) * rand()) / 100) * 100;
      const housing = Math.round((basic * 0.25) / 50) * 50;
      const transport = Math.round((basic * 0.1) / 50) * 50;
      const allowances = rand() < 0.35 ? Math.round((basic * 0.08) / 50) * 50 : 0;

      // Hire dates: 60% spread 2016–2025, 40% within the last 20 months.
      let hireYear: number;
      let hireMonth: number;
      let hireDay: number;
      if (rand() < 0.4) {
        const monthsAgo = randomInt(rand, 0, 20);
        const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - monthsAgo, randomInt(rand, 1, 27));
        hireYear = d.getFullYear();
        hireMonth = d.getMonth() + 1;
        hireDay = d.getDate();
      } else {
        hireYear = randomInt(rand, 2015, 2024);
        hireMonth = randomInt(rand, 1, 12);
        hireDay = randomInt(rand, 1, 27);
      }

      const hireDate = isoDate(hireYear, hireMonth, hireDay);
      const daysSinceHire = Math.floor((TODAY.getTime() - new Date(hireDate).getTime()) / 86_400_000);

      let status: EmployeeStatus = 'active';
      const statusRoll = rand();
      if (daysSinceHire < 95) status = 'probation';
      else if (statusRoll < 0.045) status = 'on_leave';
      else if (statusRoll < 0.062) status = 'notice';

      const rating = Math.round((2.6 + rand() * 2.2) * 10) / 10;
      const potential = (rating > 4.2 ? 3 : rating > 3.4 ? (rand() < 0.5 ? 2 : 3) : rand() < 0.55 ? 2 : 1) as 1 | 2 | 3;
      const engagement = Math.round((5.9 + rand() * 3.9) * 10) / 10;
      const flightRisk = engagement < 7.1 ? 'high' : engagement < 8.2 ? 'medium' : 'low';

      const nationality_is_saudi = nationality.saudi;
      const nationalId = nationality_is_saudi
        ? `1${Array.from({ length: 9 }, () => Math.floor(rand() * 10)).join('')}`
        : `2${Array.from({ length: 9 }, () => Math.floor(rand() * 10)).join('')}`;

      const iqamaExpiry = nationality_is_saudi
        ? undefined
        : isoDate(TODAY.getFullYear() + (rand() < 0.22 ? 0 : 1), randomInt(rand, 1, 12), randomInt(rand, 1, 27));
      const contractExpiry = isoDate(TODAY.getFullYear() + (rand() < 0.4 ? 0 : 1), randomInt(rand, 1, 12), randomInt(rand, 1, 27));
      const insuranceExpiry = isoDate(TODAY.getFullYear() + 1, randomInt(rand, 1, 12), randomInt(rand, 1, 27));
      const passportExpiry = isoDate(TODAY.getFullYear() + randomInt(rand, 0, 6), randomInt(rand, 1, 12), randomInt(rand, 1, 27));

      const seniorityBias = title.level === 'junior' ? 0.55 : title.level === 'mid' ? 0.25 : 0.08;
      const annualTaken = Math.min(21, Math.round(randomInt(rand, 0, 18) * (1 - seniorityBias) + rand() * 4));

      const bank = pick(BANKS, rand);

      const employee: Employee = {
        id: `emp_${sequence}`,
        employeeNo: `Q-${String(sequence).padStart(4, '0')}`,
        firstName: first.en,
        lastName: family.en,
        nameAr: `${first.ar} ${family.ar}`,
        email: `${first.en.toLowerCase().replace(/[^a-z]/g, '')}.${family.en.toLowerCase().replace(/[^a-z]/g, '')}@qimma.sa`,
        phone: `+9665${Array.from({ length: 8 }, () => Math.floor(rand() * 10)).join('')}`,
        avatarHue: Math.floor(rand() * 360),
        gender,
        birthDate: isoDate(randomInt(rand, 1975, 2003), randomInt(rand, 1, 12), randomInt(rand, 1, 27)),
        nationality: nationality.en,
        nationalId,
        jobTitle: title.en,
        jobTitleAr: title.ar,
        departmentId: dept.id,
        managerId: null,
        locationId: pick(LOCATIONS, rand).id,
        grade,
        status,
        employmentType: (rand() < 0.88 ? 'full_time' : rand() < 0.6 ? 'contract' : 'part_time') as EmploymentType,
        hireDate,
        salary: { basic, housing, transport, allowances, currency: 'SAR' },
        bankName: bank.name,
        iban: ibanFor(bank.code, rand),
        gosiNumber: `G${Array.from({ length: 8 }, () => Math.floor(rand() * 10)).join('')}`,
        leave: {
          annualEntitlement: title.level === 'junior' ? 21 : 30,
          annualTaken,
          annualPending: 0,
          sickTaken: rand() < 0.4 ? randomInt(rand, 1, 6) : 0,
        },
        performance: {
          rating,
          potential,
          goalsCompleted: randomInt(rand, 2, 6),
          goalsTotal: 6,
          lastReview: '2026-06-30',
        },
        engagement,
        flightRisk: flightRisk as Employee['flightRisk'],
        compliance: { iqamaExpiry, contractExpiry, insuranceExpiry, passportExpiry },
        skills: Array.from(new Set(Array.from({ length: randomInt(rand, 2, 5) }, () => pick(SKILLS[dept.id] ?? ['Excel'], rand)))),
        createdAt: new Date(TODAY.getTime() - daysSinceHire * 86_400_000).toISOString(),
      };

      employees.push(employee);
    }
  }

  // Department heads
  for (const dept of DEPARTMENTS) {
    const head = employees.find((e) => e.departmentId === dept.id);
    if (head) dept.headId = head.id;
  }

  // Reporting lines: everyone reports to the head or to a senior peer.
  for (const employee of employees) {
    const head = employees.find((e) => e.id === DEPARTMENTS.find((d) => d.id === employee.departmentId)?.headId);
    if (!head || head.id === employee.id) continue;
    const isSenior = employee.grade.startsWith('G5') || employee.grade.startsWith('G6') || employee.grade.startsWith('M');
    if (isSenior) {
      // Seniors always report to the department head so the tree cannot cycle.
      employee.managerId = head.id;
      continue;
    }
    const seniors = employees.filter(
      (e) => e.departmentId === employee.departmentId && e.id !== employee.id && e.id !== head.id && (e.grade.startsWith('G5') || e.grade.startsWith('G6')),
    );
    employee.managerId = seniors.length && rand() < 0.34 ? pick(seniors, rand).id : head.id;
  }

  // A few executives float above departments for the org chart.
  const cto = employees.find((e) => e.jobTitle === 'Chief Technology Officer');
  const cfo = employees.find((e) => e.jobTitle === 'Chief Financial Officer');
  const ceo = employees.find((e) => e.jobTitle === 'Chief Revenue Officer');
  if (cto && ceo) cto.managerId = ceo.id;
  if (cfo && ceo) cfo.managerId = ceo.id;

  // Alumni — terminated employees for attrition analytics.
  const alumniReasons = ['Career growth', 'Work–life balance', 'Relocation', 'Role alignment', 'Compensation', 'Management change'];
  for (let i = 0; i < 26; i++) {
    sequence += 1;
    const dept = pick(DEPARTMENTS, rand);
    const family = pick(FAMILY, rand);
    const first = pick(rand() < 0.4 ? FEMALE_FIRST : MALE_FIRST, rand);
    const exitMonth = randomInt(rand, 1, 10);
    const exitYear = rand() < 0.45 ? 2026 : 2025;
    employees.push({
      id: `emp_${sequence}`,
      employeeNo: `Q-${String(sequence).padStart(4, '0')}`,
      firstName: first.en,
      lastName: family.en,
      nameAr: `${first.ar} ${family.ar}`,
      email: `alumni.${sequence}@qimma.sa`,
      phone: `+9665${Array.from({ length: 8 }, () => Math.floor(rand() * 10)).join('')}`,
      avatarHue: Math.floor(rand() * 360),
      gender: rand() < 0.35 ? 'female' : 'male',
      birthDate: isoDate(randomInt(rand, 1978, 2000), randomInt(rand, 1, 12), randomInt(rand, 1, 27)),
      nationality: pick(NATIONALITIES, rand).en,
      nationalId: `1${Array.from({ length: 9 }, () => Math.floor(rand() * 10)).join('')}`,
      jobTitle: 'Team member',
      jobTitleAr: 'عضو فريق',
      departmentId: dept.id,
      managerId: null,
      locationId: 'riyadh',
      grade: 'G3',
      status: 'terminated',
      employmentType: 'full_time',
      hireDate: isoDate(randomInt(rand, 2016, 2023), randomInt(rand, 1, 12), randomInt(rand, 1, 27)),
      endDate: isoDate(exitYear, exitMonth, randomInt(rand, 1, 27)),
      endReason: pick(alumniReasons, rand),
      salary: { basic: 14_000, housing: 3_500, transport: 1_400, allowances: 0, currency: 'SAR' },
      bankName: 'Al Rajhi Bank',
      iban: ibanFor('RJHI', rand),
      gosiNumber: `G${Array.from({ length: 8 }, () => Math.floor(rand() * 10)).join('')}`,
      leave: { annualEntitlement: 21, annualTaken: 0, annualPending: 0, sickTaken: 0 },
      performance: { rating: 3.4, potential: 2, goalsCompleted: 4, goalsTotal: 6, lastReview: '2026-06-30' },
      engagement: 6.5,
      flightRisk: 'low',
      compliance: {},
      skills: [],
      createdAt: isoDate(2016, 1, 1),
    });
  }

  return employees;
}

export const EMPLOYEES = buildEmployees();

export const gradeLabel = (grade: string) => {
  const idx = GRADES.indexOf(grade as (typeof GRADES)[number]);
  return idx >= 0 ? `${grade} · Band ${idx + 1}` : grade;
};

