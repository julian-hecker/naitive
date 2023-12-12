import '../polyfills';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BaseChatModel } from 'langchain/dist/chat_models/base';
import { BaseMessage } from 'langchain/dist/schema';
import { load } from 'langchain/load';
import OpenAI from 'openai';
import { useMutation, useQuery, useQueryClient } from 'react-query';

export const apiKeyKey = 'api_keys';
export const openAiKey = 'openai';

export function useSetApiKeyMutation(provider: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: [apiKeyKey, provider],
        mutationFn: async (apiKey: string) => await AsyncStorage.setItem(`${apiKeyKey}/${provider}`, apiKey),
        onSettled: () => queryClient.invalidateQueries({ queryKey: [apiKeyKey] }),
    });
}

export const useGetApiKeyQuery = (provider: string) =>
    useQuery({
        queryKey: [apiKeyKey, provider],
        queryFn: async () => await AsyncStorage.getItem(`${apiKeyKey}/${provider}`),
    });

export function useSetOpenAiApiKeyMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: [apiKeyKey, openAiKey],
        mutationFn: async (apiKey: string) => await AsyncStorage.setItem(apiKeyKey, apiKey),
        onSettled: () => queryClient.invalidateQueries({ queryKey: [apiKeyKey, openAiKey] }),
    });
}

export const useGetOpenAiApiKeyQuery = () =>
    useQuery({
        queryKey: [apiKeyKey, openAiKey],
        queryFn: async () => await AsyncStorage.getItem(`${apiKeyKey}/${openAiKey}`),
    });

export function useGetOpenAiModels(apiKey: string) {
    return useQuery({
        queryKey: [apiKeyKey, openAiKey, apiKey, 'models'],
        queryFn: async () => (await new OpenAI({ apiKey, dangerouslyAllowBrowser: true }).models.list()).data,
        onError: (err: Error) => err,
        enabled: !!apiKey,
        retry: false,
        retryOnMount: false,
        refetchOnWindowFocus: false,
    });
}

export const sessionKey = 'sessions';

export interface SessionSettings {
    convoName: string;
    modelName: string;
    streaming: boolean;
    systemPrompt: string;
}

export function useGetSessionNamesQuery() {
    return useQuery({
        queryKey: [sessionKey],
        queryFn: async () => {
            const keys = (await AsyncStorage.getAllKeys())
                .filter((key) => key.startsWith(sessionKey) && !key.endsWith(messagesKey))
                .map((key) => key.split('/')[1])
                .sort((a, b) => a.localeCompare(b));
            return keys;
            // return (await Promise.all(keys.map(async (key) => await AsyncStorage.getItem(`${convoKey}/${key}`))))
            //   .filter((convo) => convo)
            //   .map((convo) => JSON.parse(convo!) as unknown as any);
        },
    });
}

export const useGetSessionQuery = (sessionName: string) =>
    useQuery({
        queryKey: [sessionKey, sessionName],
        queryFn: async () => JSON.parse((await AsyncStorage.getItem(`${sessionKey}/${sessionName}`)) ?? '{}') as SessionSettings,
    });

export function useCreateSessionMutation(sessionName: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: [sessionKey, sessionName],
        mutationFn: async (settings: SessionSettings) => {
            if (await AsyncStorage.getItem(`${sessionKey}/${sessionName}`)) throw new Error('Session name already exists!');
            await AsyncStorage.setItem(`${sessionKey}/${sessionName}`, JSON.stringify(settings));
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: [sessionKey] }),
    });
}

export const useUpdateSessionMutation = (sessionName: string, settings: Partial<SessionSettings>) =>
    useMutation({
        mutationKey: [sessionKey, sessionName],
        mutationFn: async () => {
            const convo = JSON.parse((await AsyncStorage.getItem(`${sessionKey}/${sessionName}`)) ?? '') as SessionSettings;
            if (!convo) throw new Error('Session does not exist!');
            // todo: merge old and new settings
        },
    });

export function useDeleteSessionMutation(sessionName: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: [sessionKey, sessionName],
        mutationFn: async () => {
            const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(`${sessionKey}/${sessionName}`));
            await AsyncStorage.multiRemove(keys);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: [sessionKey] }),
    });
}

export function useDeleteAllSessionsMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: [sessionKey],
        mutationFn: async () => {
            const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(sessionKey));
            await AsyncStorage.multiRemove(keys);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: [sessionKey] }),
    });
}

export const messagesKey = 'messages';

export const useGetAllSessionMessagesQuery = (sessionName: string) =>
    useQuery({
        queryKey: [sessionKey, sessionName, messagesKey, Infinity],
        queryFn: async () => await load<BaseMessage[]>((await AsyncStorage.getItem(`${sessionKey}/${sessionName}/${messagesKey}`)) ?? '[]'),
    });

export const useGetNSessionMessagesQuery = (sessionName: string, messageCount: number) =>
    useQuery({
        queryKey: [sessionKey, sessionName, messagesKey, messageCount],
        // todo: decide whether to store messages in reverse order or not
        // todo: learn how scrolling pagination is normally done
        queryFn: async () =>
            (await load<BaseMessage[]>((await AsyncStorage.getItem(`${sessionKey}/${sessionName}/${messagesKey}`)) ?? '[]')).slice(-messageCount),
    });

export function useSetSessionMessagesMutation(sessionName: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: [sessionKey, sessionName, messagesKey],
        mutationFn: async (messages: BaseMessage[]) =>
            await AsyncStorage.setItem(`${sessionKey}/${sessionName}/${messagesKey}`, JSON.stringify(messages.map((message) => message.toJSON()))),
        onSettled: () => queryClient.invalidateQueries({ queryKey: [sessionKey, sessionName, messagesKey] }),
    });
}

// export const chatModelsKey = 'chat_models';
