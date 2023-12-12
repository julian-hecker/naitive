import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';

export const unstable_settings = {
    // Ensure that reloading on `/modal` keeps a back button present.
    initialRouteName: '(tabs)',
};

export default function TabLayout() {
    const theme = useTheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.colors.primary,
                tabBarIconStyle: { marginTop: 0 },
            }}
        >
            <Tabs.Screen
                name='session'
                options={{
                    title: 'Chats',
                    headerShown: false,
                    tabBarIcon: (props) => <MaterialCommunityIcons {...props} name='message-text' />,
                }}
            />
            <Tabs.Screen
                name='settings'
                options={{
                    title: 'Settings',
                    headerShown: false,
                    tabBarIcon: (props) => <FontAwesome {...props} name='gear' />,
                }}
            />
        </Tabs>
    );
}

/*
<Tabs.Screen
    name="index"
    options={{
        title: "Tab One",
        tabBarIcon: (props) => <FontAwesome {...props} name="code" />,
        headerRight: () => (
        <Link href="/modal" asChild>
            <Pressable>
            {({ pressed }) => (
                <FontAwesome
                name="info-circle"
                size={25}
                color={Colors[colorScheme ?? "light"].text}
                style={{
                    marginRight: 15,
                    opacity: pressed ? 0.5 : 1,
                }}
                />
            )}
            </Pressable>
        </Link>
        ),
    }}
/>
*/
