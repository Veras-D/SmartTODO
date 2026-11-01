#!/bin/bash
# Script to build Desktop Application binary using Docker (Zero Host Dependencies)
echo "=========================================="
echo " Building Tauri Desktop App inside Docker "
echo "=========================================="

DOCKER_CMD="docker compose"

# Check if current user can access docker socket without sudo
if ! docker info >/dev/null 2>&1; then
    echo "Notice: Docker requires elevated privileges on your system. Using sudo..."
    DOCKER_CMD="sudo docker compose"
fi

# The build container runs as root over a bind mount of this folder, so every file
# it writes (dist/, src-tauri/target/, the AppImage) would otherwise be left owned
# by root and break host-side commands like `npm run build` with "EACCES".
# These are the UID/GID those files are handed back to once the build is done.
HOST_UID="${SUDO_UID:-$(id -u)}"
HOST_GID="${SUDO_GID:-$(id -g)}"

# Clean old build artifacts using container privileges (root can delete the
# root-owned leftovers of a previous build)
$DOCKER_CMD run --rm desktop-builder sh -c "rm -rf /app/dist /app/src-tauri/target/release/bundle /app/SmartTODO_*_amd64.AppImage 2>/dev/null || true"

# Build standalone Desktop App image inside Docker
$DOCKER_CMD run --rm desktop-builder ./build_app.sh

# Hand ownership of everything generated during the build back to the host user
$DOCKER_CMD run --rm desktop-builder sh -c "chown -R ${HOST_UID}:${HOST_GID} /app/dist /app/src-tauri/target /app/package-lock.json /app/SmartTODO_*_amd64.AppImage 2>/dev/null; chmod -R u+rwX /app/dist /app/src-tauri/target 2>/dev/null; true"

APPIMAGE_FILE=$(ls ./SmartTODO_*_amd64.AppImage 2>/dev/null | head -n 1)

if [ -n "$APPIMAGE_FILE" ] && [ -f "$APPIMAGE_FILE" ]; then
    echo "=========================================="
    echo " SUCCESS! Desktop AppImage generated in root folder:"
    echo " $APPIMAGE_FILE"
    echo "=========================================="
else
    echo "Build complete. Check root directory for generated AppImage."
fi
