// All site content lives here — edit this file to update the portfolio.
// Every user-facing string has an `en` and `ru` version.

export type Lang = 'en' | 'ru'
type T = Record<Lang, string>

export const profile = {
  name: 'Madi Talgat',
  handle: 'madi',
  email: 'mditalgat@gmail.com',
  phone: '+7 747 366 33 58',
  cv: './Madi_Talgat_CV.pdf',
  role: { en: 'Full-Stack Developer', ru: 'Full-Stack разработчик' } as T,
  focus: 'React & TypeScript',
  location: { en: 'Astana, Kazakhstan', ru: 'Астана, Казахстан' } as T,
  summary: {
    en: 'I build web applications end to end with React and TypeScript — from the UI to the API to the server it runs on. At EpiQ I also go into hospitals to interview the doctors who use what we ship.',
    ru: 'Делаю веб-приложения целиком на React и TypeScript — от интерфейса до API и сервера, на котором всё крутится. В EpiQ ещё и езжу в больницы, интервьюирую врачей, которые пользуются тем, что мы выпускаем.',
  } as T,
}

export const links = [
  { key: 'g', label: 'GitHub', handle: 'Feruum', href: 'https://github.com/Feruum' },
  { key: 'l', label: 'LinkedIn', handle: 'madi-talgat', href: 'https://www.linkedin.com/in/madi-talgat-165048383' },
  { key: 't', label: 'Telegram', handle: '@ferum_m', href: 'https://t.me/ferum_m' },
  { key: 'w', label: 'WhatsApp', handle: '+7 747 366 33 58', href: 'https://wa.me/77473663358' },
]

export const skills: { dir: string; items: string[] }[] = [
  { dir: 'runtime', items: ['TypeScript', 'JavaScript', 'Bun'] },
  { dir: 'frontend', items: ['React', 'Tailwind CSS', 'Ant Design', 'shadcn/ui'] },
  { dir: 'backend', items: ['NestJS', 'ElysiaJS', 'REST APIs'] },
  { dir: 'infra', items: ['PostgreSQL', 'Docker', 'Git', 'Linux servers'] },
  { dir: 'ai', items: ['AI-assisted coding', 'Agent harnesses', 'MCP'] },
  { dir: 'learning', items: ['Go', 'AI engineering'] },
]

export const experience = [
  {
    hash: 'e91c2fa',
    company: 'EpiQ',
    role: { en: 'Full-Stack Developer', ru: 'Full-Stack разработчик' } as T,
    period: { en: '2025 — now', ru: '2025 — сейчас' } as T,
    href: 'https://epiq.top',
    site: 'epiq.top',
    points: [
      {
        en: 'Ship frontend and backend features for a healthcare software product.',
        ru: 'Делаю фичи на фронте и бэке для медицинского продукта.',
      },
      {
        en: 'Collect and analyze data that feeds a predictive model.',
        ru: 'Собираю и анализирую данные для предиктивной модели.',
      },
      {
        en: 'Visit hospitals and interview healthcare professionals to map real workflows into requirements.',
        ru: 'Езжу в больницы и интервьюирую медиков, чтобы перевести реальные процессы в требования.',
      },
    ] as T[],
  },
  {
    hash: '4b07d13',
    company: 'NomadCodes',
    role: { en: 'Frontend Developer', ru: 'Frontend разработчик' } as T,
    period: { en: 'current', ru: 'сейчас' } as T,
    points: [
      {
        en: 'Build web interfaces with React, TypeScript and Ant Design.',
        ru: 'Делаю интерфейсы на React, TypeScript и Ant Design.',
      },
      {
        en: 'Wire UI components to backend APIs and application data.',
        ru: 'Подключаю UI-компоненты к бэкенд-API и данным приложения.',
      },
    ] as T[],
  },
]

