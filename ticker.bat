@echo off

REM Set the command you want to run
set command=node "C:\Users\nickh\Documents\Web developing\volleyball-socket-ticker\server.js"

REM Append all arguments to the command
:append_arguments
if "%1"=="" (
    goto :run_command
) else (
    set command=%command% %1
    shift
    goto :append_arguments
)

:run_command
REM echo Running command: %command%
%command%

REM End of batch file
