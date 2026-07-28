import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Code2, Cpu, LockKeyhole, Sparkles, Workflow } from 'lucide-react';
import { PublicNav } from '../components/layout/PublicNav';
import { Button } from '../components/ui/Button';
import { aiTools } from '../constants/tools';
const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};
export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <PublicNav />
      <section className="relative">
        <div className="grid-bg absolute inset-0 -z-10 opacity-60" />
        <div className="absolute left-1/2 top-20 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="mx-auto grid min-h-[82vh] max-w-7xl items-center gap-14 px-4 py-20 lg:grid-cols-2 lg:px-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-2 text-sm text-violet-500">
              <Sparkles size={16} />
              AI engineering workspace for every developer
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl xl:text-7xl">
              Build, debug, and ship with <span className="gradient-text">DevPilot AI</span>
            </h1>
            <p className="text-muted mt-7 max-w-2xl text-lg leading-8">
              A secure, multilingual developer assistant for code generation, debugging,
              explanations, optimization, SQL, documentation, APIs, snippets, and daily engineering
              utilities.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/register">
                <Button className="px-6 py-3.5">
                  Start building <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="px-6 py-3.5">
                  Open dashboard
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {['Secure server-side AI', 'Firebase authentication', '30+ languages'].map((x) => (
                <span className="flex items-center gap-2" key={x}>
                  <Check className="text-emerald-500" size={16} />
                  {x}
                </span>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="glass relative rounded-3xl p-3"
          >
            <div className="rounded-2xl border border-white/10 bg-[#090b10] p-4 text-zinc-200">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-zinc-500">devpilot-assistant.tsx</span>
              </div>
              <pre className="font-mono mt-5 overflow-hidden text-sm leading-7">
                <span className="text-violet-400">const</span>{' '}
                <span className="text-blue-300">result</span> ={' '}
                <span className="text-violet-400">await</span> devPilot.
                <span className="text-cyan-300">build</span>({'({'}\n goal:{' '}
                <span className="text-emerald-300">'Production-ready API'</span>,\n language:{' '}
                <span className="text-emerald-300">'TypeScript'</span>,\n include: {'['}
                <span className="text-emerald-300">'tests'</span>,{' '}
                <span className="text-emerald-300">'security'</span>,{' '}
                <span className="text-emerald-300">'docs'</span>
                {']'}\n{'}'});\n\n<span className="text-zinc-500">// ✓ Architecture generated</span>
                \n<span className="text-zinc-500">// ✓ Edge cases validated</span>\n
                <span className="text-zinc-500">// ✓ Deployment files ready</span>
              </pre>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-24 lg:px-6">
        <motion.div {...fade} className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-5xl">One workspace. Every developer task.</h2>
          <p className="text-muted mt-4 text-lg">
            Purpose-built modules share a consistent editor, AI service layer, history, exports, and
            security model.
          </p>
        </motion.div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiTools.slice(0, 9).map((tool, i) => (
            <motion.div
              {...fade}
              transition={{ delay: i * 0.04 }}
              key={tool.slug}
              className="panel p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/12 text-violet-500">
                <tool.icon />
              </div>
              <h3 className="text-lg font-bold">{tool.title}</h3>
              <p className="text-muted mt-2 leading-6">{tool.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-20 md:grid-cols-3 lg:px-6">
          {[
            [
              LockKeyhole,
              'Security first',
              'Gemini secrets stay on the server, with validation, rate limiting, optional Firebase token verification, and restrictive database rules.',
            ],
            [
              Workflow,
              'Scalable architecture',
              'Feature modules, reusable UI, Redux, TanStack Query, lazy routes, error boundaries, and deployment adapters.',
            ],
            [
              Cpu,
              'Real developer tooling',
              'Monaco editor, API tester, JSON and Base64 tools, JWT decoder, snippets, prompts, exports, and analytics.',
            ],
          ].map(([Icon, title, desc]) => (
            <div key={title} className="p-5">
              <Icon className="text-violet-500" size={30} />
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="text-muted mt-2 leading-7">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted sm:flex-row lg:px-6">
        <div className="flex items-center gap-2">
          <Code2 size={18} />
          DevPilot AI
        </div>
        <span>Built for developers, students, and software teams.</span>
      </footer>
    </div>
  );
}
