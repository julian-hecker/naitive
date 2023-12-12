import { Stack } from 'expo-router';

export const unstable_settings = {
    initialRouteName: 'index',
};

export default function SettingsLayout() {
    return (
        <Stack>
            <Stack.Screen name='index' options={{ title: 'Settings' }} />
            <Stack.Screen name='api_keys' options={{ title: 'API Keys' }} />
        </Stack>
    );
}
