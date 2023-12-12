import { Link, useLocalSearchParams, useNavigation } from 'expo-router';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { IconButton, List, TextInput, TextInputProps, useTheme } from 'react-native-paper';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from 'langchain/dist/schema';
import type { CallbackHandlerMethods } from 'langchain/dist/callbacks';
import { useLayoutEffect, useRef, useState } from 'react';
import { BaseChatModel } from 'langchain/dist/chat_models/base';

import {
    SessionSettings,
    useGetAllSessionMessagesQuery,
    useGetOpenAiApiKeyQuery,
    useGetSessionQuery,
    useSetSessionMessagesMutation,
} from '../../../../api/llm.api';
import { ChatOpenAI } from 'langchain/chat_models/openai';

export const unstable_settings = {
    initialRouteName: '(tabs)/session',
};

interface useStreamingLlmProps {
    model?: BaseChatModel;
    onStreamBegin?: CallbackHandlerMethods['handleLLMStart'];
    onStreamToken?: CallbackHandlerMethods['handleLLMNewToken'];
    onStreamError?: CallbackHandlerMethods['handleLLMError'];
    onStreamEnd?: CallbackHandlerMethods['handleLLMEnd'];
}

function useStreamingLlm({ model, onStreamBegin, onStreamEnd, onStreamError, onStreamToken }: useStreamingLlmProps) {
    const [streamedTokens, setStreamedTokens] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [error, setError] = useState<Error>();

    const sendMessage = async (messages: BaseMessage[]) => {
        console.log(messages);
        setIsLoading(true);
        setIsError(false);
        let response: BaseMessage | undefined;

        try {
            response = await model?.call(messages, {
                callbacks: [
                    {
                        handleLLMStart(...params) {
                            onStreamBegin?.(...params);
                            setStreamedTokens('');
                            setIsStreaming(true);
                        },
                        handleLLMNewToken(...params) {
                            onStreamToken?.(...params);
                            const [token] = params;
                            setStreamedTokens((tokens) => (tokens += token));
                        },
                        handleLLMEnd(...params) {
                            onStreamEnd?.(...params);
                            setIsStreaming(false);
                            setStreamedTokens('');
                        },
                        handleLLMError(...params) {
                            onStreamError?.(...params);
                        },
                    },
                ],
            });
        } catch (err) {
            setIsError(true);
            setError(err as Error);
        } finally {
            setIsLoading(false);
            return response;
        }
    };

    return { sendMessage, streamedTokens, isStreaming, isLoading, isError, error };
}

function useSessionChatModel(session?: SessionSettings) {
    const { data: openAIApiKey } = useGetOpenAiApiKeyQuery();
    const chatModel = !session || !openAIApiKey ? undefined : new ChatOpenAI({ ...session, openAIApiKey });
    return { chatModel };
}

export default function ChatSessionScreen() {
    const flatListRef = useRef<FlatList>(null);
    const { setOptions } = useNavigation();
    const { session_name } = useLocalSearchParams<{ session_name: string }>();
    const { data: messages } = useGetAllSessionMessagesQuery(session_name);
    const { mutateAsync: setMessages } = useSetSessionMessagesMutation(session_name);
    const { data: session } = useGetSessionQuery(session_name);
    const { chatModel } = useSessionChatModel(session);
    const { sendMessage, isStreaming, streamedTokens, isLoading: responseLoading } = useStreamingLlm({ model: chatModel });

    const displayedMessages = messages?.concat(isStreaming ? new AIMessage({ content: streamedTokens }) : []).reverse();

    useLayoutEffect(() => {
        setOptions({
            title: session_name,
            headerRight: () => (
                <Link href={`/session/${session_name}/detail`} asChild>
                    <IconButton icon='information' style={{ marginVertical: 'auto' }} />
                </Link>
            ),
        });
    }, []);

    const handleSubmit = async (content: string) => {
        const systemMessage = session?.systemPrompt ? new SystemMessage({ content: session.systemPrompt }) : undefined;
        const humanMessage = new HumanMessage({ content });
        const newMessages = (messages ?? []).concat(humanMessage);
        await setMessages(newMessages);
        const requestMessages = newMessages.slice(0, 20);
        systemMessage && requestMessages.unshift(systemMessage);

        const aiMessage = await sendMessage(requestMessages);
        if (!aiMessage) return;
        await setMessages((newMessages ?? [])?.concat(aiMessage));
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior='padding' enabled={Platform.OS === 'ios'} keyboardVerticalOffset={90}>
            <FlatList
                inverted
                ref={flatListRef}
                data={(displayedMessages ?? []) as BaseMessage[]}
                keyExtractor={(_message, index) => `${index}`}
                renderItem={({ item: message }) => <MessageItem message={message} />}
                scrollEventThrottle={500}
                onScroll={(e) => e}
                onContentSizeChange={(_width, height) => height}
            />
            <ChatInput
                onSubmit={handleSubmit}
                isSendDisabled={responseLoading}
                onFocus={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
            />
        </KeyboardAvoidingView>
    );
}

interface ChatInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'onSubmitEditing' | 'right'> {
    onSubmit: (input: string) => Promise<void> | void;
    isSendDisabled?: boolean;
    keepInputAfterSubmit?: boolean;
}

const ChatInput = ({ onSubmit, style, isSendDisabled, keepInputAfterSubmit, ...textInputProps }: ChatInputProps) => {
    const theme = useTheme();
    const [input, setInput] = useState<string>('');

    const handleSubmit = () => {
        onSubmit(input?.trim());
        if (!keepInputAfterSubmit) setInput('');
    };

    return (
        <TextInput
            multiline
            placeholder='I want to ask about...'
            style={[{ maxHeight: 300, borderTopLeftRadius: 0, borderTopRightRadius: 0 }, style]}
            {...textInputProps}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSubmit}
            right={
                // todo: align this to bottom of input
                <TextInput.Icon
                    disabled={isSendDisabled || !input.trim().length}
                    icon={isSendDisabled ? 'arrow-up-circle-outline' : 'arrow-up-circle'}
                    color={theme.colors.primary}
                    onPress={handleSubmit}
                />
            }
        />
    );
};

const MessageItem = ({ message }: { message: BaseMessage }) => {
    const theme = useTheme();
    const isAiMessage = message._getType() === 'ai';
    const isHumanMessage = message._getType() === 'human';

    const icon = isAiMessage ? 'robot' : isHumanMessage ? 'account' : 'help';

    return (
        <Pressable onLongPress={console.log}>
            {({ hovered }) => (
                <List.Item
                    title={message.content as string}
                    titleNumberOfLines={9999}
                    style={{
                        backgroundColor: isAiMessage
                            ? hovered
                                ? theme.colors.surfaceVariant
                                : theme.colors.inverseOnSurface
                            : hovered
                            ? theme.colors.surfaceVariant
                            : theme.colors.surface,
                    }}
                    left={({ color, style }) => (
                        <View>
                            <List.Icon color={color} style={style} icon={icon} />
                        </View>
                    )}
                    right={({ color, style }) => (
                        <Pressable onPress={console.log}>
                            {({ hovered: buttonHovered }) => (
                                <List.Icon color={color} style={[style, { opacity: hovered || buttonHovered ? 1 : 0 }]} icon='dots-vertical' />
                            )}
                        </Pressable>
                    )}
                />
            )}
        </Pressable>
    );
};
