#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

IMAGE_NAME="${IMAGE_NAME:-wealthfolio-investor-portal:latest}"
OUTPUT_PATH="${OUTPUT_PATH:-${APP_DIR}/dist/wealthfolio-investor-portal-latest.tar}"
TARGET_PLATFORM="${TARGET_PLATFORM:-linux/amd64}"
NAS_COPY_DIR="${NAS_COPY_DIR:-/Volumes/docker/wealthfolio-investor-portal-1}"

mkdir -p "$(dirname "${OUTPUT_PATH}")"

echo "[export] building ${IMAGE_NAME} for ${TARGET_PLATFORM}"
docker build \
  --platform "${TARGET_PLATFORM}" \
  --tag "${IMAGE_NAME}" \
  "${APP_DIR}"

echo "[export] saving image tar to ${OUTPUT_PATH}"
docker save --output "${OUTPUT_PATH}" "${IMAGE_NAME}"

if [[ -d "${NAS_COPY_DIR}" ]]; then
  NAS_TAR_PATH="${NAS_COPY_DIR}/$(basename "${OUTPUT_PATH}")"
  NAS_COMPOSE_PATH="${NAS_COPY_DIR}/compose.nas.yml"
  NAS_DOCKER_COMPOSE_PATH="${NAS_COPY_DIR}/docker-compose.yaml"
  NAS_COMPOSE_FALLBACK_PATH="${NAS_COPY_DIR}/compose.yml"

  echo "[export] copying image tar to ${NAS_TAR_PATH}"
  cp "${OUTPUT_PATH}" "${NAS_TAR_PATH}"

  echo "[export] copying compose file to ${NAS_COMPOSE_PATH}"
  cp "${APP_DIR}/compose.nas.yml" "${NAS_COMPOSE_PATH}"

  echo "[export] copying compose file to ${NAS_DOCKER_COMPOSE_PATH}"
  cp "${APP_DIR}/compose.nas.yml" "${NAS_DOCKER_COMPOSE_PATH}"

  echo "[export] copying compose file to ${NAS_COMPOSE_FALLBACK_PATH}"
  cp "${APP_DIR}/compose.nas.yml" "${NAS_COMPOSE_FALLBACK_PATH}"
else
  echo "[export] NAS copy dir not found, skipped copy: ${NAS_COPY_DIR}"
fi

echo "[export] image tar created at ${OUTPUT_PATH}"
echo "[export] normal update flow keeps image tag at ${IMAGE_NAME}"
echo "[export] on NAS, import $(basename "${OUTPUT_PATH}") and redeploy the compose project"
