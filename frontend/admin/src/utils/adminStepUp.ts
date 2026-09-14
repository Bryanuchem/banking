export type AdminStepUpRequest = {
  scope: string;
  resolve: (token: string | undefined) => void;
  reject: (error: Error) => void;
};

type Listener = (request: AdminStepUpRequest) => void;

let listener: Listener | null = null;

export function subscribeAdminStepUp(
  nextListener: Listener,
) {
  listener = nextListener;
  return () => {
    if (listener === nextListener) {
      listener = null;
    }
  };
}

export function requestAdminStepUp(
  scope: string,
) {
  return new Promise<string | undefined>(
    (resolve, reject) => {
      if (!listener) {
        reject(
          new Error(
            "Two-factor verification UI is unavailable.",
          ),
        );
        return;
      }

      listener({
        scope,
        resolve,
        reject,
      });
    },
  );
}
