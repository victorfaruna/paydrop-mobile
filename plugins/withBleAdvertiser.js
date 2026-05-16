const { withDangerousMod, createRunOncePlugin } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Ensures react-native-ble-advertiser iOS podspec works with modern React Native
 * and is picked up during expo prebuild / EAS builds.
 */
function withBleAdvertiserPodspec(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podspecPath = path.join(
        cfg.modRequest.projectRoot,
        "node_modules",
        "react-native-ble-advertiser",
        "ios",
        "react-native-ble-advertiser.podspec",
      );

      if (fs.existsSync(podspecPath)) {
        let contents = fs.readFileSync(podspecPath, "utf8");
        if (contents.includes("s.dependency 'React'")) {
          contents = contents.replace(
            "s.dependency 'React'",
            "s.dependency 'React-Core'",
          );
          fs.writeFileSync(podspecPath, contents);
        }
      }

      return cfg;
    },
  ]);
}

module.exports = createRunOncePlugin(
  withBleAdvertiserPodspec,
  "with-ble-advertiser",
  "1.0.0",
);
