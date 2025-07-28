export const metadata = {
  title: "BEACON EXPO",
  description: "Sample description",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col">{children}</div>;
}
