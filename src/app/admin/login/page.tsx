import LoginForm from "@/components/admin/LoginForm";

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const { denied } = await props.searchParams;
  return <LoginForm denied={denied === "1"} />;
}
