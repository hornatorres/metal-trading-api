# 🏭 Metal Trading API

Backend NestJS + PostgreSQL + Prisma para plataforma de compra/venta de metales físicos con custodia.

---

## 🏗️ Arquitectura

```
metal-trading-api/
├── prisma/
│   ├── schema.prisma          # Modelo de datos completo
│   └── seed.ts                # Datos iniciales (metales, inventario, precios)
└── src/
    ├── main.ts                # Bootstrap + pipes globales
    ├── app.module.ts          # Root module
    ├── prisma/                # Prisma client (global)
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    ├── users/                 # Módulo usuarios
    │   ├── dto/create-user.dto.ts
    │   ├── users.controller.ts
    │   └── users.service.ts
    ├── wallets/               # Módulo wallets (USD + metal)
    │   ├── wallets.controller.ts
    │   └── wallets.service.ts
    ├── trading/               # Módulo trading (buy / sell)
    │   ├── dto/buy.dto.ts
    │   ├── dto/sell.dto.ts
    │   ├── trading.controller.ts
    │   └── trading.service.ts
    ├── inventory/             # Módulo inventario físico
    │   ├── inventory.controller.ts
    │   └── inventory.service.ts
    ├── pricing/               # Módulo precios (market maker)
    │   └── pricing.service.ts
    └── common/
        ├── exceptions/        # Excepciones de negocio tipadas
        └── filters/           # HTTP exception filter global
```

---

## 🚀 Cómo correr en local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Levantar PostgreSQL
```bash
docker-compose up -d
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar DATABASE_URL si es necesario
```

### 4. Generar cliente Prisma y migrar
```bash
npm run prisma:generate
npm run prisma:migrate
# Nombre de migración sugerido: "init"
```

### 5. Sembrar datos iniciales
```bash
npm run prisma:seed
```

### 6. Iniciar el servidor
```bash
npm run start:dev
```

El servidor levanta en: `http://localhost:3000/api/v1`

---

## 📡 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/users` | Crear usuario |
| `GET` | `/api/v1/users/:id` | Obtener usuario |
| `GET` | `/api/v1/wallets/:userId` | Consultar wallets (USD + metales) |
| `POST` | `/api/v1/buy` | Comprar metal |
| `POST` | `/api/v1/sell` | Vender metal |
| `GET` | `/api/v1/inventory` | Ver inventario físico |
| `GET` | `/api/v1/inventory/:metalId` | Ver inventario por metal |
| `GET` | `/api/v1/ledger/:userId` | Ver ledger de transacciones |

---

## 🔄 Flujo de Compra (BUY)

```
Usuario                   API                     DB
  │                        │                       │
  ├─POST /buy──────────────▶│                       │
  │  { userId, metalId,    │                       │
  │    amountKg }          │                       │
  │                        ├─Validate user─────────▶│
  │                        ├─Get current price─────▶│
  │                        ├─Check USD balance──────▶│
  │                        ├─Check inventory────────▶│
  │                        │                       │
  │                        │ ┌─ DB TRANSACTION ─────┤
  │                        │ │ Create Order PENDING  │
  │                        │ │ Reserve inventory     │
  │                        │ │ Debit USD wallet      │
  │                        │ │ Credit metal wallet   │
  │                        │ │ Confirm stock         │
  │                        │ │ Order → EXECUTED      │
  │                        │ │ Write ledger entry    │
  │                        │ └───────────────────────┤
  │                        │                       │
  ◀────────────────────────┤ { order, ledger }     │
  │  201 Created           │                       │
```

## 🔄 Flujo de Venta (SELL)

```
Usuario                   API                     DB
  │                        │                       │
  ├─POST /sell─────────────▶│                       │
  │  { userId, metalId,    │                       │
  │    amountKg }          │                       │
  │                        ├─Validate user─────────▶│
  │                        ├─Get current price─────▶│
  │                        ├─Check metal balance────▶│
  │                        │                       │
  │                        │ ┌─ DB TRANSACTION ─────┤
  │                        │ │ Create Order PENDING  │
  │                        │ │ Debit metal wallet    │
  │                        │ │ Credit USD wallet     │
  │                        │ │ Restock inventory     │
  │                        │ │ Order → EXECUTED      │
  │                        │ │ Write ledger entry    │
  │                        │ └───────────────────────┤
  │                        │                       │
  ◀────────────────────────┤ { order, ledger }     │
  │  201 Created           │                       │
```

---

## 📋 Ejemplos de Requests

### Crear usuario
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{ "email": "trader@example.com", "password": "Secret1234!" }'
```

### Consultar wallets
```bash
curl http://localhost:3000/api/v1/wallets/{userId}
```

### Comprar cobre
```bash
curl -X POST http://localhost:3000/api/v1/buy \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid-del-usuario",
    "metalId": "uuid-del-cobre",
    "amountKg": 100
  }'
```

### Vender aluminio
```bash
curl -X POST http://localhost:3000/api/v1/sell \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid-del-usuario",
    "metalId": "uuid-del-aluminio",
    "amountKg": 50
  }'
```

### Ver inventario
```bash
curl http://localhost:3000/api/v1/inventory
```

### Ver ledger
```bash
curl http://localhost:3000/api/v1/ledger/{userId}
```

---

## 🔐 Reglas de Negocio

| Regla | Implementación |
|-------|---------------|
| No comprar sin inventario | `InventoryService.reserveStock()` lanza excepción |
| No vender sin balance | `WalletsService.getMetalBalance()` + excepción |
| Ledger inmutable | Solo INSERT, nunca UPDATE/DELETE en `transactions` |
| Atomicidad | Toda operación usa `prisma.$transaction()` |
| Spread market maker | `buyPrice > sellPrice`, definido en tabla `prices` |

---

## 📈 Próximos pasos para escalar

- [ ] JWT Auth Guard
- [ ] Rate limiting (ThrottlerModule)
- [ ] Redis para cacheo de precios
- [ ] Queue (BullMQ) para órdenes asíncronas
- [ ] WebSockets para precios en tiempo real
- [ ] Conectar feed de precios LME/Reuters
- [ ] Auditoría de wallet con event sourcing
