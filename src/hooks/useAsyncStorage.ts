import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useAsyncStorage<T = unknown>(key: string, initialValue?: T) {
  const [data, setData] = useState<T | null>(initialValue ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem(key);
        value && setData(JSON.parse(value) || initialValue);
        setLoading(false);
      } catch (error) {
        console.error("useAsyncStorage getItem error:", error);
      }
    })();
  }, [key, initialValue]);

  const update = async (value: T): Promise<T> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      setData(value);
    } catch (error) {
      console.error("useAsyncStorage setItem error:", error);
    }
    return value;
  };

  return { data, setData: update, loading };
}
