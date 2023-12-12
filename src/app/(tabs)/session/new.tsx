import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Checkbox, HelperText, List, TextInput, useTheme } from 'react-native-paper';
import { SessionSettings, useCreateSessionMutation, useGetOpenAiApiKeyQuery, useGetOpenAiModels } from '../../../api/llm.api';
import { Controller, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import DropDown from 'react-native-paper-dropdown';

export default function NewSessionScreen() {
    const router = useRouter();
    const theme = useTheme();

    const { data: OPENAI_API_KEY } = useGetOpenAiApiKeyQuery();
    const { data: openAIModels, isLoading: modelsLoading, error: modelsError } = useGetOpenAiModels(OPENAI_API_KEY ?? '');
    const [isDropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const { control, handleSubmit } = useForm<SessionSettings>();
    const convoName = useWatch({ name: 'convoName', control });
    const { mutateAsync: saveSession } = useCreateSessionMutation(convoName);

    const onSubmit: SubmitHandler<SessionSettings> = async (data) => {
        try {
            await saveSession(data);
            router.back();
            router.push(`/session/${convoName}`);
        } catch (err) {
            alert(err);
        }
    };

    return (
        <ScrollView style={{ flex: 1, padding: 32, flexDirection: 'column' }}>
            <Controller
                name='convoName'
                control={control}
                defaultValue=''
                rules={{ required: { value: true, message: 'Conversation name is required' } }}
                render={({ field, fieldState }) => (
                    <>
                        <TextInput
                            mode='outlined'
                            label='Conversation Name'
                            value={field.value}
                            onChangeText={field.onChange}
                            disabled={field.disabled}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            outlineColor={fieldState.invalid ? theme.colors.error : undefined}
                        />
                        <HelperText type='error'>{fieldState.error?.message ?? ' '}</HelperText>
                    </>
                )}
            />
            <Controller
                name='modelName'
                control={control}
                defaultValue='gpt-3.5-turbo'
                rules={{ required: { value: true, message: 'Model Name is Required' } }}
                render={({ field, fieldState }) => (
                    <>
                        <DropDown
                            label='OpenAI Model Name'
                            value={field.value}
                            setValue={field.onChange}
                            list={(openAIModels ?? [{ id: 'gpt-3.5-turbo' }])
                                .slice()
                                .filter((model) => model.id.includes('gpt'))
                                .sort((a, b) => a.id.localeCompare(b.id))
                                .map((model) => ({ value: model.id, label: model.id }))}
                            inputProps={{ outlineColor: modelsError ? theme.colors.error : undefined }}
                            mode='outlined'
                            visible={isDropdownOpen}
                            showDropDown={() => !modelsLoading && !modelsError && setDropdownOpen(true)}
                            onDismiss={() => {
                                setDropdownOpen(false);
                                field.onBlur();
                            }}
                        />
                        <HelperText type='error'>{fieldState.error?.message ?? modelsError?.message ?? ' '}</HelperText>
                    </>
                )}
            />
            <Controller
                name='systemPrompt'
                control={control}
                defaultValue=''
                render={({ field, fieldState }) => (
                    <>
                        <TextInput
                            label='System Prompt (optional)'
                            mode='outlined'
                            placeholder='You are a friendly AI Assistant...'
                            value={field.value}
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            disabled={field.disabled}
                            multiline
                            outlineColor={fieldState.invalid ? theme.colors.error : undefined}
                        />
                        <HelperText type='error'>{fieldState.error?.message ?? ' '}</HelperText>
                    </>
                )}
            />
            <Controller
                name='streaming'
                control={control}
                defaultValue={true}
                render={({ field, fieldState }) => (
                    <>
                        <List.Item
                            title={`Streaming ${field.value ? 'enabled' : 'disabled'}`}
                            left={(props) => <Checkbox.Android {...props} status={field.value ? 'checked' : 'unchecked'} />}
                            onPress={() => field.onChange(!field.value)}
                        />
                        <HelperText type='error'>{fieldState.error?.message ?? ' '}</HelperText>
                    </>
                )}
            />

            <Button mode='contained-tonal' style={{ alignSelf: 'center' }} onPress={handleSubmit(onSubmit)}>
                Create Conversation
            </Button>
        </ScrollView>
    );
}
