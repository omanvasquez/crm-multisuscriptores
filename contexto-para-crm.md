# 📌 Documento Maestro de Contexto y Arquitectura: CRM Multi-Suscripciones (Bodegas, Gyms, etc.)

## 1. Visión General y Objetivo
* **Proyecto:** CRM interno (PWA) para gestión y control de cobranza recurrente a negocios y comercios locales (bodegas, gimnasios, tiendas, etc.).
* **Objetivo:** Controlar métricas financieras en tiempo real, morosidad y proyecciones de cobro para una expansión progresiva por múltiples estados y regiones de Venezuela (Cojedes, Carabobo, etc.), abarcando diferentes nichos y aplicaciones suscritas.
* **Naturaleza del Software:** Panel administrativo estrictamente interno (**Admin-only**). Los clientes finales NO interactúan con la app. No existen pasarelas de pago externas ni registro público. Los pagos se gestionan manualmente por el administrador (por Pago Móvil, transferencia o efectivo) y se registran en el sistema.
* **Créditos y Branding:** En el pie de página y/o barra lateral de la aplicación debe incluirse de forma visible y elegante:
  * `Desarrollado por Oman Vasquez` con enlace a [https://oman-vasquez.web.app](https://oman-vasquez.web.app)

---

## 2. Entorno de Desarrollo y Stack Tecnológico
* **Sistema Operativo:** Entorno Linux en ChromeOS Flex.
* **Asistente de Desarrollo:** Antigravity (asistido por IA).
* **Control de Versiones:** Git / GitHub.
* **Frontend:** PWA (Progressive Web App) construida con **Vite + React + Tailwind CSS + Lucide Icons**.
* **Backend y Base de Datos:** Firebase (Firestore NoSQL) y Firebase Authentication (Google Auth).
* **Hosting:** Firebase Hosting.
* **PWA:** Instalable en ChromeOS y dispositivos móviles (soporte para manifest, service worker y uso offline de interfaz).

---

## 3. Lógica de Negocio y Reglas Financieras
* **Moneda Base:** Las tarifas de suscripción se fijan en **USD** a nivel de cada cliente (ej. $4, $5, $15 mensuales).
* **Moneda de Proyección y Cobro:** Todo se calcula y proyecta en **Bolívares (VES)** utilizando la tasa oficial del Banco Central de Venezuela (BCV) del día.
* **Cálculos en Frontend:** Estrictamente realizados del lado del cliente. Firestore no almacena cálculos dinámicos de tasa; solo almacena la tasa histórica aplicada en cada transacción cerrada.
* **Estrategia de Tasa BCV:**
  * **API Oficial:** `GET https://ve.dolarapi.com/v1/dolares/oficial` (prohibido scraping web directo). Se extrae el valor de la clave `promedio` y se asigna a `valor_bcv`.
  * **Caché y Persistencia:** La tasa se almacena en `localStorage` y en la colección `parametros_globales/tdc`.
  * **Fallback Manual:** Si la API falla por timeout o restricciones de red, el sistema no se bloquea: muestra la última tasa conocida y permite al administrador editar la tasa manualmente mediante un modal o campo accesible en la cabecera.

---

## 4. Modelo de Datos (Firestore NoSQL)

### Colección: `parametros_globales`
* Documento: `tdc`
  * `valor_bcv`: Number (ej. 42.50)
  * `fecha_actualizacion`: Timestamp
  * `fuente`: String (ej. "dolarapi" o "manual")

### Colección: `clientes`
*Cada documento representa un negocio suscrito.*
* `nombre_negocio`: String (Nombre comercial o del local)
* `app_suscrita`: String (Categoría o software que utiliza, ej. "BodegasPro", "GymControl")
* `encargado`: String (Nombre y apellido de la persona de contacto)
* `cedula`: String (C.I. o RIF del encargado/negocio)
* `telefono`: String (Teléfono de contacto, almacenado en formato limpio internacional ej. `584124169949`)
* `direccion`: String (Dirección física, local o punto de referencia)
* `estado_region`: String (Estado y región/municipio, ej. "Cojedes - Tinaquillo", "Carabobo - Valencia")
* `tarifa_base_usd`: Number (Tarifa mensual en dólares, ej. 5.00)
* `fecha_inicio_contrato`: Timestamp
* `fecha_proximo_pago`: Timestamp (Fecha límite de corte)
* `fecha_ultimo_pago`: Timestamp (Fecha en la que realizó su último pago)
* `estado_pago`: Boolean (`true` = Solvente, `false` = Moroso)
* `activo`: Boolean (`default: true`) -> **Soporte estricto para Soft Delete**.

### Colección: `transacciones`
*Historial inmutable de pagos para auditoría y reportes financieros.*
* `id_cliente`: String (ID del documento del cliente)
* `nombre_negocio`: String (Para auditoría y visualización histórica directa)
* `fecha_pago`: Timestamp (Momento exacto del registro)
* `monto_usd_base`: Number (Monto cobrado en USD)
* `tasa_bcv_aplicada`: Number (Tasa BCV congelada al momento del pago)
* `monto_ves_cobrado`: Number (`monto_usd_base * tasa_bcv_aplicada`)
* `metodo_pago`: String (ej. "Pago Móvil", "Transferencia", "Efectivo USD", "Efectivo VES")

---

## 5. Directrices de UI, Dashboard y Flujos CRUD

### A. Dashboard y Métricas Financieras (Header KPI Cards)
El panel superior debe presentar 4 tarjetas de resumen financiero en tiempo real:
1. **Total Clientes Activos:** Número de comercios suscritos activos.
2. **Semáforo de Morosidad:** Clientes solventes (verde) vs. Morosos / Vencidos (rojo).
3. **Proyección del Mes:** Monto total proyectado a cobrar en el ciclo tanto en **USD** como en **VES** (a la tasa BCV del día).
4. **Recaudado en el Mes:** Total efectivamente cobrado en el ciclo actual en **USD** y **VES**.

### B. Filtros Dinámicos
* El selector/dropdown de filtro por `app_suscrita` **NO debe tener valores fijos quemados en código**. Debe extraer dinámicamente los valores únicos presentes en la base de clientes.
* Filtros adicionales rápidos: Por estado de pago (Todos / Solventes / Morosos) y por Estado/Región.
* Barra de búsqueda reactiva por nombre del negocio, encargado o cédula.

### C. Lógica de Morosidad y Alertas
* Un cliente se considera moroso si la fecha actual es mayor a su `fecha_proximo_pago`.
* La fila o tarjeta del cliente moroso debe resaltarse visualmente (alerta con acentos rojos/coral).

### D. Flujo "Registrar Pago"
1. Al hacer clic en "Registrar Pago", se abre un modal de confirmación que muestra el monto en USD, la tasa BCV actual, el equivalente en Bs. y la nueva fecha de corte calculada.
2. Al confirmar:
   * Se crea un nuevo documento en `transacciones`.
   * Se actualiza en `clientes`:
     * `fecha_ultimo_pago` = Timestamp actual.
     * `fecha_proximo_pago` = Fecha actual + 1 mes (o 30 días respecto al corte previo).
     * `estado_pago` = `true`.

### E. Normalización de Teléfonos y Botón de WhatsApp
* **Normalización automática:** Al registrar o editar el teléfono, el sistema debe limpiar caracteres especiales, espacios y el `0` inicial para asegurar el formato internacional venezolano (`58XXXXXXXXXX`), garantizando que la URL nunca falle.
* **Botón de acción rápida en morosos:** Abre directamente `https://wa.me/[telefono]?text=[mensaje_codificado]`.
* **Datos bancarios oficiales para el mensaje:**
  * **Banco:** Banco de Venezuela (0102)
  * **C.I.:** 19.888.063
  * **Teléfono Pago Móvil:** 0412-4169949
* **Plantilla oficial del mensaje:**
  ```text
  Hola [encargado], espero estés bien. Paso por aquí para recordarte la mensualidad de [app_suscrita] para [nombre_negocio]. El monto de este ciclo es de [monto_ves] Bs (calculado a la tasa oficial BCV de hoy [valor_bcv] Bs/$).

  Mis datos de Pago Móvil:
  Banco de Venezuela (0102)
  C.I.: 19.888.063
  Tel: 04124169949

  ¡Me avisas cuando realices la transferencia para actualizar tu sistema! 👍🏻
  ```

### F. Formulario de Clientes
* Modal intuitivo con validaciones para: Nombre del negocio, Cédula/RIF, Encargado, Teléfono, Dirección, Estado/Región, Tarifa base USD, Fecha de inicio y Fecha de primer pago.
* Campo de `app_suscrita` con soporte para autocompletado de aplicaciones ya registradas o ingreso de una nueva categoría.

### G. Respaldo y Exportación
* Botón en la cabecera para **Exportar a CSV/Excel** la lista completa de clientes activos y el historial de transacciones para auditoría y respaldo local.

---

## 6. Integridad de Datos y Seguridad Crítica
* **Soft Delete Obligatorio:** Queda estrictamente prohibido ejecutar `deleteDoc()` sobre la colección `clientes`. La eliminación se realiza cambiando `activo: false`. Todas las consultas y vistas de clientes deben filtrar por `activo == true`.
* **Autenticación Exclusiva:** Firebase Auth vía Google Provider restringido al correo del administrador: `omanjrvasquez@gmail.com`.
* **Reglas de Firestore (firestore.rules):**
  ```text
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.token.email == "omanjrvasquez@gmail.com";
      }
    }
  }
  ```
  *(Prohibido dejar la base de datos abierta al público).*

---

## 7. Estética y Diseño de la Interfaz
* **Estilo Visual:** Moderno, minimalista, limpio y profesional.
* **Paleta de Colores:** Fondo Slate / Neutral con contrastes claros, tonos **Esmeralda** para ingresos, métricas positivas y solventes; tonos **Coral/Rojo suave** para morosidad y alertas.
* **Componentes:**
  * Mobile-First y Responsive total (óptimo en laptop con ChromeOS Flex y en teléfonos táctiles).
  * Badges dinámicos con colores sutiles para identificar las diferentes apps suscritas.
  * Iconografía limpia y consistente provista por `lucide-react`.
