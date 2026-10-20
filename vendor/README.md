# Online Java assets

The browser runner uses CheerpJ 4.3, Java 8. Its loader/runtime come only from
https://cjrtnc.leaningtech.com/4.3/loader.js, on demand after Run code. No runtime
files are copied here. Community licence attribution is the official CheerpJ logo
in `public/cheerpj.svg`, from Leaning Technologies' JavaFiddle
`src/lib/assets/cheerpj/logotype-white.svg`; upstream notice: `javafiddle-LICENSE.txt`.
See https://cheerpj.com/docs/licensing for runtime terms.

## Compiler and source

`java-runtime/public/javac.jar` contains only the unmodified `com/sun/tools/javac/`,
`com/sun/source/` and `com/sun/tools/doclint/` entries from Eclipse Temurin OpenJDK
8u504-b01's `lib/tools.jar`. `javac-sources.zip` contains those same paths from
its `src.zip`, including each source file's copyright notices. No proprietary
Oracle JDK binary is included. No compiler changes were made. The matching
LICENSE, ASSEMBLY_EXCEPTION and THIRD_PARTY_README are served beside both files.
They include GPLv2 with the Classpath exception as designated in source headers.

Upstream archive:
https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u504-b01/OpenJDK8U-jdk_x64_linux_hotspot_8u504b01.tar.gz

Archive SHA-256: `9c70e102f527ac674ac2fe9c7d47b9a04e2d19842ba5ab8e9b33f368bbadfaea`.
Verify that checksum, extract, then filter the two ZIPs to the three prefixes above
(without altering individual entries). The corresponding source remains available
at the public runner's `/javac-sources.zip` address, alongside license notices.

- `javac.jar` SHA-256: `80ff0e2bb7b2d6f8dddd4af5fffb1e8e1dfa7f56e4817c4a1e9adf55e6526af6`
- `javac-sources.zip` SHA-256: `b808ff953a70466f32926489fdda584af7bac1a2d9e72e83ea0024974fa7f39f`

## CodeShare bridge

`java/CodeShareJava.java` is CodeShare's small bridge, separate from OpenJDK.
Rebuild its committed JAR from the repository root with
`node scripts/build-java-bridge.mjs` (JDK with javac --release 8 and jar required).
The JAR embeds the source SHA-256 so tests detect a forgotten rebuild without
requiring byte-identical output across JDK versions. Normal app/Cloudflare builds
need no JDK: the JAR is already committed. Keep source and built JAR together.
