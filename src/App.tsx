import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'

// three.js is the heaviest dependency; load it after the text paints.
const AsciiObject = lazy(() => import('./components/AsciiObject').then((m) => ({ default: m.AsciiObject })))
import { Scramble } from './components/Scramble'
import {
  achievements,
  community,
  education,
  experience,
  links,
  profile,
  projects,
  skills,
  ui,
  type Lang,
} from './data'

const SECTIONS = ['about', 'experience', 'projects', 'wins', 'education', 'contact'] as const
type Section = (typeof SECTIONS)[number]

const EASE_OUT = [0.23, 1, 0.32, 1] as const

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('lang')
    if (saved === 'en' || saved === 'ru') return saved
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.startsWith('ru') ? 'ru' : 'en'
}

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [active, setActive] = useState<Section | 'hero'>('hero')
  const [help, setHelp] = useState(false)
  const [pressed, setPressed] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const toggleLang = useCallback(() => {
    setLang((l) => {
      const next = l === 'en' ? 'ru' : 'en'
      try {
        localStorage.setItem('lang', next)
      } catch {
        /* storage unavailable */
      }
      return next
    })
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Track which pane is in the reading band of the viewport.
  useEffect(() => {
    const els = ['hero', ...SECTIONS].map((id) => document.getElementById(id)!).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id as Section)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }, [])

  // Hotkeys, the way a TUI is driven.
  useEffect(() => {
    const flash = (k: string) => {
      setPressed(k)
      window.setTimeout(() => setPressed(null), 140)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable]')) return
      const k = e.key.toLowerCase()
      if (k === 'escape') return setHelp(false)
      if (e.key === '?') return setHelp((h) => !h)
      const n = Number(e.key)
      if (n >= 1 && n <= SECTIONS.length) {
        document.getElementById(SECTIONS[n - 1])?.scrollIntoView()
        return
      }
      if (k === '0') return window.scrollTo({ top: 0 })
      if (k === 'r') return toggleLang()
      if (k === 'c') {
        flash('c')
        window.open(profile.cv, '_blank')
        return
      }
      if (k === 'm') {
        flash('m')
        window.location.href = `mailto:${profile.email}`
        return
      }
      if (k === 'y') {
        flash('y')
        copyEmail()
        return
      }
      const link = links.find((l) => l.key === k)
      if (link) {
        flash(k)
        window.open(link.href, '_blank', 'noopener')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleLang, copyEmail])

  const t = (v: Record<Lang, string>) => v[lang]

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6 lg:px-10">
        <Hero lang={lang} active={active === 'hero'} pressed={pressed} onToggleLang={toggleLang} />

        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <Pane id="about" title={`1 ${t(ui.sections.about)}`} active={active} className="lg:col-span-7">
            <p className="max-w-[62ch] text-[0.9375rem] leading-[1.75] text-ink">{t(profile.summary)}</p>
            <SkillTree />
          </Pane>

          <Pane id="education" title={`5 ${t(ui.sections.education)}`} active={active} className="lg:col-span-5">
            <dl className="grid gap-5 text-sm">
              <div>
                <dt className="font-display text-base font-semibold text-ink">{education.school}</dt>
                <dd className="mt-1 text-dim">
                  {t(education.degree)} <span className="text-mute">·</span>{' '}
                  <span className="tabular-nums">{education.period}</span>
                </dd>
              </div>
              <div className="border-t border-dashed border-rule pt-5">
                <dt className="text-amber">{t(ui.community)}</dt>
                <dd className="mt-2 leading-relaxed text-dim">{t(community)}</dd>
              </div>
            </dl>
          </Pane>

          <Pane id="experience" title={`2 ${t(ui.sections.experience)}`} active={active} className="lg:col-span-12">
            <GitLog lang={lang} />
          </Pane>

          <Pane id="projects" title={`3 ${t(ui.sections.projects)}`} active={active} className="lg:col-span-12">
            <ProcessTable lang={lang} />
          </Pane>

          <Pane id="wins" title={`4 ${t(ui.sections.wins)}`} active={active} className="lg:col-span-12">
            <Wins lang={lang} />
          </Pane>

          <Pane id="contact" title={`6 ${t(ui.sections.contact)}`} active={active} className="lg:col-span-12">
            <Contact lang={lang} pressed={pressed} copied={copied} onCopy={copyEmail} />
          </Pane>
        </div>

        <p className="mt-12 text-xs text-mute">
          © {new Date().getFullYear()} {profile.name} · {t(ui.built)}
        </p>
      </div>

      <StatusLine lang={lang} active={active} onHelp={() => setHelp((h) => !h)} onToggleLang={toggleLang} />
      <HelpPopover lang={lang} open={help} onClose={() => setHelp(false)} />
    </MotionConfig>
  )
}

