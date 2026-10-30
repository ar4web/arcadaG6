import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Command, LifeBuoy, MessageCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Kbd } from '@/components/ui/input';
import { Input } from '@/components/ui/input';

const SHORTCUTS = [
  ['⌘ K', 'Open the command palette'],
  ['G then H', 'Go to the HR overview'],
  ['G then P', 'Go to the employee directory'],
  ['G then L', 'Go to leave'],
  ['T', 'Toggle light and dark'],
  ['?', 'Show shortcuts'],
];

const FAQ = [
  ['Where does the data come from?', 'This is a demonstration workspace. Every record is synthetic and generated deterministically at build time — no real employee data is involved.'],
  ['How are permissions enforced?', 'The role selector changes which screens render and which actions are available. In production, authorisation is enforced server-side with row-level security; UI permissions are never a security boundary.'],
  ['What is the WPS deadline?', 'The Wage Protection System file must reach the bank by the 27th of each month. GOSI contributions are due by the 15th of the following month.'],
  ['How is Saudization calculated?', 'Saudi nationals divided by active headcount. The Nitaqat band shown is indicative and depends on the activity classification registered with the Ministry.'],
  ['Can I export what I see?', 'Yes. Tables export to CSV and Excel, and the report builder produces PDF, DOCX, XLSX and CSV.'],
];

export default function Help() {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <Link to="/hr" className="inline-flex items-center gap-1 text-[11.5px] text-ink-3 hover:text-ink">
          <ArrowLeft className="size-3.5 rtl:rotate-180" /> Back to workspace
        </Link>

        <div className="mt-4 rounded-xl border border-line bg-gradient-to-br from-accent-soft to-surface p-6">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-accent-ink/70">Help & resources</p>
          <h1 className="mt-1 font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink">How can we help?</h1>
          <p className="mt-1 max-w-lg text-[12px] leading-relaxed text-ink-3">
            Search the knowledge base or reach the people operations team. Most answers live in the product documentation.
          </p>
          <div className="mt-3 max-w-md">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help articles…" icon={<Search />} className="h-9" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: BookOpen, title: 'Documentation', body: 'Architecture, data model and deployment notes.', to: '/docs' },
            { icon: LifeBuoy, title: 'Contact support', body: 'people-ops@qimma.sa · 4-hour response SLA.' },
            { icon: MessageCircle, title: 'Product feedback', body: 'Tell us what would make your week easier.' },
          ].map((item) => (
            <Card key={item.title} className="p-4">
              <span className="grid size-8 place-items-center rounded-md bg-surface-3 text-ink-3">
                <item.icon className="size-4" />
              </span>
              <p className="mt-2 text-[12px] font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-4">{item.body}</p>
              {item.to ? (
                <Button variant="secondary" size="xs" className="mt-2.5" asChild>
                  <Link to={item.to}>Open</Link>
                </Button>
              ) : null}
            </Card>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeading title="Frequently asked" description="The five questions we hear most." />
            <div className="px-5 pb-5">
              {FAQ.filter(([question, answer]) => !query || `${question} ${answer}`.toLowerCase().includes(query.toLowerCase())).map(([question, answer], index) => (
                <div key={question} className="border-b border-line py-2 last:border-0">
                  <button onClick={() => setOpen(open === index ? null : index)} className="flex w-full items-center gap-2 text-start">
                    <span className="flex-1 text-[11.5px] font-medium text-ink-2">{question}</span>
                    <span className="text-ink-4">{open === index ? '−' : '+'}</span>
                  </button>
                  {open === index ? <p className="mt-1 text-[10.5px] leading-relaxed text-ink-3">{answer}</p> : null}
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeading title="Keyboard shortcuts" description="Work without the mouse." action={<Command className="size-4 text-ink-4" />} />
            <div className="flex flex-col gap-1.5 px-5 pb-5">
              {SHORTCUTS.map(([keys, label]) => (
                <div key={keys} className="flex items-center justify-between gap-2">
                  <span className="text-[10.5px] text-ink-3">{label}</span>
                  <Kbd>{keys}</Kbd>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
