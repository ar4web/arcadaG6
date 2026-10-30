/** Shared explanatory copy. Kept in one place so the language stays consistent. */
export const methodology = {
  headcount:
    'Headcount includes active, probationary and on-leave employees. Alumni are excluded from current figures but included in historical trends.',
  turnover:
    'Turnover is exits divided by average headcount for the period, annualised. The Saudi workweek (Sunday–Thursday) is used for scheduled-days calculations.',
  attendance:
    'Presence comes from biometric devices at Riyadh HQ and web check-ins for remote staff. Late is defined as a check-in after 09:15 local time. Overtime over 40 hours per month requires HR sign-off under Article 107 of the Saudi Labour Law.',
  payroll:
    'Gross payroll includes basic salary, housing (25% of basic), transport (10% of basic) and any contractual allowances. GOSI employee contribution is 9.75% of basic plus housing; the employer contributes 11.75% plus 2% occupational hazard. End-of-service accrual is held as a liability and is not shown in the monthly run.',
  engagement:
    'Engagement is the mean of the latest quarterly pulse survey. Scores below 7.0 trigger a retention flag; the flight-risk score combines engagement, review rating and tenure.',
  saudization:
    'Saudization is the Saudi national share of active headcount. Nitaqat bands are indicative only — the final band depends on the activity classification registered with the Ministry of Human Resources.',
} as const;

export const complianceCopy = {
  wps: 'The Wage Protection System file must be uploaded to the bank by the 27th of each month. Late submission is reportable to the Ministry.',
  gosi: 'GOSI contributions are due by the 15th of the following month.',
  iqama: 'Iqama renewals must be lodged with Jawazat at least three weeks before expiry to avoid a fine.',
} as const;
