import { SnackbarVariant } from "@shared/ui/Snackbar";
import { useCallback, useState } from "react";

interface SnackbarState {
  isVisible: boolean;
  message: string;
  variant: SnackbarVariant;
}

export function useSnackbar() {
  const [state, setState] = useState<SnackbarState>({
    isVisible: false,
    message: "",
    variant: "info",
  });

  const show = useCallback(
    (message: string, variant: SnackbarVariant = "info") => {
      setState({ isVisible: true, message, variant });
    },
    [],
  );

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return { ...state, show, hide };
}
