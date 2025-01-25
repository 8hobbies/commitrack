# Commit Track

## Container Build

We only support building on a POSIX-compliant system with [Node.js][] 22.

By default, we use [podman][]. But if you prefer a different command such as
`docker`, you can add an environment variable before running any commands:

    export DOCKER_CMD=docker

You also need a [podman-compose][] provider.

To build the container image, run:

    npm run build_container_img

To run it, run:

    npm run start_container

The service is now available at http://localhost:3000.

To stop, run:

    npm run stop_container

## Development

The environment requirement is same as the build environment above.

To run locally, run:

    npm run dev

The API server will listen at http://localhost:3000.

To run tests, run:

    npm run test

To run live tests, run:

    npm run start_container
    npm run test_live

[Node.js]: https://nodejs.org/
[podman]: https://podman.io/
[podman-compose]: https://docs.podman.io/en/latest/markdown/podman-compose.1.html
