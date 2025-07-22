#!/bin/bash
set -ex

export ANDROID_SDK_ROOT=$HOME/android-sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/latest/bin:$ANDROID_SDK_ROOT/platform-tools

# Install tools
mkdir -p $ANDROID_SDK_ROOT
cd $ANDROID_SDK_ROOT
if [ ! -d "latest" ]; then
  wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  unzip -o -q commandlinetools-linux-11076708_latest.zip
  rm commandlinetools-linux-11076708_latest.zip
  # The zip extracts to a 'cmdline-tools' directory. We rename it to 'latest'.
  mv cmdline-tools latest
fi
cd -

# Accept licenses & install packages
yes | $ANDROID_SDK_ROOT/latest/bin/sdkmanager --sdk_root=$ANDROID_SDK_ROOT --licenses
$ANDROID_SDK_ROOT/latest/bin/sdkmanager --sdk_root=$ANDROID_SDK_ROOT "platforms;android-34" "build-tools;34.0.0" "platform-tools"
yes | $ANDROID_SDK_ROOT/latest/bin/sdkmanager --sdk_root=$ANDROID_SDK_ROOT --licenses

# Configure project
echo "sdk.dir=$ANDROID_SDK_ROOT" > android/local.properties
echo "org.gradle.daemon=false" >> android/gradle.properties
echo "org.gradle.parallel=false" >> android/gradle.properties

# Add frontend build, validation and cleaning steps
cd frontend
npm install # Ensure dependencies are installed
npm run build # Build the frontend
cd -

# Validate frontend build output
cd frontend/build
if [ ! -f index.html ]; then echo "❌ index.html missing"; exit 1; fi
if [ ! -d static/js ] || [ -z "$(ls static/js)" ]; then echo "❌ static/js missing"; exit 1; fi
if [ ! -d static/css ] || [ -z "$(ls static/css)" ]; then echo "❌ static/css missing"; exit 1; fi
cd -

# Prepare assets/www
rm -rf android/app/src/main/assets/www && mkdir -p android/app/src/main/assets/www
cp -R frontend/build/* android/app/src/main/assets/www/


# Build
cd android
chmod +x gradlew
./gradlew clean assembleDebug --no-daemon --no-parallel --info --stacktrace