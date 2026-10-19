#!/usr/bin/env bash
set -euo pipefail
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'An iPhone binary requires macOS and Xcode. Run the GitHub macOS workflow or this script on a Mac.' >&2
  exit 2
fi
zolnu_output="${1:-output}"
mkdir -p "$zolnu_output"
zolnu_output="$(cd "$zolnu_output" && pwd)"
zolnu_temp="$(mktemp -d "${TMPDIR:-/tmp}/zolnu-ios.XXXXXX")"
trap 'rm -rf "$zolnu_temp"' EXIT
xcodebuild -version
npx expo prebuild --platform ios --clean --no-install
(cd ios && pod install --repo-update)
if ! xcodebuild -workspace ios/ZOLNU.xcworkspace -scheme ZOLNU -configuration Release \
  -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath "$zolnu_temp/derived" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY='' ENABLE_BITCODE=NO \
  build > "$zolnu_output/build.log" 2>&1; then
  tail -n 180 "$zolnu_output/build.log"
  exit 1
fi
zolnu_app="$zolnu_temp/derived/Build/Products/Release-iphoneos/ZOLNU.app"
test -d "$zolnu_app"
zolnu_executable=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$zolnu_app/Info.plist")
test -f "$zolnu_app/$zolnu_executable"
xcrun lipo -info "$zolnu_app/$zolnu_executable" | grep -q arm64
test -f "$zolnu_app/main.jsbundle"
mkdir -p "$zolnu_temp/package/Payload"
cp -R "$zolnu_app" "$zolnu_temp/package/Payload/"
(cd "$zolnu_temp/package" && /usr/bin/zip -qry "$zolnu_output/ZOLNU-Sideloadly.ipa" Payload)
unzip -t "$zolnu_output/ZOLNU-Sideloadly.ipa"
shasum -a 256 "$zolnu_output/ZOLNU-Sideloadly.ipa" > "$zolnu_output/SHA256.txt"
echo 'Built a real arm64 IPA. It is unsigned and must be signed by Sideloadly before device installation.'
