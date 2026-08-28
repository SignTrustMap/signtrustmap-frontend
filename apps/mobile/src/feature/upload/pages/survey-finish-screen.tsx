import { AppButton } from "@/components/ui/button";
import { useBackButton } from "@/hooks/use-back-button";
import { useRouter } from "expo-router";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SurveyFinishScreenProps = {};

export function SurveyFinishScreen({ }: SurveyFinishScreenProps) {

    const router = useRouter();

    const handleBackToHome = () => {
        router.replace('/work');
    }

    const handleSubmitAnotherSurvey = () => {
        router.replace('/work/new-survey')
    }

    useBackButton('/work');

    return (
        <View>
            <SafeAreaView>
                <View>
                    <Text>✓</Text>
                    <View>
                        <Text>Survey complete</Text>
                        <Text>
                            Thank you for completing the survey. Your responses have been submitted successfully.
                        </Text>
                    </View>
                    <AppButton
                        label="Submit another survey"
                        onPress={() => handleSubmitAnotherSurvey()}
                    />
                    <AppButton
                        label="Return to surveyor's home"
                        onPress={() => handleBackToHome()}
                    />
                </View>
            </SafeAreaView>
        </View>
    )
}