export const projects = [
  {
    pid: 1001,
    name: 'lexispark',
    title: 'LexiSpark',
    role: { en: 'creator · full-stack', ru: 'автор · full-stack' } as T,
    status: 'live',
    users: '~100',
    stack: ['TypeScript', 'Bun', 'ElysiaJS', 'React', 'shadcn/ui'],
    href: 'https://lexispark.app',
    linkLabel: 'lexispark.app',
    description: {
      en: 'A language-learning app I built and launched alone. Around 100 people use it. I own all of it: frontend, backend, deployment and server administration.',
      ru: 'Приложение для изучения языков, которое я сделал и запустил в одиночку. Им пользуются около 100 человек. Всё на мне: фронт, бэк, деплой и администрирование сервера.',
    } as T,
  },
  {
    pid: 1002,
    name: 'online-judge',
    title: 'Online Judge',
    role: { en: 'independent · full-stack', ru: 'свой проект · full-stack' } as T,
    status: 'repo',
    users: '—',
    stack: ['React', 'TypeScript', 'NestJS', 'Judge0', 'PostgreSQL', 'Docker'],
    // TODO: replace with the exact repository URL
    href: 'https://github.com/Feruum',
    linkLabel: 'github',
    description: {
      en: 'A LeetCode-style platform: pick a problem, submit code, get it judged by Judge0. NestJS API, React client, PostgreSQL storage, all orchestrated with Docker Compose.',
      ru: 'Платформа в стиле LeetCode: выбираешь задачу, отправляешь код, Judge0 его проверяет. NestJS API, React-клиент, PostgreSQL, всё поднимается через Docker Compose.',
    } as T,
  },
]

export const achievements = [
  {
    place: 1,
    title: { en: 'AITU / NNEF Hackathon', ru: 'Хакатон AITU / NNEF' } as T,
    text: {
      en: '24-hour challenge on reservoir monitoring and flood prevention.',
      ru: '24 часа: мониторинг водохранилищ и предотвращение паводков.',
    } as T,
  },
  {
    place: 3,
    title: { en: 'Datathon 2026', ru: 'Datathon 2026' } as T,
    text: {
      en: 'Team prize of KZT 500,000. Trained a YOLO26s model to spot violations in cash operations on video.',
      ru: 'Приз команде — 500 000 ₸. Обучили YOLO26s находить нарушения в кассовых операциях по видео.',
    } as T,
  },
]

export const education = {
  school: 'Astana IT University',
  degree: { en: "BSc Software Engineering", ru: 'Бакалавриат, Software Engineering' } as T,
  period: '2025 — 2028',
}

export const community = {
  en: 'Member of WebSpace (2025 — now) and Hustle / Business Club: pitching startup ideas and helping products get built.',
  ru: 'Участник WebSpace (с 2025) и Hustle / Business Club: предлагаю стартап-идеи и помогаю с разработкой продуктов.',
} as T

export const ui = {
  sections: {
    about: { en: 'about', ru: 'обо мне' },
    experience: { en: 'experience', ru: 'опыт' },
    projects: { en: 'projects', ru: 'проекты' },
    wins: { en: 'wins', ru: 'победы' },
    education: { en: 'education', ru: 'учёба' },
    contact: { en: 'contact', ru: 'контакты' },
  } as Record<string, T>,
  openToWork: { en: 'open to work', ru: 'открыт к предложениям' } as T,
  downloadCv: { en: 'download cv', ru: 'скачать cv' } as T,
  email: { en: 'email me', ru: 'написать' } as T,
  copy: { en: 'copy', ru: 'копировать' } as T,
  copied: { en: 'copied', ru: 'скопировано' } as T,
  dragHint: { en: 'drag to rotate', ru: 'тяни, чтобы вращать' } as T,
  keysHint: { en: 'press ? for keys', ru: 'нажми ? — горячие клавиши' } as T,
  keysTitle: { en: 'keybindings', ru: 'горячие клавиши' } as T,
  jump: { en: 'jump to pane', ru: 'перейти к панели' } as T,
  toggleLang: { en: 'switch language', ru: 'сменить язык' } as T,
  close: { en: 'close', ru: 'закрыть' } as T,
  open: { en: 'open', ru: 'открыть' } as T,
  place: { en: 'place', ru: 'место' } as T,
  contactLead: {
    en: 'Hiring for a React / TypeScript role or an internship? The fastest way is Telegram or email.',
    ru: 'Ищете React / TypeScript разработчика или стажёра? Быстрее всего — Telegram или почта.',
  } as T,
  community: { en: 'community', ru: 'сообщество' } as T,
  users: { en: 'users', ru: 'польз.' } as T,
  built: { en: 'built with react · three.js · bun', ru: 'сделано на react · three.js · bun' } as T,
}
