import { useFocusEffect, useRouter } from 'expo-router';

export default function LandingScreen() {
    const router = useRouter();

    useFocusEffect(() => {
        router.replace('/session/');
    });
}
