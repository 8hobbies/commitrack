# Commit Track

By default, we use [podman][]. But if you prefer a different command such as
`docker`, you can add an environment variable before running any commands:

    export DOCKER_CMD=docker

You also need a [podman-compose][] provider.

## Development

To run locally, run:

    npm run dev

The server will listen at http://localhost:3000.

## Container

To build the container image, run:

    npm run build_container_img

To run it, run:

    npm run start_container

The service is now available at http://localhost:3000.

To stop, run:

    npm run stop_container

[podman]: https://podman.io/
[podman-compose]: https://docs.podman.io/en/latest/markdown/podman-compose.1.html
