@echo off
REM Native Windows Packaging Script using JDK 21 jpackage
REM Produces standalone MSI installer or EXE application

echo ==> Building Fat JAR with Maven...
call mvn clean package -DskipTests

if not exist dist mkdir dist

echo ==> Packaging Windows Application with jpackage...
jpackage ^
  --input target\ ^
  --name "KolomKolom" ^
  --main-jar "kolom-kolom.jar" ^
  --main-class "com.kolomkolom.Main" ^
  --type msi ^
  --dest dist\ ^
  --app-version "1.0.0" ^
  --vendor "Kolom Kolom Game Studio" ^
  --win-menu ^
  --win-shortcut

echo ==> Native Windows MSI installer built in dist\KolomKolom-1.0.0.msi
