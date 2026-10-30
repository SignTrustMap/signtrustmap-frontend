import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";
import { useTheme } from "@/hooks/use-theme";
import type { RouteSign } from "@/api/navigation/navigation";
import { styles } from "../styles/navigation-map-screen.styles";

export interface UpcomingSignItem extends RouteSign {
  distanceMeters: number;
}

export interface NavigationUpcomingSignsProps {
  signs: UpcomingSignItem[];
}

export function NavigationUpcomingSigns({ signs }: NavigationUpcomingSignsProps) {
  const theme = useTheme();

  if (signs.length === 0) return null;

  return (
    <SafeAreaView
      edges={["top"]}
      pointerEvents="none"
      style={styles.upcomingSignsOverlay}
    >
      <View
        style={[
          styles.upcomingSignsPanel,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.upcomingSignsPanelLabel, { color: theme.grey }]}>
          Phía trước
        </Text>
        {signs.map((sign) => (
          <View key={sign.id} style={styles.upcomingSignRow}>
            {sign.imageUrl ? (
              <ExpoImage
                accessibilityLabel={sign.name ?? "Biển báo"}
                contentFit="contain"
                source={{ uri: sign.imageUrl }}
                style={styles.upcomingSignImage}
              />
            ) : null}
            <View style={styles.upcomingSignInfo}>
              <Text
                numberOfLines={1}
                style={[styles.upcomingSignName, { color: theme.text }]}
              >
                {sign.name ?? "Biển báo"}
              </Text>
              <Text
                style={[
                  styles.upcomingSignDist,
                  { color: theme.text, fontWeight: "700" },
                ]}
              >
                {sign.distanceMeters < 1000
                  ? `${Math.round(sign.distanceMeters)} m`
                  : `${(sign.distanceMeters / 1000).toFixed(1)} km`}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