/* ───────────────────────────── hero ───────────────────────────── */

function Hero({
  lang,
  active,
  pressed,
  onToggleLang,
}: {
  lang: Lang
  active: boolean
  pressed: string | null
  onToggleLang: () => void
}) {
  return (
    <header id="hero" className="pt-6 sm:pt-10">
      <div className="flex items-center justify-between gap-4 text-xs text-dim sm:text-sm">
        <p className="truncate">
          <span className="text-sage">{profile.handle}@astana</span>
          <span className="text-mute">:</span>
          <span className="text-amber">~/portfolio</span>
          <span className="text-mute">$</span> whoami
        </p>
        <button
          type="button"
          onClick={onToggleLang}
          className="key-btn shrink-0 !py-1 !pr-2 !pl-1 text-xs"
          aria-label={ui.toggleLang[lang]}
        >
          <kbd>R</kbd>
          <span>
            <span className={lang === 'en' ? 'text-amber' : 'text-mute'}>EN</span>
            <span className="text-mute">/</span>
            <span className={lang === 'ru' ? 'text-amber' : 'text-mute'}>RU</span>
          </span>
        </button>
      </div>

      <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col justify-center lg:col-span-7">
          <p className="flex items-center gap-2 text-sm text-sage">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-sage opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-sage" />
            </span>
            {ui.openToWork[lang]} · {profile.location[lang]}
          </p>

          <h1
            className="mt-5 font-display text-[clamp(2.75rem,8.4vw,6rem)] leading-[0.95] font-bold tracking-[-0.04em] text-ink"
            style={{ fontStretch: '125%' }}
          >
            <span className="block">
              <Scramble text="Madi" duration={700} delay={150} />
            </span>
            <span className="block text-amber">
              <Scramble text="Talgat" duration={800} delay={250} />
            </span>
          </h1>

          <p className="mt-6 font-display text-lg text-ink sm:text-xl" style={{ fontStretch: '100%' }}>
            <Scramble text={profile.role[lang]} duration={500} delay={500} />
            <span className="text-mute"> / </span>
            <span className="text-dim">{profile.focus}</span>
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={profile.cv} target="_blank" className="key-btn" data-primary="true" data-pressed={pressed === 'c'}>
              <kbd>C</kbd>
              {ui.downloadCv[lang]}
            </a>
            <a href={`mailto:${profile.email}`} className="key-btn" data-pressed={pressed === 'm'}>
              <kbd>M</kbd>
              {ui.email[lang]}
            </a>
            <a href={links[0].href} target="_blank" rel="noopener" className="key-btn" data-pressed={pressed === 'g'}>
              <kbd>G</kbd>
              github
            </a>
            <a href={links[2].href} target="_blank" rel="noopener" className="key-btn" data-pressed={pressed === 't'}>
              <kbd>T</kbd>
              telegram
            </a>
          </div>
        </div>

        <div className="pane h-[300px] sm:h-[380px] lg:col-span-5 lg:h-[460px]" data-active={active}>
          <span className="pane-title">render.ts — three.js → ascii</span>
          <div className="absolute inset-3 top-5">
            <Suspense fallback={<p className="cursor text-xs text-mute">loading three.js</p>}>
              <AsciiObject label="Rotating 3D torus knot rendered in ASCII characters" />
            </Suspense>
          </div>
          <span className="pointer-events-none absolute right-3 bottom-2 text-[11px] text-mute">{ui.dragHint[lang]}</span>
        </div>
      </div>
    </header>
  )
}

/* ───────────────────────────── pane ───────────────────────────── */

