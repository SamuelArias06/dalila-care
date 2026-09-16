import { useEffect, useState } from 'preact/hooks';
import { Button, Field, Input, Notice } from '../ui/Kit.js';
import { Logo } from '../ui/Icons.js';
import { ApiError, call } from '../data/api.js';
import { setSession, sync, type Session } from '../data/store.js';
import { go } from '../app/router.js';

/**
 * Acceso por enlace mágico.
 *
 * Se abre el enlace una vez y el dispositivo queda recordado para siempre: sin
 * contraseñas, sin pantalla de login, sin avisos de "Google no ha verificado
 * esta app". El código es de un solo uso, así que reenviar el enlace no da
 * acceso a nadie más.
 */
export function InviteScreen({ code }: { code?: string }) {
  const [value, setValue] = useState(code ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [auto, setAuto] = useState(!!code);

  const redeem = async (raw: string) => {
    const clean = raw.trim();
    if (!clean) {
      setError('Pega aquí el código que te compartieron.');
      setAuto(false);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const s = await call<Session>(
        'auth.redeemInvite',
        { inviteCode: clean, deviceLabel: deviceLabel() },
        { withoutToken: true },
      );
      await setSession(s);
      // Limpia el código de la URL: no debe quedar en el historial del navegador.
      go('/', { replace: true });
      void sync(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.userMessage : 'No pudimos validar el enlace.');
      setAuto(false);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (code) void redeem(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <main class="screen screen--no-tabbar" style="display:grid;place-items:center;min-height:100dvh">
      <div class="stack-lg rise" style="width:100%;max-width:400px;text-align:center">
        <div class="stack" style="align-items:center;gap:var(--s-4)">
          <Logo size={72} />
          <div>
            <h1 class="t-title">Dalila Care</h1>
            <p class="t-md t-soft" style="margin-top:var(--s-1)">
              Un lugar tranquilo para cuidarla todos los días.
            </p>
          </div>
        </div>

        {auto && !error ? (
          <div class="glass pad stack" style="align-items:center">
            <p class="t-body t-soft">Validando tu enlace…</p>
          </div>
        ) : (
          <div class="glass pad stack">
            <Field
              label="Código de acceso"
              hint="Es el enlace que te compartieron. Solo hace falta una vez en este dispositivo."
              error={error}
            >
              <Input
                value={value}
                placeholder="Pega aquí tu código"
                autocomplete="off"
                autocapitalize="off"
                spellcheck={false}
                onInput={(e) => setValue((e.target as HTMLInputElement).value)}
              />
            </Field>
            <Button variant="primary" block disabled={busy} onClick={() => void redeem(value)}>
              {busy ? 'Validando…' : 'Entrar'}
            </Button>
          </div>
        )}

        <Notice tone="info">
          Tus datos y los vídeos de Dalila se guardan en una cuenta privada de Google. Nada es público.
        </Notice>
      </div>
    </main>
  );
}

function deviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  return 'Dispositivo';
}
