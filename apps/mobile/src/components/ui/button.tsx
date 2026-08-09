import { Button, Host } from '@expo/ui'

export function AppButton(
    { onPress }: { onPress: () => void }

) {
    return (
        <Host matchContents>
            <Button
                variant='filled'
                label='Sign in with Google'
                onPress={onPress}
            />
        </Host>
    )
}