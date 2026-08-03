import { useEffect, useState } from "react";

export function useLocalStorage<T>(
  initialValue: T,
  load: () => T,
  save: (value: T) => void,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    return load();
  });

  useEffect(() => {
    save(value);
  }, [save, value]);

  return [value, setValue];
}
