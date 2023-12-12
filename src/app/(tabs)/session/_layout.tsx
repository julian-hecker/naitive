import { Stack } from 'expo-router';

export const unstable_settings = {
    initialRouteName: 'index',
};

export default function SessionLayout() {
    return (
        <Stack>
            <Stack.Screen name='index' options={{ title: 'My Chats' }} />
            <Stack.Screen name='new' options={{ title: 'New Chat' }} />
            <Stack.Screen name='[session_name]/index' options={{ title: 'Chat Session' }} />
            <Stack.Screen name='[session_name]/detail' options={{ title: 'Chat Settings' }} />
        </Stack>
    );
}
