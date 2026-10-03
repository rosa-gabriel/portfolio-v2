import type { Plugin } from 'vite'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import { caseStudies } from '../src/lib/case-studies.ts'
import { certificates } from '../src/lib/certificates.ts'
import { journeyEntries, type JourneyEntry } from '../src/lib/journey.ts'
import { email, githubUrl, linkedinUrl, location, siteUrl } from '../src/lib/profile.ts'
import { skillGroups } from '../src/lib/skills.ts'

const NAME = 'Gabriel Rosa'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const month = (value: string) => {
  const [year, index] = value.split('-').map(Number)
  return `${MONTHS[index - 1]} ${year}`
}

const period = (entry: JourneyEntry) => `${month(entry.start)} - ${entry.end ? month(entry.end) : 'Present'}`

type Item = (typeof en.journey.items)[keyof typeof en.journey.items]

const jobTitle = en.journey.items.architect.role
const description = en.hero.tagline
const skills = skillGroups.flatMap((group) => [...group.skills])
const publishedCertificates = certificates.filter((certificate) => !certificate.draft)

function experience(lane: JourneyEntry['lane']) {
  return journeyEntries
    .filter((entry) => entry.lane === lane)
    .reverse()
    .map((entry) => ({ entry, item: en.journey.items[entry.id] as Item }))
}

function renderHtml() {
  const list = (items: string[]) => `<ul>${items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>`
  const role = ({ entry, item }: ReturnType<typeof experience>[number]) => `
      <article>
        <h3>${escape(item.role)}, ${escape(entry.org)}</h3>
        <p>${escape([period(entry), item.kind, item.mode, entry.location].filter(Boolean).join(' · '))}</p>
        ${item.summary.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')}
        ${item.sections.map((section) => `<h4>${escape(section.title)}</h4>${list(section.points)}`).join('')}
        <p>Skills: ${escape(entry.skills.join(', '))}</p>
      </article>`

  return `
    <article class="static-profile" lang="en">
      <header>
        <h1>${NAME}</h1>
        <p>${escape(jobTitle)}</p>
        <p>${escape(description)}</p>
        <p>${escape(en.availability.location)} · Open to: ${escape(en.availability.workModel)}</p>
        <ul>
          <li><a href="mailto:${email}">${email}</a></li>
          <li><a href="${githubUrl}">GitHub</a></li>
          <li><a href="${linkedinUrl}">LinkedIn</a></li>
        </ul>
      </header>
      <section>
        <h2>Highlights</h2>
        ${list(Object.values(en.highlights.items).map((item) => `${item.headline}: ${item.detail}`))}
      </section>
      <section>
        <h2>Experience</h2>
        ${experience('work').map(role).join('')}
      </section>
      <section>
        <h2>Education</h2>
        ${experience('education').map(role).join('')}
      </section>
      <section>
        <h2>${escape(en.caseStudies.title)}</h2>
        ${caseStudies
          .map((study) => {
            const item = en.caseStudies.items[study.id]
            return `
        <article>
          <h3>${escape(item.title)} (${escape(study.org)}, ${escape(study.period)})</h3>
          <p>${escape(item.summary)}</p>
          <p>Context: ${escape(item.context)}</p>
          <p>Role: ${escape(item.role)}</p>
          <h4>Key decisions</h4>${list(item.decisions)}
          <h4>Outcome</h4>${list(item.outcomes)}
          <p>Stack: ${escape(study.stack.join(', '))}</p>
        </article>`
          })
          .join('')}
      </section>
      <section>
        <h2>Skills</h2>
        <dl>${skillGroups
          .map((group) => `<dt>${escape(en.skills.groups[group.id])}</dt><dd>${escape(group.skills.join(', '))}</dd>`)
          .join('')}</dl>
      </section>
      ${
        publishedCertificates.length
          ? `<section>
        <h2>Certificates</h2>
        ${list(publishedCertificates.map((certificate) => `${certificate.title}, ${certificate.issuer} (${month(certificate.issued)})`))}
      </section>`
          : ''
      }
      <section>
        <h2>${escape(en.availability.lookingFor)}</h2>
        <p>Roles: ${escape(en.availability.roles.join(', '))}</p>
        <p>Work model: ${escape(en.availability.model)}</p>
        <p>Location: ${escape(en.availability.location)}</p>
        <p>Languages: ${escape(en.availability.languages)}</p>
      </section>
    </article>`
}

