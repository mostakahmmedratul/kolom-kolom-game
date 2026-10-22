#!/usr/bin/env bash
# Native macOS Packaging Script using JDK 21 jpackage
# Compatible with Apple Silicon (M1/M2/M3/M4) and x86_64 macOS

set -e

echo "==> Building Fat JAR with Maven..."
mvn clean package -DskipTests

echo "==> Creating native macOS Application Bundle..."
rm -rf dist/
mkdir -p dist

jpackage \
  --input target/ \
  --name "KolomKolom" \
  --main-jar "kolom-kolom.jar" \
  --main-class "com.kolomkolom.Main" \
  --type dmg \
  --dest dist/ \
  --app-version "1.0.0" \
  --vendor "Kolom Kolom Game Studio" \
  --mac-package-name "KolomKolom"

echo "==> Native macOS DMG packaged successfully in dist/KolomKolom-1.0.0.dmg"
