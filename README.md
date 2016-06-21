# Chrome Demos

This repository serves as a placeholder of chrome demos for Chrome rebase testing.

## Demos on Browsers

The simple way to use the demos is to access to the GitHub pages at
http://honry.github.io/demo/

## Demos on Android

Based on the [Crosswalk Project](https://crosswalk-project.org/), one can build
an installable web application for Android platforms following these steps:

1. Download Crosswalk Project for Android package (`.zip`) from
   https://download.01.org/crosswalk/releases/crosswalk/android/:

   ```sh
   wget url/to/android/canary/18.46.471.0/crosswalk-18.46.471.0.zip
   ```

2. Clone Crosswalk-app-tools:

   ```sh
   git clone https://github.com/crosswalk-project/crosswalk-app-tools.git
   ```

3. Set Environment variables:

   ```sh
   vim .bashrc
   export CROSSWALK_APP_TOOLS_CACHE_DIR=path/to/crosswalk/directory
   export PATH=path/to/crosswalk-app-tool/src:$PATH
   ```

4. Go to crosswalk-app-tools directory:

   ```sh
   cd path/to/crosswalk-app-tools
   ```

5. Install crosswalk-app-tools:

   ```sh
   sudo npm install
   ```

6. Clone demo:

   ```sh
   git clone https://github.com/honry/demo.git
   ```

7. Go to the parent directory of demo

   ```sh
   cd path/to/parent/directory/of/demo
   ```

8. Create APK package as follows:

   ```sh
   crosswalk-pkg --crosswalk=path/to/crosswalk/android/crosswalk-18.46.471.0.zip demo/
   ```

   This will produce two apk files, one for x86 architecture and one for ARM.
   The apk files will end up in the parent directory of the application.
   Each file is given the name by append "xwalk_package_id", "xwalk_app_version" in the
   manifest, and an architecture identifier ("x86" or "arm"). For this demo, the output
   files are `org.chrome.demo-0.1-debug.armabi-v7a.apk` and
   `org.chrome.demo-0.1-debug.x86.apk`.

## Demos on Windows

Build an installable web application for Windows platforms following these steps:

1. Download Crosswalk Project for Windows package (`.zip`) from
   https://download.01.org/crosswalk/releases/crosswalk/windows/

2. Install crosswalk-app-tools:

   ```cmd
   npm install -g crosswalk-app-tools
   ```

3. Clone demo:

   ```sh
   git clone https://github.com/honry/demo.git
   ```

4. Go to the parent directory of demo

5. Create MSI file as follows:

   ```cmd
   crosswalk-pkg --crosswalk=path\to\crosswalk\windows\crosswalk-18.46.468.0.zip --platforms=windows demo\
   ```

   This will produce a msi file, it will end up in the parent directory of the application.

6. Install the application on windows:

   Double click the msi file to install.
