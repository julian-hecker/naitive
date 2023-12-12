import { useRouter } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet } from 'react-native';
import { Divider, List } from 'react-native-paper';
import { useDeleteAllSessionsMutation, useDeleteSessionMutation, useGetSessionNamesQuery } from '../../../api/llm.api';

export default function ConversationsTabScreen() {
    const { data: conversations, isLoading } = useGetSessionNamesQuery();
    const { mutate: deleteAllConversations } = useDeleteAllSessionsMutation();
    const router = useRouter();

    return (
        <ScrollView style={StyleSheet.absoluteFill}>
            <List.Item
                title='Create new Conversation'
                left={(props) => <List.Icon {...props} icon='plus' />}
                right={(props) => <List.Icon {...props} icon='chevron-right' />}
                onPress={() => router.push(`/session/new`)}
                onLongPress={deleteAlert(
                    'Delete All Conversations',
                    'Are you sure you want to delete all conversations? Once deleted, they cannot be restored.',
                    deleteAllConversations
                )}
            />
            <Divider />
            {isLoading ? (
                <List.Item title='Loading...' description='Please wait' />
            ) : conversations?.length ? (
                conversations?.map((convo) => <ConversationItem convo={convo} key={convo} />)
            ) : (
                <List.Item title='No conversations yet' />
            )}
        </ScrollView>
    );
}

const ConversationItem = ({ convo }: { convo: string }) => {
    const router = useRouter();
    const { mutate: deleteConversation } = useDeleteSessionMutation(convo);

    return (
        <List.Item
            title={convo}
            onPress={() => router.push(`/session/${convo}`)}
            onLongPress={deleteAlert(
                'Delete Conversation',
                `Are you sure you want to delete the conversation "${convo}"? This cannot be undone.`,
                deleteConversation
            )}
            right={(props) => <List.Icon {...props} icon='chevron-right' />}
        />
    );
};

const deleteAlert = (title: string, message: string, destructiveAction: () => void) => () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android')
        Alert.alert(title, message, [
            { text: 'Cancel', isPreferred: true, style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: destructiveAction },
        ]);

    if (window && window.confirm) window.confirm(title + '\n\n' + message) && destructiveAction();
};
