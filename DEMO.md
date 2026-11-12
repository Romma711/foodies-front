# Guía de la demo de Foodies

Guía para la presentación en vivo. Seguila de arriba hacia abajo el día de la demo.

## 1. Antes de empezar

Necesitás los dos repositorios uno al lado del otro:

```
FoodiesCompleto/
├── foodies-repo/    (back: Spring Boot + MySQL + JWT)
└── foodies-front/   (front: Angular)
```

Herramientas: Java 21 o superior, Node.js 20 o superior, MySQL 8 y un navegador con conexión a internet (el mapa la necesita).

## 2. Levantar MySQL (puerto 13306)

La demo usa una base MySQL 8 escuchando en el puerto **13306**.

- Si ya la tenés instalada en ese puerto, solo verificá que el servicio esté corriendo.
- Si usás Docker, una base limpia se levanta así:

  ```bash
  docker run -d --name foodies-mysql -p 13306:3306 -e MYSQL_ROOT_PASSWORD=<clave-root> -e MYSQL_DATABASE=foodies -e MYSQL_USER=foodies_app -e MYSQL_PASSWORD=<clave-app> mysql:8.0
  ```

- Sin Docker, creá la base y el usuario con `foodies-repo/docs/db/crear-usuario-local.sql` (reemplazá la clave antes de correrlo).

Las tablas no se crean a mano: el back las genera al arrancar (`ddl-auto=update`) y también crea la cuenta de administrador.

### Base limpia para la demo

El seed solo toca los restaurantes y las cuentas de la demo. Si la base tiene datos de prueba viejos (restaurantes "asdasd", cuentas de prueba, restaurantes de una versión anterior del seed), van a aparecer en el catálogo. Para empezar de cero, borrá y volvé a crear la base **antes** de arrancar el back:

```sql
DROP DATABASE foodies;
CREATE DATABASE foodies CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. Variables de entorno del back

Definilas en la terminal donde vas a arrancar el back. No las escribas en ningún archivo que se suba al repositorio.

| Variable | Obligatoria | Valor |
| --- | --- | --- |
| `DB_HOST` | Sí | `localhost` |
| `DB_PORT` | Sí | `13306` |
| `DB_NAME` | Sí | `foodies` |
| `DB_USER` | Sí | El usuario de MySQL (por ejemplo `foodies_app`) |
| `DB_PASS` | Sí | La clave de ese usuario |
| `JWT_SECRET` | Sí | Una clave de **32 caracteres o más**. Sin ella el back no arranca, a propósito. |
| `MAIL_USERNAME` | No | Usuario SMTP (por defecto apunta al sandbox de Mailtrap). Sin él, los emails de aprobación, confirmación y sanción no salen, pero la app funciona igual. |
| `MAIL_PASSWORD` | No | Clave SMTP del usuario anterior. |

Para generar un `JWT_SECRET` válido:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Ejemplo en PowerShell (completá los valores entre `<>`):

```powershell
$env:DB_HOST="localhost"; $env:DB_PORT="13306"; $env:DB_NAME="foodies"
$env:DB_USER="foodies_app"; $env:DB_PASS="<clave-app>"
$env:JWT_SECRET="<clave-de-32-caracteres-o-mas>"
```

## 4. Arrancar el back (puerto 8080)

Desde `foodies-repo`, en la misma terminal donde definiste las variables:

```bash
./mvnw spring-boot:run
```

En Windows con cmd o PowerShell: `.\mvnw.cmd spring-boot:run`. Está listo cuando el log dice `Started FoodiesApplication`. La documentación de la API queda en http://localhost:8080/swagger-ui.html.

## 5. Cargar los datos de la demo (seed)

Con el back corriendo, desde `foodies-repo`:

```bash
node docs/db/seed-demo.mjs
```

Si el back no está en `http://localhost:8080`, pasale la URL: `node docs/db/seed-demo.mjs http://localhost:9090`.

El seed se puede correr **todas las veces que quieras**: siempre deja el mismo estado. Correlo una vez después de cada ensayo y otra vez justo antes de presentar. En cada corrida:

- crea las cuentas que falten y reactiva las que se hayan dado de baja;
- restaura nombre, dirección, especialidad y cupo de cada restaurante, y apaga la aceptación automática;
- borra **todas** las reservas y reseñas de los restaurantes de la demo y las vuelve a crear.

Resultado: 7 restaurantes de Mar del Plata (dos parrillas, sushi, pastas, pescados, café y minutas), 9 clientes, 15 reseñas y 12 reservas (pendientes, aceptadas y canceladas) en los próximos días.

Lo único que no se puede deshacer por la API son los **strikes**: se acumulan entre corridas (el límite es 3 por cuenta).

### Cuentas de la demo

Todas las cuentas de la demo usan la clave `demo1234`. La del administrador la crea el back.

