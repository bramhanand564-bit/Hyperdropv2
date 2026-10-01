#!/bin/sh
set -e
GRADLE_VERSION=8.9
DIST="/tmp/gradle-$GRADLE_VERSION"
if [ ! -x "$DIST/bin/gradle" ]; then
  curl -fsSL "https://services.gradle.org/distributions/gradle-$GRADLE_VERSION-bin.zip" -o /tmp/gradle.zip
  rm -rf "$DIST"
  unzip -q /tmp/gradle.zip -d /tmp
fi
exec "$DIST/bin/gradle" "$@"
