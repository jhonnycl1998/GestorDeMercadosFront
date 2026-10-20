// Prueba de rendimiento de la API Gestor de Mercados con k6.
// Ejecutar:  k6 run carga.js
// Cambia USUARIO y CLAVE por un admin real, o pásalos así:
//   k6 run -e USUARIO=admin -e CLAVE=123456 carga.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';

http.setResponseCallback(http.expectedStatuses(200, 404)); // reporte-hoy devuelve 404 si no hay pagos

const API = __ENV.API || 'http://localhost:5083/api';
const USUARIO = __ENV.USUARIO || 'admin';
const CLAVE = __ENV.CLAVE || 'admin123';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // sube a 10 usuarios
    { duration: '1m', target: 10 },  // se mantiene
    { duration: '30s', target: 0 },  // baja
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% de peticiones en menos de 800 ms
    http_req_failed: ['rate<0.01'],   // menos de 1% de errores
  },
};

// Se ejecuta una vez: hace login y comparte el token con todos los usuarios virtuales.
export function setup() {
  const res = http.post(
    `${API}/Usuario/login`,
    JSON.stringify({ usuario: USUARIO, contrasena: CLAVE }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  return { token: res.json('token') };
}

export default function (data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` } };

  group('Consultas principales', () => {
    const endpoints = [
      'Dueno/getDuenos',
      'Tienda/getTiendas',
      'Servicio/getServicios',
      'Deuda/getDeudas',
      'Pago/reporte-hoy',
    ];
    for (const ep of endpoints) {
      const res = http.get(`${API}/${ep}`, params);
      check(res, { [`${ep} responde 200/404`]: (r) => r.status === 200 || r.status === 404 });
    }
  });

  sleep(1);
}
