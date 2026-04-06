# ─────────────────────────────────────────────────────────
#  Metal Trading API  —  Comandos de desarrollo
# ─────────────────────────────────────────────────────────

.PHONY: help install db migrate seed dev build

help:  ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN{FS=":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n",$$1,$$2}'

install:  ## Instala dependencias npm
	npm install

db:  ## Levanta PostgreSQL con Docker
	docker-compose up -d
	@echo "⏳ Esperando a que Postgres esté listo..."
	@sleep 3

migrate:  ## Genera cliente Prisma y corre migraciones
	npx prisma generate
	npx prisma migrate dev --name init

seed:  ## Siembra datos iniciales (metales, inventario, precios, usuario demo)
	npm run prisma:seed

setup: install db migrate seed  ## Setup completo (primera vez)
	@echo "✅ Setup completo. Corre 'make dev' para iniciar."

dev:  ## Inicia el servidor en modo desarrollo (watch)
	npm run start:dev

build:  ## Compila TypeScript
	npm run build

studio:  ## Abre Prisma Studio (GUI de base de datos)
	npx prisma studio

reset:  ## Resetea la base de datos y re-siembra
	npx prisma migrate reset --force
	npm run prisma:seed
