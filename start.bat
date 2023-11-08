@echo off

set /p gameuuid=Enter Game UUID: 
set /p displayname=Enter guest team display name: 

node server.js "%gameuuid%" "%displayname%"
pause