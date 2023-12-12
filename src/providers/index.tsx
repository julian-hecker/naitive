import { PropsWithChildren } from "react";
import { QueryProvider } from "./QueryProvider";
import { StyleProvider } from "./StyleProvider";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <StyleProvider>{children}</StyleProvider>
    </QueryProvider>
  );
}
