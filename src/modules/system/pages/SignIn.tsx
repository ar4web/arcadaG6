import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Building2, Check, Fingerprint, KeyRound, Mail, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import type { RoleId } from '@/types';
import { ROLES } from '@/lib/mock/master';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Badge, Segmented } from '@/components/ui/misc';
import { toast } from 'sonner';

export default function SignIn() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const [provider, setProvider] = React.useState<'google' | 'email' | 'phone'>('google');
  const [role, setRole] = React.useState<RoleId>('admin');
  const [email, setEmail] = React.useState('noura.alotaibi@qimma.sa');
  const [password, setPassword] = React.useState('demo-password');
  const [phone, setPhone] = React.useState('+966 55 214 8890');
  const [loading, setLoading] = React.useState(false);
  const [mfa, setMfa] = React.useState(false);
  const [code, setCode] = React.useState('');

  async function submit() {
    setLoading(true);
    try {
      await signIn({ provider, email, password, phone, role });
      if (!mfa) {
        setMfa(true);
        setLoading(false);
        return;
      }
      toast.success('Signed in');
      navigate('/hr');
    } catch {
      toast.error('Check your credentials and try again');
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-ink-inverse lg:flex">
        <div className="absolute inset-0 opacity-[0.07]" aria-hidden="true">
          <svg viewBox="0 0 400 400" className="size-full">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0H0v32" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-ink-inverse text-ink">
            <svg viewBox="0 0 32 32" className="size-4" fill="none">
              <path d="M16 2.5 28 9.5v13L16 29.5 4 22.5v-13L16 2.5Z" fill="currentColor" />
              <path d="M16 9.5 22.5 22h-4.1L16 17.4 13.6 22H9.5L16 9.5Z" className="fill-ink-inverse" />
            </svg>
          </span>
          <span className="font-display text-[17px] font-extrabold tracking-[-0.03em]">arcada.</span>
        </div>

        <div className="relative max-w-md">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-inverse/50">People operations, Saudi-first</p>
          <h1 className="font-display text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em]">
            Turn workforce data into decisions.
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-inverse/70">
            Payroll, GOSI, WPS and ZATCA in one system of record — with leave, performance and compliance attached to every employee file.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {['GOSI & WPS native', 'ZATCA Phase 2', 'Arabic + English', 'PDPL aligned'].map((item) => (
              <span key={item} className="rounded-full border border-ink-inverse/20 px-2.5 py-1 text-[10px] text-ink-inverse/80">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-4 text-[10px] text-ink-inverse/50">
          <span>© 2026 Qimma Group</span>
          <span>·</span>
          <span>Riyadh, Saudi Arabia</span>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <span className="font-display text-[20px] font-extrabold tracking-[-0.03em] text-ink">
              arcada<span className="text-primary">.</span>
            </span>
          </div>

          <h2 className="font-display text-[23px] font-extrabold tracking-[-0.02em] text-ink">Welcome back</h2>
          <p className="mt-1 text-[12px] text-ink-3">Sign in to the Qimma Group people workspace.</p>

          <div className="mt-5">
            <Segmented
              value={provider}
              onChange={(value) => setProvider(value)}
              ariaLabel="Sign-in method"
              options={[
                { value: 'google', label: <span className="inline-flex items-center gap-1"><Building2 className="size-3" /> Google</span> },
                { value: 'email', label: <span className="inline-flex items-center gap-1"><Mail className="size-3" /> Email</span> },
                { value: 'phone', label: <span className="inline-flex items-center gap-1"><Phone className="size-3" /> Phone</span> },
              ]}
              className="w-full justify-between"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {provider === 'google' ? (
              <div className="rounded-md border border-line bg-surface-2 p-3 text-[11px] text-ink-3">
                <p className="font-medium text-ink-2">Single sign-on</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed">Your organisation enforces Google Workspace SSO. In the demo build, continue below to pick a role.</p>
              </div>
            ) : provider === 'email' ? (
              <>
                <Field label="Work email" required>
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} icon={<Mail />} />
                </Field>
                <Field label="Password" required>
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} icon={<KeyRound />} />
                </Field>
              </>
            ) : (
              <Field label="Mobile number" hint="We send a six-digit code." required>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} icon={<Phone />} />
              </Field>
            )}

            <Field label="Demo role" hint="Permissions are enforced per role — try Employee to see the self-service portal.">
              <div className="grid grid-cols-2 gap-1.5">
                {ROLES.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setRole(option.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-start text-[10.5px] transition-colors',
                      role === option.id ? 'border-primary bg-primary-soft text-primary-ink' : 'border-line text-ink-3 hover:border-line-2',
                    )}
                  >
                    {role === option.id ? <Check className="size-3" /> : <span className="size-3 rounded-full border border-current opacity-40" />}
                    {option.name}
                  </button>
                ))}
              </div>
            </Field>

            {mfa ? (
              <div className="rounded-md border border-accent/30 bg-accent-soft/60 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-ink">
                  <Fingerprint className="size-3.5" /> Verify it's you
                </p>
                <p className="mt-0.5 text-[10px] text-ink-3">Enter the six-digit code from your authenticator app.</p>
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123 456"
                  className="num mt-2 text-center tracking-[0.4em]"
                  inputMode="numeric"
                />
              </div>
            ) : null}

            <Button variant="primary" size="lg" className="mt-1 w-full" loading={loading} onClick={submit}>
              {mfa ? 'Verify and continue' : provider === 'google' ? 'Continue with Google' : 'Sign in'}
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Button>

            <p className="text-center text-[10px] leading-relaxed text-ink-4">
              This is a demonstration workspace with synthetic data. Do not enter real personal information.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-4">
            <Badge tone="success" dot>
              <ShieldCheck className="size-2.5" /> SOC 2 Type II
            </Badge>
            <Badge tone="accent" dot>
              <Sparkles className="size-2.5" /> PDPL ready
            </Badge>
            <Link to="/help" className="text-[10px] text-ink-4 underline-offset-2 hover:underline">
              Need help?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
