default:
    @just --list

build-ts:
    npm install --silent && npx tsc

interactive *ARGS: build-ts
    node dist/cli.js run --profile interactive {{ARGS}}

build WORKSPACE *ARGS: build-ts
    node dist/cli.js run --profile build --workspace {{WORKSPACE}} --unattended {{ARGS}}

inspect *ARGS: build-ts
    node dist/cli.js run --profile inspect {{ARGS}}

ios *ARGS: build-ts
    node dist/cli.js run --profile ios {{ARGS}}

bootstrap PROFILE *ARGS: build-ts
    node dist/cli.js bootstrap --profile {{PROFILE}} {{ARGS}}

render PROFILE: build-ts
    node dist/cli.js render --profile {{PROFILE}}

smoke: build-ts
    bash scripts/smoke-test.sh

test:
    npx vitest run
