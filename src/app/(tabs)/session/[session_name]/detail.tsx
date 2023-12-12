import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { Text } from 'react-native-paper';

import { useGetSessionQuery } from '../../../../api/llm.api';

export const unstable_settings = {
    initialRouteName: '(tabs)/session/[session_name]/index',
};

export default function SessionDetailScreen() {
    const { session_name } = useLocalSearchParams<{ session_name: string }>();
    const { data: session } = useGetSessionQuery(session_name);

    return (
        <ScrollView>
            <Text>{JSON.stringify(session)}</Text>
        </ScrollView>
    );
}
