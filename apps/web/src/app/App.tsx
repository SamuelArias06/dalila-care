import { useEffect, useState } from 'preact/hooks';
import { greetingFor } from '@dalila/shared';
import { match, route, startRouter } from './router.js';
import { boot, installSyncTriggers, isOnboarded, ready, session } from '../data/store.js';
import { TabBar } from './TabBar.js';
import { SyncBar } from './SyncBar.js';
import { InstallHint } from './InstallHint.js';
import { Tour } from '../components/Tour.js';
import { Toaster } from '../ui/Kit.js';
import { Logo } from '../ui/Icons.js';

import { InviteScreen } from '../screens/Invite.js';
import { OnboardingScreen } from '../screens/Onboarding.js';
import { TodayScreen } from '../screens/Today.js';
import { CheckinScreen } from '../screens/Checkin.js';
import { HistoryScreen, DayDetailScreen } from '../screens/History.js';
import { TrendsScreen } from '../screens/Trends.js';
import { MomentsScreen } from '../screens/Moments.js';
import { DalilaScreen, ProfileScreen, SettingsScreen, AdminScreen } from '../screens/Dalila.js';
import { RoutinesScreen, TaskEditScreen } from '../screens/Routines.js';
import { MedicationsScreen, MedicationEditScreen } from '../screens/Medications.js';
import { FoodScreen, FoodEditScreen } from '../screens/Food.js';
import { WeightScreen, ActivityScreen, EventsScreen } from '../screens/Records.js';
import { ConcernScreen } from '../screens/Concern.js';
import { QuestionsScreen, VetPlanScreen, ConsultScreen, ReportScreen } from '../screens/Vet.js';
import { MediaScreen, DocumentsScreen } from '../screens/Media.js';
import { QuickAdd } from '../screens/QuickAdd.js';

/** Rutas sin barra de pestañas: flujos que piden foco. */
const FULLSCREEN = ['/invitacion', '/bienvenida', '/preocupa', '/reporte'];

export function App() {
  const [quickAdd, setQuickAdd] = useState(false);

  useEffect(() => {
    startRouter();
    void boot();
    installSyncTriggers();
  }, []);

  if (!ready.value) return <Splash />;
  if (!session.value) return <InviteScreen />;

  const r = route.value;
  const inviteParams = match('/invitacion/:code', r.path);
  if (inviteParams) return <InviteScreen code={inviteParams['code']} />;

  if (!isOnboarded.value) return <OnboardingScreen />;

  const isFullscreen = FULLSCREEN.some((p) => r.path.startsWith(p));

  return (
    <>
      <main class={`screen ${isFullscreen ? 'screen--no-tabbar' : ''}`}>
        <SyncBar />
        <Screen />
      </main>
      {!isFullscreen && <TabBar onQuickAdd={() => setQuickAdd(true)} />}
      <QuickAdd open={quickAdd} onClose={() => setQuickAdd(false)} />
      <InstallHint />
      <Tour />
      <Toaster />
    </>
  );
}

function Screen() {
  const r = route.value;
  const p = r.path;

  const m = (pattern: string) => match(pattern, p);

  if (p === '/' || p === '') return <TodayScreen />;
  if (p === '/historial') return <HistoryScreen />;
  if (p === '/tendencias') return <TrendsScreen />;
  if (p === '/momentos') return <MomentsScreen />;
  if (p === '/dalila') return <DalilaScreen />;

  let params = m('/dia/:date');
  if (params) return <DayDetailScreen date={params['date']!} />;

  params = m('/checkin/:date');
  if (params) return <CheckinScreen date={params['date']!} />;
  if (p === '/checkin') return <CheckinScreen />;

  if (p === '/rutinas') return <RoutinesScreen />;
  params = m('/rutinas/:id');
  if (params) return <TaskEditScreen id={params['id']!} />;

  if (p === '/medicamentos') return <MedicationsScreen />;
  params = m('/medicamentos/:id');
  if (params) return <MedicationEditScreen id={params['id']!} />;

  if (p === '/alimentacion') return <FoodScreen />;
  params = m('/alimentacion/:id');
  if (params) return <FoodEditScreen id={params['id']!} />;

  if (p === '/peso') return <WeightScreen />;
  if (p === '/actividad') return <ActivityScreen />;
  if (p === '/eventos') return <EventsScreen />;
  if (p === '/preocupa') return <ConcernScreen />;

  if (p === '/preguntas') return <QuestionsScreen />;
  if (p === '/plan') return <VetPlanScreen />;
  if (p === '/consulta') return <ConsultScreen />;
  if (p === '/reporte') return <ReportScreen />;

  if (p === '/videos') return <MediaScreen />;
  if (p === '/documentos') return <DocumentsScreen />;

  if (p === '/perfil') return <ProfileScreen />;
  if (p === '/ajustes') return <SettingsScreen />;
  if (p === '/diagnostico') return <AdminScreen />;

  return <TodayScreen />;
}

function Splash() {
  const g = greetingFor();
  return (
    <div
      style="min-height:100dvh;display:grid;place-items:center;gap:var(--s-4);text-align:center;padding:var(--s-6)"
    >
      <div class="stack" style="align-items:center;gap:var(--s-4)">
        <div style="animation:rise 500ms var(--ease-out) both">
          <Logo size={68} />
        </div>
        <div>
          <p class="t-subtitle">Dalila Care</p>
          <p class="t-sm t-soft">{g.text} ❤️</p>
        </div>
      </div>
    </div>
  );
}
