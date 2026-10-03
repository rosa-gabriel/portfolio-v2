import { useState } from 'react'
import { Database, LayoutDashboard, LogIn, LogOut, RotateCcw, Server, Timer, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { addToken, advance, createEngine, float, type Box, type Engine, type Point, type Tone } from './engine'
import { FlowAction, FlowSection } from './flow-section'
import { Connectors, Floaters, HaloLabel, Icon, Label, Logo, Node, Tokens, centerOf } from './primitives'
import { useFlowLoop } from './use-flow-loop'

type Mode = 'local' | 'sso'
type Anchor = { kind: 'user' } | { kind: 'app'; index: number } | { kind: 'keycloak' } | { kind: 'api' }
type Note = 'idle' | 'login' | 'secondApp' | 'api' | 'refresh' | 'expired' | 'logout' | 'needLogin'
type AppState = { loggedIn: boolean; tokenValid: boolean }

type Sim = Engine<Anchor> & {
  mode: Mode
  apps: AppState[]
  session: boolean
  passwords: number
  roundTrips: number
  refreshes: number
  note: Note
}

const APPS = ['portal', 'dashboard']
const HOP = 520
const USER_HOP = 700

function createSim(mode: Mode): Sim {
  return {
    ...createEngine<Anchor>(),
    mode,
    apps: APPS.map(() => ({ loggedIn: false, tokenValid: false })),
    session: false,
    passwords: 0,
    roundTrips: 0,
    refreshes: 0,
    note: 'idle',
  }
}

const app = (index: number): Anchor => ({ kind: 'app', index })
const keycloak: Anchor = { kind: 'keycloak' }
const api: Anchor = { kind: 'api' }
const user: Anchor = { kind: 'user' }

function hop(sim: Sim, from: Anchor, to: Anchor, tone: Tone, label: string, then?: () => void, duration = HOP) {
  addToken(sim, { from, to, tone, label, duration, arrive: then })
}

function finishLogin(sim: Sim, index: number) {
  const other = sim.apps[1 - index]
  sim.apps[index] = { loggedIn: true, tokenValid: true }
  sim.note = other.loggedIn ? 'secondApp' : 'login'
  float(sim, { anchor: app(index), text: '✓', tone: 'green', size: 16 })
}

function login(sim: Sim, index: number) {
  if (sim.apps[index].loggedIn) {
    float(sim, { anchor: app(index), text: '✓', tone: 'green', size: 16 })
    return
  }

  if (sim.mode === 'local') {
    sim.passwords++
    hop(sim, user, app(index), 'yellow', 'pwd', () => finishLogin(sim, index), USER_HOP)
    return
  }

  hop(sim, user, app(index), 'yellow', 'click', () =>
    hop(sim, app(index), keycloak, 'blue', 'redirect', () => {
      if (sim.session) {
        float(sim, { anchor: keycloak, text: 'SSO ✓', tone: 'green', size: 13 })
        hop(sim, keycloak, app(index), 'green', 'JWT', () => finishLogin(sim, index))
        return
      }
      sim.passwords++
      hop(
        sim,
        user,
        keycloak,
        'yellow',
        'pwd',
        () => {
          sim.session = true
          hop(sim, keycloak, app(index), 'green', 'JWT', () => finishLogin(sim, index))
        },
        USER_HOP,
      )
    }),
  )
}

function callApi(sim: Sim) {
  const index = sim.apps.findIndex((state) => state.loggedIn)
  if (index === -1) {
    sim.note = 'needLogin'
    return
  }

  if (sim.mode === 'local') {
    hop(sim, app(index), api, 'yellow', 'cookie', () => {
      sim.roundTrips++
      hop(sim, api, app(index), 'violet', 'valid?', () =>
        hop(sim, app(index), api, 'green', 'ok', () => {
          float(sim, { anchor: api, text: '200', tone: 'green' })
          sim.note = 'api'
        }),
      )
    })
    return
  }

  const succeed = () => {
    float(sim, { anchor: api, text: '✓ sig', tone: 'green', size: 12 })
    hop(sim, api, app(index), 'green', '200')
  }

  hop(sim, app(index), api, 'green', 'JWT', () => {
    if (sim.apps[index].tokenValid) {
      sim.note = 'api'
      return succeed()
    }
    float(sim, { anchor: api, text: '401', tone: 'red' })
    hop(sim, api, app(index), 'red', '401', () =>
      hop(sim, app(index), keycloak, 'blue', 'refresh', () =>
        hop(sim, keycloak, app(index), 'green', 'JWT', () => {
          sim.apps[index].tokenValid = true
          sim.refreshes++
          sim.note = 'refresh'
          hop(sim, app(index), api, 'green', 'JWT', succeed)
        }),
      ),
    )
  })
}

function expire(sim: Sim) {
  sim.apps.forEach((state, index) => {
    if (!state.loggedIn) return
    state.tokenValid = false
    float(sim, { anchor: app(index), text: 'exp', tone: 'yellow', size: 12 })
  })
  sim.note = 'expired'
}

function logout(sim: Sim) {
  if (!sim.apps[0].loggedIn) {
    sim.note = 'needLogin'
    return
  }

  if (sim.mode === 'local') {
    sim.apps[0] = { loggedIn: false, tokenValid: false }
    float(sim, { anchor: app(0), text: 'bye', tone: 'yellow', size: 12 })
    sim.note = 'logout'
    return
  }

  hop(sim, app(0), keycloak, 'blue', 'logout', () => {
    sim.session = false
    APPS.forEach((_, index) => {
      if (!sim.apps[index].loggedIn) return
      hop(sim, keycloak, app(index), 'red', 'logout', () => {
        sim.apps[index] = { loggedIn: false, tokenValid: false }
      })
    })
    sim.note = 'logout'
  })
}

type AppLayout = { box: Box; name: Point; status: Point; store: Point }

type Layout = {
  width: number
  height: number
  user: Box
  apps: AppLayout[]
  keycloak: Box
  keycloakLogo: Point
  openidLogo: Point
  keycloakTitle: Point
  keycloakSub: Point
  keycloakSession: Point
  api: Box
  apiIcon: Point
  apiTitle: Point
  apiStatus: Point
  connectors: string[]
}

const horizontal: Layout = {
  width: 1000,
  height: 400,
  user: { x: 25, y: 168, w: 120, h: 64 },
  apps: [70, 250].map((y) => ({
    box: { x: 260, y, w: 180, h: 80 },
    name: { x: 350, y: y + 32 },
    status: { x: 350, y: y + 58 },
    store: { x: 420, y: y + 18 },
  })),
  keycloak: { x: 530, y: 110, w: 190, h: 180 },
  keycloakLogo: { x: 600, y: 156 },
  openidLogo: { x: 652, y: 156 },
  keycloakTitle: { x: 625, y: 212 },
  keycloakSub: { x: 625, y: 232 },
  keycloakSession: { x: 625, y: 264 },
  api: { x: 800, y: 145, w: 175, h: 110 },
  apiIcon: { x: 887, y: 176 },
  apiTitle: { x: 887, y: 214 },
  apiStatus: { x: 887, y: 238 },
  connectors: [
    'M145 200 L260 110',
    'M145 200 L260 290',
    'M440 110 L530 170',
    'M440 290 L530 230',
    'M440 110 L800 190',
    'M440 290 L800 210',
  ],
}

const vertical: Layout = {
  width: 400,
  height: 700,
  user: { x: 140, y: 16, w: 120, h: 56 },
  apps: [10, 210].map((x) => ({
    box: { x, y: 130, w: 180, h: 80 },
    name: { x: x + 90, y: 162 },
    status: { x: x + 90, y: 188 },
    store: { x: x + 160, y: 148 },
  })),
  keycloak: { x: 100, y: 280, w: 200, h: 180 },
  keycloakLogo: { x: 174, y: 326 },
  openidLogo: { x: 226, y: 326 },
  keycloakTitle: { x: 200, y: 382 },
  keycloakSub: { x: 200, y: 402 },
  keycloakSession: { x: 200, y: 434 },
  api: { x: 110, y: 540, w: 180, h: 110 },
  apiIcon: { x: 200, y: 572 },
  apiTitle: { x: 200, y: 610 },
  apiStatus: { x: 200, y: 634 },
  connectors: [
    'M200 72 L100 130',
    'M200 72 L300 130',
    'M100 210 L170 280',
    'M300 210 L230 280',
    'M60 210 C 20 420, 60 560, 110 595',
    'M340 210 C 380 420, 340 560, 290 595',
  ],
}

function resolver(layout: Layout) {
  return (anchor: Anchor): Point => {
    switch (anchor.kind) {
      case 'user':
        return centerOf(layout.user)
      case 'app':
        return centerOf(layout.apps[anchor.index].box)
      case 'keycloak':
        return centerOf(layout.keycloak)
      case 'api':
        return centerOf(layout.api)
    }
  }
}

export function AuthFlow() {
  const { t } = useTranslation()
  const [sim, setSim] = useState(() => createSim('sso'))
  const { containerRef, vertical: isVertical, refresh } = useFlowLoop((dt) => advance(sim, dt))
  const layout = isVertical ? vertical : horizontal
  const resolve = resolver(layout)
  const isSso = sim.mode === 'sso'

  const act = (action: () => void) => () => {
    action()
    refresh()
  }

  const captionKey = `auth.caption.${sim.note === 'needLogin' ? 'needLogin' : `${sim.mode}${sim.note[0].toUpperCase()}${sim.note.slice(1)}`}`

  return (
    <FlowSection
      eyebrow={t('auth.eyebrow')}
      title={t('auth.title')}
      subtitle={t('auth.subtitle')}
      goals={[t('auth.goal1'), t('auth.goal2'), t('auth.goal3'), t('auth.goal4')]}
      windowTitle="auth.live"
      modeLabel={t('auth.modeLabel')}
      modes={[
        { id: 'local', label: t('auth.modeLocal') },
        { id: 'sso', label: t('auth.modeSso') },
      ]}
      mode={sim.mode}
      onModeChange={(mode) => setSim(createSim(mode))}
      actions={
        <>
          <FlowAction icon={LogIn} label={t('auth.loginPortal')} onClick={act(() => login(sim, 0))} />
          <FlowAction icon={LayoutDashboard} label={t('auth.openDashboard')} onClick={act(() => login(sim, 1))} />
          <FlowAction icon={Server} label={t('auth.callApi')} onClick={act(() => callApi(sim))} />
          {isSso && <FlowAction icon={Timer} label={t('auth.expire')} onClick={act(() => expire(sim))} />}
          <FlowAction icon={LogOut} label={t('auth.logout')} onClick={act(() => logout(sim))} />
          <FlowAction icon={RotateCcw} label={t('flow.reset')} variant="ghost" onClick={() => setSim(createSim(sim.mode))} />
        </>
      }
      metrics={[
        { label: t('auth.passwords'), value: sim.passwords, className: 'text-kanagawa-yellow' },
        { label: t('auth.stores'), value: isSso ? 1 : APPS.length, className: isSso ? 'text-kanagawa-green' : 'text-kanagawa-red' },
        { label: t('auth.roundTrips'), value: sim.roundTrips, className: sim.roundTrips ? 'text-kanagawa-red' : undefined },
        { label: t('auth.refreshes'), value: sim.refreshes, className: 'text-kanagawa-blue' },
      ]}
      caption={t(captionKey as 'auth.caption.ssoIdle')}
      containerRef={containerRef}
      viewBox={layout}
      diagramLabel={t(isSso ? 'auth.diagramSso' : 'auth.diagramLocal')}
    >
      <Connectors paths={layout.connectors} />

      <Node box={layout.user}>
        <Icon icon={User} at={{ x: centerOf(layout.user).x, y: centerOf(layout.user).y - 9 }} size={20} />
        <Label at={{ x: centerOf(layout.user).x, y: centerOf(layout.user).y + 20 }} size={12}>
          {t('auth.user')}
        </Label>
      </Node>

      {layout.apps.map((appLayout, index) => {
        const state = sim.apps[index]
        return (
          <Node key={APPS[index]} box={appLayout.box} accent={state.loggedIn ? 'green' : undefined}>
            <Label at={appLayout.name}>{APPS[index]}</Label>
            <Label at={appLayout.status} size={11} tone={state.loggedIn ? (state.tokenValid ? 'green' : 'yellow') : 'muted'}>
              {state.loggedIn ? (state.tokenValid ? t('auth.loggedIn') : t('auth.tokenExpired')) : t('auth.loggedOut')}
            </Label>
            {!isSso && <Icon icon={Database} at={appLayout.store} size={16} tone="red" />}
          </Node>
        )
      })}

      <Node box={layout.keycloak} dim={!isSso} dashed={!isSso} accent={isSso && sim.session ? 'blue' : undefined}>
        <Logo id="keycloak" at={layout.keycloakLogo} size={38} />
        <Logo id="openid" at={layout.openidLogo} size={30} />
        <Label at={layout.keycloakTitle}>Keycloak</Label>
        <Label at={layout.keycloakSub} size={11} tone="muted">
          OpenID Connect
        </Label>
        <Label at={layout.keycloakSession} size={11} tone={sim.session ? 'blue' : 'muted'}>
          {sim.session ? t('auth.sessionOn') : t('auth.sessionOff')}
        </Label>
      </Node>
      {!isSso && (
        <HaloLabel at={{ x: centerOf(layout.keycloak).x, y: centerOf(layout.keycloak).y + 5 }} size={13}>
          {t('auth.noIdp')}
        </HaloLabel>
      )}

      <Node box={layout.api}>
        <Icon icon={Server} at={layout.apiIcon} size={22} />
        <Label at={layout.apiTitle}>orders api</Label>
        <Label at={layout.apiStatus} size={11} tone={isSso ? 'green' : 'red'}>
          {isSso ? t('auth.apiJwks') : t('auth.apiCallsBack')}
        </Label>
      </Node>

      <Tokens engine={sim} resolve={resolve} />
      <Floaters engine={sim} resolve={resolve} />
    </FlowSection>
  )
}