| Rol | Email | Clave | Para qué |
| --- | --- | --- | --- |
| Cliente | `lucia.fernandez@demo.foodies.com` | `demo1234` | La clienta del recorrido: no tiene reservas ni reseñas. |
| Restaurante | `labrasadeguemes@demo.foodies.com` | `demo1234` | La Brasa de Güemes (parrilla), donde reserva Lucía. |
| Administrador | `admin@foodies.com` | `admin123` | Moderación. |
| Otros clientes | `ana.gomez@`, `bruno.diaz@`, `carla.ruiz@`, `diego.sosa@`, `elena.paz@`, `facundo.rios@`, `gala.torres@`, `hernan.vega@` + `demo.foodies.com` | `demo1234` | Autores de las reseñas y reservas cargadas. |
| Otros restaurantes | `donramonparrilla@`, `kaiyosushibar@`, `trattorianonnarosa@`, `cantinadelpuerto@`, `cafedelarambla@`, `elrincondemirta@` + `demo.foodies.com` | `demo1234` | Paneles de los demás restaurantes. |

## 6. Arrancar el front (puerto 4200)

Desde `foodies-front`:

```bash
npm install
npm start
```

- Sitio de clientes: http://localhost:4200
- Panel de restaurantes y de administración: http://dashboard.localhost:4200 (`/restaurante/login` y `/admin/login`)

El front le pasa las llamadas a `/api` al back en el puerto 8080 (`proxy.conf.json`).

Consejo: usá una ventana normal para la clienta y otra de incógnito para el dashboard, así las sesiones no se pisan.

## 7. Guion de la demo

Un solo recorrido, de punta a punta. Cada paso dice qué mostrar y qué contar.

### Cliente: buscar, reservar y reseñar

1. Abrí http://localhost:4200 y mostrá la portada.
2. Tocá la especialidad **Parrilla**: el catálogo se filtra y quedan La Brasa de Güemes y Don Ramón Parrilla. Cambiá a la vista **Mapa** para verlos ubicados en Mar del Plata.
3. Entrá a **La Brasa de Güemes**: fotos, dirección, reseñas con su fecha y calificación.
4. Iniciá sesión como `lucia.fernandez@demo.foodies.com`. Mostrá que el pie de página ahora refleja la sesión.
5. Reservá para mañana a las 21:00 para 4 personas. La reserva queda **PENDIENTE**.
6. En **Mis reservas**, modificá la cantidad: probá poner 0 para mostrar que el error aparece al instante, después dejá 3 y guardá. Contá que al modificarla vuelve a quedar pendiente.
7. Volvé a La Brasa de Güemes y dejá una reseña de 5 estrellas. El comentario tiene que tener entre 10 y 255 caracteres (por ejemplo: "Excelente asado y muy buena atención.").

### Restaurante: confirmar la reserva

8. En la ventana de incógnito, entrá a http://dashboard.localhost:4200/restaurante/login con `labrasadeguemes@demo.foodies.com`.
9. En **Reservas**, buscá la de Lucía Fernández y tocá **Aceptar**. Queda **ACEPTADA**.
10. De vuelta en la ventana de la clienta, recargá **Mis reservas**: la reserva figura aceptada.

### Administrador: moderar

11. Cerrá la sesión del restaurante y entrá a http://dashboard.localhost:4200/admin/login con `admin@foodies.com`.
12. Mostrá el tablero con las métricas.
13. En **Moderación**, buscá la reseña de Hernán Vega sobre El Rincón de Mirta (la que insulta a los mozos) y tocá **Eliminar**.
14. Opcional: en **Gestión de entidades**, aplicale un strike a Hernán Vega o dalo de baja. Recordá que el seed reactiva la cuenta, pero no borra el strike.

Después del ensayo, corré el seed de nuevo para dejar todo como al principio.

## 8. Plan B

- **El mapa necesita internet** (los mosaicos se descargan en vivo). Si la red del aula falla, el resto de la app funciona en local, pero el mapa queda vacío.
- **Grabá un video de respaldo** del recorrido completo de la sección 7 la noche anterior, con el seed recién corrido, y tenelo abierto en otra pestaña o en un pendrive.
- Si el back no arranca, revisá primero `JWT_SECRET` (32 caracteres o más) y que MySQL responda en el puerto 13306.
- Si algo quedó en un estado raro durante la demo, corré el seed: tarda unos segundos y deja todo como al principio.

## 9. Problemas conocidos (no se arreglan antes de la demo)

- Dos reservas simultáneas para el mismo día pueden superar el cupo del restaurante (no hay control de concurrencia).
- La clave del administrador (`admin123`) es fija y la crea el back al arrancar.
- El login y el registro permiten averiguar si un email ya tiene cuenta.
