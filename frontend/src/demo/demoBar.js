/**
 * @file demoBar.js
 * @description Barra flotante de la demo: explica que los datos son de prueba y permite
 * entrar como admin o cliente con un clic, o reiniciar todo.
 */
import { DEMO_ADMIN, DEMO_CUSTOMER, resetDemo } from './mockBackend';

export function mountDemoBar(api) {
    const bar = document.createElement('div');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Controles de la demo');
    bar.innerHTML = `
      <style>
        #vm-demo{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9999;font:13px/1.4 system-ui,sans-serif;color:#0b1020}
        #vm-demo .tab{background:#ffc933;color:#1d1500;border:0;border-radius:999px;padding:8px 14px;font-weight:800;cursor:pointer;box-shadow:0 6px 20px #0006}
        #vm-demo .panel{margin-bottom:8px;background:#fff;border-radius:14px;padding:14px;width:min(300px,calc(100vw - 24px));box-shadow:0 12px 40px #0008;display:grid;gap:8px}
        #vm-demo .panel[hidden]{display:none}
        #vm-demo b{font-size:14px}
        #vm-demo p{margin:0;color:#475069}
        #vm-demo code{background:#eef1fb;border-radius:4px;padding:1px 5px;font-size:12px}
        #vm-demo .row{display:flex;gap:6px;flex-wrap:wrap}
        #vm-demo .row button{flex:1;border:1px solid #d7dcea;background:#f5f7fd;border-radius:8px;padding:7px 8px;font-weight:700;cursor:pointer;color:#0b1020}
        #vm-demo .row button.primary{background:#2f6fea;color:#fff;border-color:#2f6fea}
        #vm-demo button:focus-visible{outline:3px solid #2f6fea;outline-offset:2px}
      </style>
      <div id="vm-demo">
        <div class="panel" hidden>
          <b>Demo de Visualmind</b>
          <p>Es la tienda real con datos de prueba. Todo lo que hagas se guarda solo en este navegador.</p>
          <p>Admin: <code>${DEMO_ADMIN.email}</code> / <code>${DEMO_ADMIN.password}</code><br>
             Cliente: <code>${DEMO_CUSTOMER.email}</code> / <code>${DEMO_CUSTOMER.password}</code></p>
          <div class="row">
            <button type="button" class="primary" data-act="admin">Entrar como admin</button>
            <button type="button" data-act="customer">Como cliente</button>
          </div>
          <div class="row">
            <button type="button" data-act="guest">Salir (invitado)</button>
            <button type="button" data-act="reset">Reiniciar demo</button>
          </div>
        </div>
        <button type="button" class="tab" aria-expanded="false">DEMO ▴</button>
      </div>`;
    document.body.appendChild(bar);

    const panel = bar.querySelector('.panel');
    const tab = bar.querySelector('.tab');
    tab.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        tab.setAttribute('aria-expanded', String(!panel.hidden));
        tab.textContent = panel.hidden ? 'DEMO ▴' : 'DEMO ▾';
    });

    const signIn = async ({ email, password }, route) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.hash = route;
        window.location.reload();
    };

    bar.addEventListener('click', async (e) => {
        const act = e.target?.dataset?.act;
        if (!act) return;
        try {
            if (act === 'admin') await signIn(DEMO_ADMIN, '#/admin');
            if (act === 'customer') await signIn(DEMO_CUSTOMER, '#/shop');
            if (act === 'guest') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.hash = '#/';
                window.location.reload();
            }
            if (act === 'reset') {
                resetDemo();
                window.location.hash = '#/';
                window.location.reload();
            }
        } catch (err) {
            console.error('[Demo]', err);
        }
    });
}