function Pane({
  id,
  title,
  active,
  className = '',
  children,
}: {
  id: Section
  title: string
  active: string
  className?: string
  children: ReactNode
}) {
  return (
    <section id={id} className={`pane min-w-0 px-5 pt-8 pb-6 sm:px-7 sm:pb-8 ${className}`} data-active={active === id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="pane-title">
        <Scramble text={title} duration={350} />
      </h2>
      {children}
    </section>
  )
}

/* ───────────────────────────── about: tree ───────────────────────────── */

function SkillTree() {
  return (
    <div className="mt-7 text-[0.8125rem] leading-[1.9]">
      <p className="text-amber">~/skills</p>
      <ul>
        {skills.map((s, i) => {
          const lastItem = i === skills.length - 1
          return (
            <li key={s.dir} className="flex gap-3">
              <span className="shrink-0 text-mute">{lastItem ? '└──' : '├──'}</span>
              <span className={`w-[5.5rem] shrink-0 ${s.dir === 'learning' ? 'text-sage' : 'text-ink'}`}>{s.dir}/</span>
              <span className="min-w-0 text-dim">{s.items.join(' · ')}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ───────────────────────────── experience: git log ───────────────────────────── */

function GitLog({ lang }: { lang: Lang }) {
  return (
    <ol className="grid gap-0">
      {experience.map((job, i) => (
        <li key={job.company} className="grid grid-cols-[1.25rem_1fr] gap-x-3">
          <div className="flex flex-col items-center">
            <span className="leading-7 text-amber">*</span>
            {i < experience.length - 1 && <span className="w-px flex-1 bg-rule-hi" />}
            {i === experience.length - 1 && <span className="w-px flex-1 bg-gradient-to-b from-rule-hi to-transparent" />}
          </div>
          <div className={i < experience.length - 1 ? 'pb-9' : 'pb-2'}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 leading-7">
              <span className="text-xs text-amber/80 tabular-nums">{job.hash}</span>
              {i === 0 && <span className="text-xs text-sage">(HEAD → {job.period[lang]})</span>}
              <h3 className="font-display text-lg font-semibold text-ink">{job.company}</h3>
              <span className="text-dim">— {job.role[lang]}</span>
              {i !== 0 && <span className="text-xs text-mute">({job.period[lang]})</span>}
              {job.href && (
                <a href={job.href} target="_blank" rel="noopener" className="text-sm text-amber underline decoration-amber/40 hover:decoration-amber">
                  {job.site} ↗
                </a>
              )}
            </div>
            <ul className="mt-3 grid max-w-[78ch] gap-1.5 text-[0.9375rem] leading-relaxed">
              {job.points.map((p) => (
                <li key={p.en} className="flex gap-3">
                  <span className="text-sage">+</span>
                  <span className="text-dim">{p[lang]}</span>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ───────────────────────────── projects: process table ───────────────────────────── */

function ProcessTable({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState<number | null>(projects[0].pid)
  return (
    <div className="text-sm">
      <div className="hidden grid-cols-[4rem_10rem_6rem_5rem_1fr] gap-4 bg-rule/60 px-3 py-1.5 text-xs text-dim md:grid">
        <span>PID</span>
        <span>NAME</span>
        <span>STATUS</span>
        <span>USERS</span>
        <span>STACK</span>
      </div>
      <ul>
        {projects.map((p) => {
          const isOpen = open === p.pid
          return (
            <li key={p.pid} className="border-b border-dashed border-rule last:border-b-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : p.pid)}
                aria-expanded={isOpen}
                className={`group grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-3 py-3 text-left transition-colors duration-150 md:grid-cols-[4rem_10rem_6rem_5rem_1fr] ${
                  isOpen ? 'bg-amber text-amber-ink' : 'hover:bg-rule/50'
                }`}
              >
                <span className={`hidden tabular-nums md:block ${isOpen ? '' : 'text-mute'}`}>{p.pid}</span>
                <span className="font-display font-semibold">{p.name}</span>
                <span className={`justify-self-end md:justify-self-auto ${isOpen ? '' : p.status === 'live' ? 'text-sage' : 'text-dim'}`}>
                  {p.status === 'live' ? '● live' : '○ repo'}
                </span>
                <span className={`hidden tabular-nums md:block ${isOpen ? '' : 'text-ink'}`}>{p.users}</span>
                <span className={`col-span-2 truncate md:col-span-1 ${isOpen ? '' : 'text-dim'}`}>{p.stack.join(' · ')}</span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
                    transition={{ duration: 0.32, ease: EASE_OUT }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-6 px-3 pt-5 pb-7 md:grid-cols-[1fr_auto] md:gap-10 md:pl-[5rem]">
                      <div>
                        <h3 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink sm:text-3xl" style={{ fontStretch: '115%' }}>
                          {p.title}
                        </h3>
                        <p className="mt-1 text-sm text-amber">{p.role[lang]}</p>
                        <p className="mt-4 max-w-[64ch] text-[0.9375rem] leading-relaxed text-dim">{p.description[lang]}</p>
                        <ul className="mt-5 flex flex-wrap gap-2">
                          {p.stack.map((s) => (
                            <li key={s} className="border border-rule-hi px-2 py-0.5 text-xs text-ink">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-start">
                        <a href={p.href} target="_blank" rel="noopener" className="key-btn">
                          <kbd>↗</kbd>
                          {p.linkLabel}
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ───────────────────────────── wins: podium ───────────────────────────── */

const PODIUM = [
  '       ┌─────┐       ',
  ' ┌ ─ ─ ┤  1  │       ',
  ' ╎  ?  │     ├─────┐ ',
  ' ╎     │     │  3  │ ',
  '─┴─────┴─────┴─────┴─',
]

function Wins({ lang }: { lang: Lang }) {
  return (
    <div className="grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-14">
      <pre aria-hidden className="m-0 text-[13px] leading-[1.2] text-mute sm:text-[15px]">
        {PODIUM.map((line, i) => (
          <span key={i} className="block">
            {line.split(/([13])/).map((part, j) =>
              part === '1' || part === '3' ? (
                <span key={j} className="font-bold text-amber">
                  {part}
                </span>
              ) : (
                part
              ),
            )}
          </span>
        ))}
      </pre>
      <ul className="grid gap-6">
        {achievements.map((a) => (
          <li key={a.place} className="grid grid-cols-[3.5rem_1fr] gap-4">
            <span className="font-display text-3xl leading-none font-bold text-amber tabular-nums" style={{ fontStretch: '125%' }}>
              {a.place === 1 ? '1st' : '3rd'}
            </span>
            <div>
              <h3 className="font-display font-semibold text-ink">{a.title[lang]}</h3>
              <p className="mt-1 max-w-[60ch] text-[0.9375rem] leading-relaxed text-dim">{a.text[lang]}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ───────────────────────────── contact ───────────────────────────── */

function Contact({
  lang,
  pressed,
  copied,
  onCopy,
}: {
  lang: Lang
  pressed: string | null
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div>
      <p className="text-sm text-dim">
        <span className="text-sage">{profile.handle}@astana</span>
        <span className="text-mute">:~$</span> ./contact <span className="text-amber">--hire</span>
      </p>
      <p className="mt-4 max-w-[54ch] text-[0.9375rem] leading-relaxed text-ink">{ui.contactLead[lang]}</p>

      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
        <a
          href={`mailto:${profile.email}`}
          className="cursor font-display text-[clamp(1.15rem,4.2vw,2.5rem)] font-semibold tracking-[-0.03em] break-all text-ink underline decoration-rule-hi decoration-1 underline-offset-8 transition-colors duration-200 hover:decoration-amber"
        >
          {profile.email}
        </a>
        <button type="button" onClick={onCopy} className="key-btn relative" data-pressed={pressed === 'y'}>
          <kbd>Y</kbd>
          <span className="relative inline-grid">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={copied ? 'done' : 'copy'}
                initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className={copied ? 'text-sage' : ''}
              >
                {copied ? ui.copied[lang] : ui.copy[lang]}
              </motion.span>
            </AnimatePresence>
          </span>
        </button>
      </div>

      <ul className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {links.map((l) => (
          <li key={l.label} className="bg-pane">
            <a
              href={l.href}
              target="_blank"
              rel="noopener"
              className="group flex items-center gap-3 px-4 py-4 transition-colors duration-150 hover:bg-rule/50"
              data-pressed={pressed === l.key}
            >
              <kbd className="inline-grid size-6 place-items-center bg-rule font-mono text-xs text-amber uppercase transition-colors duration-150 group-hover:bg-amber group-hover:text-amber-ink">
                {l.key}
              </kbd>
              <span className="min-w-0">
                <span className="block text-sm text-ink">{l.label}</span>
                <span className="block truncate text-xs text-mute">{l.handle}</span>
              </span>
              <span className="ml-auto text-mute transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ───────────────────────────── status line (tmux-style nav) ───────────────────────────── */

function useAstanaClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])
  return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty' })
}

function StatusLine({
  lang,
  active,
  onHelp,
  onToggleLang,
}: {
  lang: Lang
  active: string
  onHelp: () => void
  onToggleLang: () => void
}) {
  const time = useAstanaClock()
  const navRef = useRef<HTMLOListElement>(null)

  // Keep the active tab visible when the bar scrolls horizontally on phones.
  useEffect(() => {
    // Scroll only the bar itself; scrollIntoView would also shift the page.
    const bar = navRef.current
    const tab = bar?.querySelector<HTMLElement>('[aria-current="true"]')
    if (bar && tab) bar.scrollTo({ left: tab.offsetLeft - bar.clientWidth / 2 + tab.clientWidth / 2 })
  }, [active])

  return (
    <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-ground/95 text-xs backdrop-blur-sm">
      <div className="mx-auto flex h-9 max-w-[1240px] items-stretch sm:px-6 lg:px-10">
        <a href="#hero" className="flex shrink-0 items-center bg-amber px-3 font-semibold text-amber-ink">
          [madi]
        </a>
        <ol ref={navRef} className="flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none]">
          {SECTIONS.map((s, i) => {
            const on = active === s
            return (
              <li key={s} className="flex">
                <a
                  href={`#${s}`}
                  aria-current={on}
                  className={`relative flex items-center px-3 whitespace-nowrap transition-colors duration-150 ${
                    on ? 'text-ink' : 'text-mute hover:text-dim'
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="tab"
                      className="absolute inset-x-1 inset-y-1 bg-rule"
                      transition={{ type: 'spring', duration: 0.35, bounce: 0.12 }}
                    />
                  )}
                  <span className="relative">
                    {i + 1}:{ui.sections[s][lang]}
                    {on ? '*' : ''}
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
        <div className="flex shrink-0 items-center gap-3 pr-3 pl-2 text-mute">
          <button type="button" onClick={onToggleLang} className="hidden hover:text-ink sm:block">
            [{lang.toUpperCase()}]
          </button>
          <button type="button" onClick={onHelp} className="hidden hover:text-ink md:block">
            {ui.keysHint[lang]}
          </button>
          <span className="tabular-nums text-dim">AST {time}</span>
        </div>
      </div>
    </nav>
  )
}

/* ───────────────────────────── help popover ───────────────────────────── */

function HelpPopover({ lang, open, onClose }: { lang: Lang; open: boolean; onClose: () => void }) {
  const rows: [string, string][] = [
    ['1–6', ui.jump[lang]],
    ['0', 'top'],
    ['C', ui.downloadCv[lang]],
    ['M', ui.email[lang]],
    ['Y', `${ui.copy[lang]} email`],
    ['G L T W', 'github · linkedin · telegram · whatsapp'],
    ['R', ui.toggleLang[lang]],
    ['?', ui.keysTitle[lang]],
  ]
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label={ui.keysTitle[lang]}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          style={{ transformOrigin: 'bottom right' }}
          className="pane fixed right-4 bottom-12 z-50 w-[min(22rem,calc(100vw-2rem))] px-5 pt-7 pb-5 text-sm shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7)] sm:right-10"
          data-active="true"
        >
          <span className="pane-title">{ui.keysTitle[lang]}</span>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-amber">{k}</dt>
                <dd className="text-dim">{v}</dd>
              </div>
            ))}
          </dl>
          <button type="button" onClick={onClose} className="mt-5 text-xs text-mute hover:text-ink">
            [esc] {ui.close[lang]}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
