@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem

@if "%DEBUG%" == "" @echo off
@rem ##########################################################################
@rem
@rem  Gradle startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass any JVM options to this script.

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto init

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
echo.
goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto init

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
echo.
goto fail

:init
@rem Get command-line arguments, handling Windowz variants

if not "%OS%" == "Windows_NT" goto oldWindows
:newWindows
set CMD_LINE_ARGS=
:winnt_loop
if "%~1"=="" goto winnt_done
set CMD_LINE_ARGS=%CMD_LINE_ARGS% %1
shift
goto winnt_loop
:winnt_done
set CMD_LINE_ARGS=%CMD_LINE_ARGS%
goto post_args

:oldWindows
set CMD_LINE_ARGS=
:dos_loop
if "%1"=="" goto dos_done
set CMD_LINE_ARGS=%CMD_LINE_ARGS% %1
shift
goto dos_loop
:dos_done
set CMD_LINE_ARGS=%CMD_LINE_ARGS%
goto post_args

:post_args
@rem Set large command line handling for all NT versions
if not "%OS%"=="Windows_NT" goto no_large_args
set "CLASSPATH="
if not ""%1""=="""" set "CLASSPATH=%1"
shift
:large_args_loop
if not ""%1""=="""" (
    set "CLASSPATH=%CLASSPATH%;%1"
    shift
    goto large_args_loop
)

:no_large_args
if not "%CLASSPATH%"=="" goto classpath_done
set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar
:classpath_done

set "GRADLE_OPTS="
if defined GRADLE_OPTS (
  set "GRADLE_OPTS=%GRADLE_OPTS%"
)

set "JAVA_OPTS="
if defined JAVA_OPTS (
  set "JAVA_OPTS=%JAVA_OPTS%"
)

@rem Collect all arguments for the java command, taking the shortest path to the correct quoting
@rem
@rem This will never be perfect, but it will be good enough for most cases.
@rem
@rem The problem is that the command line is parsed into a single string, which is then parsed by the JVM.
@rem This means that the quoting of the arguments needs to be correct for both the shell and the JVM.
@rem
@rem In general, the rule is that if an argument contains a space, it must be quoted.
@rem
@rem However, if an argument contains a quote, then the rules get more complex.
@rem
@rem If an argument contains a quote and a space, then the argument must be quoted and the quote must be escaped.
@rem
@rem If an argument contains a quote but no space, then the argument does not need to be quoted, but the quote must be escaped.
@rem
@rem The following logic attempts to handle these cases.
@rem
set "FINAL_CMD_LINE_ARGS="
:setup_args_loop
if not ""%1""=="""" (
    set "ARG=%1"
    shift
    set "ARG=%ARG:"="%"
    if not "%ARG%" == "%ARG: =%" (
        set "ARG="%ARG%""
    )
    set "FINAL_CMD_LINE_ARGS=%FINAL_CMD_LINE_ARGS% %ARG%"
    goto setup_args_loop
)

@rem Escape the command line arguments
@rem
set "ESCAPED_CMD_LINE_ARGS="
:escape_args_loop
if not ""%1""=="""" (
    set "ARG=%1"
    shift
    set "ARG=%ARG:"="%"
    set "ESCAPED_CMD_LINE_ARGS=%ESCAPED_CMD_LINE_ARGS% %ARG%"
    goto escape_args_loop
)

@rem Execute Gradle
@rem
set "GRADLE_MAIN_CLASS=org.gradle.wrapper.GradleWrapperMain"

@rem For Cygwin, switch paths to Windows format before running java
if "%OS%"=="Windows_NT" (
    if exist "%HOME%\.gradle" (
        set "GRADLE_USER_HOME=%HOME%\.gradle"
    )
) else (
    if exist "%USERPROFILE%\.gradle" (
        set "GRADLE_USER_HOME=%USERPROFILE%\.gradle"
    )
)

if defined GRADLE_USER_HOME (
    set "GRADLE_USER_HOME=%GRADLE_USER_HOME:"=%"
    if exist "%GRADLE_USER_HOME%" (
        set "GRADLE_OPTS=%GRADLE_OPTS% "-Dgradle.user.home=%GRADLE_USER_HOME%""
    )
)

set "JAVA_OPTS=%DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS%"
set "FINAL_CMD_LINE_ARGS=%CMD_LINE_ARGS%"

@rem Execute the application
@rem
"%JAVA_EXE%" %JAVA_OPTS% -classpath "%CLASSPATH%" "%GRADLE_MAIN_CLASS%" %FINAL_CMD_LINE_ARGS%

:end
@rem End local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" endlocal

:fail
exit /b 1
