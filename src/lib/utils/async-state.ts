export type AsyncState<T> =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string };

export function successState<T>(data: T): AsyncState<T> {
  return { data, error: null, status: "success" };
}

export function errorState<T = never>(error: string): AsyncState<T> {
  return { data: null, error, status: "error" };
}

