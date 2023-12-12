import { ScrollView, View } from 'react-native';
import { useGetApiKeyQuery, useGetOpenAiModels, useSetApiKeyMutation } from '../../../api/llm.api';
import { useEffect, useState } from 'react';
import { HelperText, TextInput, useTheme } from 'react-native-paper';

// add information like where you can get an api key, icon, description, link
const API_PROVIDERS: string[] = ['openai'];

export default function ApiKeysScreen() {
    return (
        <ScrollView contentContainerStyle={{ padding: 32, gap: 20 }}>
            {API_PROVIDERS.map((provider) => (
                <ApiKeyInput provider={provider} key={provider} />
            ))}
        </ScrollView>
    );
}

interface ApiKeyInputProps {
    provider: string;
}

const ApiKeyInput = ({ provider }: ApiKeyInputProps) => {
    const { data: currentApiKey, isLoading } = useGetApiKeyQuery(provider);
    const { error, isLoading: testingKey } = useGetOpenAiModels(currentApiKey ?? '');
    const { mutateAsync, isLoading: isSubmitting } = useSetApiKeyMutation(provider);
    const [input, setInput] = useState<string>('');
    const theme = useTheme();

    useEffect(() => {
        setInput(currentApiKey ?? '');
    }, [currentApiKey]);

    const handleSubmit = async () => await mutateAsync(input);

    return (
        <View>
            <TextInput
                label={`${provider.toUpperCase()} API Key`}
                mode='outlined'
                disabled={isLoading || isSubmitting}
                value={input}
                multiline
                onChangeText={setInput}
                onSubmitEditing={handleSubmit}
                right={
                    <TextInput.Icon
                        icon={isSubmitting ? 'check-circle-outline' : 'check-circle'}
                        color={theme.colors.primary}
                        disabled={isLoading || isSubmitting}
                        onPress={handleSubmit}
                    />
                }
            />
            <HelperText type={!error ? 'info' : 'error'}>
                {currentApiKey ? (testingKey ? 'Testing Key...' : error ? error?.message : 'Success! OpenAI Connected!') : ' '}
            </HelperText>
        </View>
    );
};
