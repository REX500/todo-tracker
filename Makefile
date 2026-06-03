.PHONY: install dev build start lint typecheck test test-unit test-int db-init clean

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm test

test-unit:
	npm run test:unit

test-int:
	npm run test:int

db-init:
	npm run db:init

clean:
	rm -rf .next node_modules
