import { route, go } from './router.js';
import { IconHome, IconTimeline, IconPlus, IconHeart, IconPaw } from '../ui/Icons.js';

const TABS = [
  { path: '/', label: 'Hoy', Icon: IconHome },
  { path: '/historial', label: 'Historial', Icon: IconTimeline },
] as const;

const TABS_RIGHT = [
  { path: '/momentos', label: 'Momentos', Icon: IconHeart },
  { path: '/dalila', label: 'Dalila', Icon: IconPaw },
] as const;

export function TabBar({ onQuickAdd }: { onQuickAdd: () => void }) {
  const current = route.value.path;
  const isOn = (p: string) => (p === '/' ? current === '/' || current === '' : current.startsWith(p));

  return (
    <nav class="tabbar" aria-label="Navegación principal">
      <div class="tabbar__inner">
        {TABS.map(({ path, label, Icon }) => (
          <button
            key={path}
            type="button"
            class="tab"
            aria-current={isOn(path) ? 'page' : undefined}
            onClick={() => go(path)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}

        <button type="button" class="tab tab--action" onClick={onQuickAdd} aria-label="Registrar algo">
          <span
            style="width:40px;height:40px;border-radius:var(--r-full);display:grid;place-items:center;
              background:var(--gradient-brand);color:#fff;box-shadow:var(--shadow-brand);margin-top:-2px"
          >
            <IconPlus size={22} />
          </span>
          <span style="font-size:10px">Registrar</span>
        </button>

        {TABS_RIGHT.map(({ path, label, Icon }) => (
          <button
            key={path}
            type="button"
            class="tab"
            aria-current={isOn(path) ? 'page' : undefined}
            onClick={() => go(path)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
