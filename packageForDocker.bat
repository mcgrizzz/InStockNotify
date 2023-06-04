@echo off
:: variables
set baseDir=H:\Documents\Dev\HTML and Web\InStockNotify
set distDir=%baseDir%\docker-ready

set baseSrc=%baseDir%\src
set frontendSrc=%baseSrc%\frontend
set backendSrc=%baseSrc%\backend
set dockerSrc=%baseSrc%\docker

set roboArgs=/ns /nc /njh /njs

echo Clearing old packaged contents...

@RD /S /Q "%distDir%"

cd "%frontendSrc%"

echo Generating Frontend Files...
start /B /WAIT cmd /c "ng build --configuration production"

echo Copying Frontend Files...
ROBOCOPY %roboArgs% "%frontendSrc%\dist" "%distDir%\code\public"

echo Copying Backend Files...

ROBOCOPY %roboArgs% "%backendSrc%\models"   "%distDir%\code\models"
ROBOCOPY %roboArgs% "%backendSrc%\routes"   "%distDir%\code\routes"
ROBOCOPY %roboArgs% "%backendSrc%\scraper"  "%distDir%\code\scraper"

COPY "%backendSrc%\index.js"            "%distDir%\code\index.js"
COPY "%backendSrc%\package.json"        "%distDir%\code\package.json"
COPY "%backendSrc%\package-lock.json"   "%distDir%\code\package-lock.json"

echo Copying Docker Files...

ROBOCOPY %roboArgs% /s  "%dockerSrc%\docker"   "%distDir%\docker\docker"
ROBOCOPY %roboArgs%     "%dockerSrc%\config"   "%distDir%\docker\config"

COPY "%dockerSrc%\compose.yaml"   "%distDir%\docker\compose.yaml"