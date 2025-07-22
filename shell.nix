{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    openjdk17       # java 环境
    unzip           # 解压 APK
    android-tools   # adb
  ];

  shellHook = ''
    export JAVA_HOME=${pkgs.openjdk17}
    export PATH=$JAVA_HOME/bin:$PATH
  '';
}
