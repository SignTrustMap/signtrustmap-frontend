import { StyleSheet, View } from "react-native";
import { Spacing, Rounded, Colors } from "@/constants/theme";

export function Divider({ style }: { style?: any }) {
    return (
        <View style={[styles.divider, style]}>
        </View>
    )
}

const styles = StyleSheet.create({
    divider: {
        width: 1,
        height: 1,
        backgroundColor: Colors.grey,
        marginVertical: 12,
    },
})