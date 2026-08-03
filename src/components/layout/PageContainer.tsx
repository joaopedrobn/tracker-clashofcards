import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[1440px] px-3 pb-20 sm:px-6 lg:px-8">{children}</main>;
}
