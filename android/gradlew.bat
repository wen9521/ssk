batch
@REM
@REM Copyright 2015 the original author or authors.
@REM
@REM Licensed under the Apache License, Version 2.0 (the "License");
@REM you may not use this file except in compliance with the License.
@REM You may obtain a copy of the License at
@REM
@REM      http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing, software
@REM distributed under the License is distributed on an "AS IS" BASIS,
@REM WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@REM See the License for the specific language governing permissions and
@REM limitations under the License.
@REM

@echo off

REM Determine if the current shell is part of a cygwin or msys environment
set CYGWIN=false
if "%OSTYPE%" == "cygwin" set CYGWIN=true
set MSYS=false
if "%OSTYPE%" == "msys" set MSYS=true

if %CYGWIN% == false if %MSYS% == false goto standard

REM Process POSIX-style paths
set "ARGS=%*"
if "%OSTYPE%" == "cygwin" goto cygwin
if "%OSTYPE%" == "msys" goto msys

:cygwin
  rem Cygwin paths have to be converted to Windows paths for native Windows applications.
  rem On the other hand, the .bat file needs to be in the Windows path format to be executable.
  rem The first argument is the path to the script itself, which is in Windows format.
  rem Let's check if the remaining arguments contain '/' which indicates POSIX style.
  rem If yes, we convert the arguments to Windows format.
  rem If no, we assume they are already in Windows format and pass them as-is.
  rem We use perl to convert the paths as it is available in cygwin and msys.
  rem See http://www.cygwin.com/cygwin-ug-net/using-utils.html#pathnames-dos-vs-posix
  set POSIX_PATHS=false
  for /F "usebackq tokens=*" %%i in (`perl -e 'print join(" ", map { index($_, "/") != -1 ? "true" : "false" } @ARGV)' %ARGS%`) do set POSIX_PATHS=%%i
  if "%POSIX_PATHS%" == "true" (
    rem Convert POSIX paths to Windows paths
    for /F "usebackq tokens=*" %%i in (`perl -e 'print join(" ", map { $_ =~ /^\// ? `cygpath -w "$_"` : $_ } @ARGV)' %ARGS%`) do set WINDOWS_ARGS=%%i
    set "ARGS=%WINDOWS_ARGS%"
  )
  goto execute

:msys
  rem MSYS paths have to be converted to Windows paths for native Windows applications.
  rem On the other hand, the .bat file needs to be in the Windows path format to be executable.
  rem The first argument is the path to the script itself, which is in Windows format.
  rem Let's check if the remaining arguments contain '/' which indicates POSIX style.
  rem If yes, we convert the arguments to Windows format.
  rem If no, we assume they are already in Windows format and pass them as-is.
  rem We use perl to convert the paths as it is available in cygwin and msys.
  rem See http://www.cygwin.com/cygwin-ug-net/using-utils.html#pathnames-dos-vs-posix
  set POSIX_PATHS=false
  for /F "usebackq tokens=*" %%i in (`perl -e 'print join(" ", map { index($_, "/") != -1 ? "true" : "false" } @ARGV)' %ARGS%`) do set POSIX_PATHS=%%i
  if "%POSIX_PATHS%" == "true" (
    rem Convert POSIX paths to Windows paths
    for /F "usebackq tokens=*" %%i in (`perl -e 'print join(" ", map { $_ =~ /^\// ? `msyspath -w "$_"` : $_ } @ARGV)' %ARGS%`) do set WINDOWS_ARGS=%%i
    set "ARGS=%WINDOWS_ARGS%"
  )
  goto execute

:standard
  set "ARGS=%*"

:execute
REM Find the location of the Java installation
if defined JAVA_HOME goto findJava
for %%i in (java.exe) do set JAVA_HOME=%%~dpi
if defined JAVA_HOME goto findJava
echo Error: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
goto end

:findJava
set JAVA_EXE="%JAVA_HOME%\bin\java.exe"
if exist %JAVA_EXE% goto checkJvmopts
echo Error: JAVA_HOME is set to an invalid directory.
echo JAVA_HOME = "%JAVA_HOME%"
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
goto end

:checkJvmopts
set DEFAULT_JVM_OPTS=
if exist "%APPDATA%\gradle\gradle.properties" for /f "usebackq tokens=1,2* delims==" %%a in (`type "%APPDATA%\gradle\gradle.properties"`) do if "%%a" == "org.gradle.jvmargs" set "DEFAULT_JVM_OPTS=%%b"
if not defined DEFAULT_JVM_OPTS if exist "%USERPROFILE%\.gradle\gradle.properties" for /f "usebackq tokens=1,2* delims==" %%a in (`type "%USERPROFILE%\.gradle\gradle.properties"`) do if "%%a" == "org.gradle.jvmargs" set "DEFAULT_JVM_OPTS=%%b"

REM Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% -Dorg.gradle.appname="Gradle Wrapper" -classpath "%~dp0gradle\wrapper\gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain %ARGS%
if errorlevel 1 goto end

:end