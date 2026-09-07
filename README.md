# 💼 CRM Multi-Suscripciones (Bodegas, Gyms, etc.)

> **Panel Administrativo Interno (PWA)** para control y gestión de cobranza recurrente a comercios locales en Venezuela.

Desarrollado con dedicación por [**Oman Vásquez**](https://oman-vasquez.web.app).

---

## 🚀 Características Principales

* 📊 **Dashboard Financiero en Tiempo Real:** 
  * Total de comercios activos en cartera.
  * Semáforo de morosidad (Solventes vs. Morosos).
  * Proyección estimada del mes en **USD** y **Bolívares (VES)** calculados a tasa oficial BCV.
  * Monto efectivamente recaudado en el mes corriente.
* 📈 **Integración Oficial con Tasa BCV:**
  * Consulta en tiempo real a `https://ve.dolarapi.com/v1/dolares/oficial`.
  * Persistencia en caché local (`localStorage`) y en Firestore (`parametros_globales/tdc`).
  * **Fallback Manual:** Modal para ajuste rápido de tasa en caso de intermitencia de red.
* 📱 **Recordatorio Instantáneo por WhatsApp:**
  * Normalización inteligente de números telefónicos a formato internacional venezolano (`58...`).
  * Mensaje preconfigurado con plantilla oficial, cálculo del monto en Bs a la tasa del día y datos precargados de Pago Móvil:
    * **Banco:** Banco de Venezuela (`0102`)
    * **C.I.:** `19.888.063`
    * **Teléfono:** `0412-4169949`
* 💳 **Flujo Rápido de Cobro ("Registrar Pago"):**
  * Modal interactivo que congela la tasa aplicada, guarda el registro en la colección inmutable `transacciones` y avanza el ciclo de corte exactamente 1 mes.
* 🏷️ **Filtros Dinámicos e Inteligentes:**
  * Selector de apps que se llena dinámicamente con las categorías reales de la base de datos (sin valores quemados en código).
  * Filtro rápido por morosidad (Todos / Solventes / Morosos).
  * Búsqueda reactiva por nombre comercial, encargado, cédula o teléfono.
* 🛡️ **Seguridad Crítica:**
  * Autenticación exclusiva con Google Provider restringida al correo del administrador: `omanjrvasquez@gmail.com`.
  * **Soft Delete:** Los clientes nunca se eliminan físicamente de Firestore (`activo: false`).
* 📥 **Exportación a CSV / Excel:**
  * Descarga con un clic de la lista de comercios y del historial de transacciones.
* 📲 **PWA Instalable:**
  * Diseño **Mobile-First** optimizado para su uso en laptop con **ChromeOS Flex** y smartphones táctiles.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React 18 + Vite
* **Estilos:** Tailwind CSS + Lucide Icons
* **Base de Datos & Auth:** Firebase Firestore NoSQL & Firebase Authentication
* **Hosting:** Firebase Hosting
* **Plataforma:** PWA con soporte Offline / Service Worker

---

## 💻 Instalación y Desarrollo Local

1. Clonar el repositorio e ingresar a la carpeta:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd crm-multisuscriptores
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   Copiar `.env.example` a `.env` y colocar las credenciales de Firebase.

4. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Compilar para producción:
   ```bash
   npm run build
   ```

6. Desplegar a Firebase Hosting y Firestore Rules:
   ```bash
   firebase deploy
   ```

---

## 👤 Autor y Créditos

* **Desarrollador:** Oman Vásquez
* **Portafolio:** [https://oman-vasquez.web.app](https://oman-vasquez.web.app)