function renderMarkdown() {
  const bullets = (items: string[]) => items.map((item) => `- ${item}`).join('\n')
  const role = ({ entry, item }: ReturnType<typeof experience>[number]) =>
    [
      `### ${item.role}, ${entry.org}`,
      [period(entry), item.kind, item.mode, entry.location].filter(Boolean).join(' · '),
      item.summary.join('\n\n'),
      ...item.sections.map((section) => `**${section.title}**\n${bullets(section.points)}`),
      `Skills: ${entry.skills.join(', ')}`,
    ].join('\n\n')

  return [
    `# ${NAME}`,
    `> ${jobTitle}. ${description}`,
    bullets([
      `Location: ${en.availability.location}`,
      `Open to: ${en.availability.model}`,
      `Target roles: ${en.availability.roles.join(', ')}`,
      `Languages: ${en.availability.languages}`,
      `Email: ${email}`,
      `GitHub: ${githubUrl}`,
      `LinkedIn: ${linkedinUrl}`,
      `Website: ${siteUrl}`,
    ]),
    '## Highlights',
    bullets(Object.values(en.highlights.items).map((item) => `${item.headline}: ${item.detail}`)),
    '## Experience',
    ...experience('work').map(role),
    '## Education',
    ...experience('education').map(role),
    `## ${en.caseStudies.title}`,
    ...caseStudies.map((study) => {
      const item = en.caseStudies.items[study.id]
      return [
        `### ${item.title} (${study.org}, ${study.period})`,
        item.summary,
        `Context: ${item.context}`,
        `Role: ${item.role}`,
        `**Key decisions**\n${bullets(item.decisions)}`,
        `**Outcome**\n${bullets(item.outcomes)}`,
        `Stack: ${study.stack.join(', ')}`,
      ].join('\n\n')
    }),
    '## Skills',
    bullets(skillGroups.map((group) => `${en.skills.groups[group.id]}: ${group.skills.join(', ')}`)),
    ...(publishedCertificates.length
      ? [
          '## Certificates',
          bullets(publishedCertificates.map((certificate) => `${certificate.title}, ${certificate.issuer} (${month(certificate.issued)})`)),
        ]
      : []),
  ].join('\n\n')
}

function structuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: siteUrl,
    mainEntity: {
      '@type': 'Person',
      name: NAME,
      jobTitle,
      description,
      url: siteUrl,
      image: new URL('og.png', siteUrl).href,
      email: `mailto:${email}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: location.city,
        addressRegion: location.region,
        addressCountry: location.country,
      },
      worksFor: { '@type': 'Organization', name: 'WEG', url: 'https://www.weg.net' },
      alumniOf: journeyEntries
        .filter((entry) => entry.lane === 'education')
        .map((entry) => ({ '@type': 'CollegeOrUniversity', name: entry.org, url: entry.orgUrl })),
      knowsAbout: skills,
      knowsLanguage: [
        { '@type': 'Language', name: 'Portuguese', alternateName: 'pt' },
        { '@type': 'Language', name: 'English', alternateName: 'en' },
      ],
      hasCredential: publishedCertificates.map((certificate) => ({
        '@type': 'EducationalOccupationalCredential',
        name: certificate.title,
        recognizedBy: { '@type': 'Organization', name: certificate.issuer },
        dateCreated: certificate.issued,
      })),
      sameAs: [githubUrl, linkedinUrl],
    },
  }
}

function headTags() {
  const title = `${NAME}, ${jobTitle}`
  const image = new URL('og.png', siteUrl).href
  return `
    <meta name="description" content="${escape(description)}" />
    <meta name="author" content="${NAME}" />
    <link rel="canonical" href="${siteUrl}" />
    <link rel="alternate" type="text/markdown" href="${siteUrl}llms.txt" title="Profile in Markdown" />
    <meta property="og:type" content="profile" />
    <meta property="og:url" content="${siteUrl}" />
    <meta property="og:title" content="${escape(title)}" />
    <meta property="og:description" content="${escape(description)}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:locale:alternate" content="pt_BR" />
    <meta property="profile:first_name" content="Gabriel" />
    <meta property="profile:last_name" content="Rosa" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escape(title)}" />
    <meta name="twitter:description" content="${escape(description)}" />
    <meta name="twitter:image" content="${image}" />
    <script type="application/ld+json">${JSON.stringify(structuredData()).replace(/</g, '\\u003c')}</script>`
}

export function profilePlugin(): Plugin {
  return {
    name: 'static-profile',
    transformIndexHtml(html) {
      return html
        .replace('</head>', `${headTags()}\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root">${renderHtml()}\n    </div>`)
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: `${renderMarkdown()}\n` })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`,
      })
    },
  }
}
