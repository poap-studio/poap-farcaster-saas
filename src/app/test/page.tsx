import Link from "next/link";

export default function TestPage() {
  return (
    <div>
      <h1>Test Page</h1>
      <p>Si ves esto, las rutas funcionan.</p>
      <Link href="/">Ir a Admin</Link>
    </div>
  );
}