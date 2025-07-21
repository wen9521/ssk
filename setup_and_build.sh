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

# Build
cd android
chmod +x gradlew
./gradlew clean assembleDebug --no-daemon --no-parallel --info --stacktrace
