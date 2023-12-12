import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { List } from 'react-native-paper';

export default function SettingsScreen() {
    const router = useRouter();

    return (
        <ScrollView style={StyleSheet.absoluteFill}>
            <List.Item
                title='API Keys'
                left={(props) => <List.Icon {...props} icon='key' />}
                right={(props) => <List.Icon {...props} icon='chevron-right' />}
                onPress={() => router.push('/settings/api_keys/')}
            />
        </ScrollView>
    );
}
