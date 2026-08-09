import { Button, Host } from '@expo/ui'
import { Text, StyleSheet, View } from 'react-native'

export function AppButton(
    { onPress }: { onPress: () => void }
) {
    return (
        <View style={styles.buttonContainer}>
            <Host matchContents>
                <Button
                    variant='text'
                    onPress={onPress}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Log in</Text>
                </Button>
            </Host>
        </View>
    )
}

const styles = StyleSheet.create({
    buttonContainer: {
        alignItems: 'center',
    },
    button: {
        borderRadius: 4,
        backgroundColor: '#208AEF',
    },

    buttonText: {
        color: '#fff',
    }
})